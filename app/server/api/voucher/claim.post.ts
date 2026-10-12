/**
 * POST /api/voucher/claim — Klaim voucher (S1-S4 Gas v13, fix skema real 13 Okt 2026).
 *
 * APA: auth guard 401 → cek vouchers aktif/expired → anti-farming UNIQUE(user,tenant,hari)
 *   + rate-limit 3/hari (global) → dual-write voucher_claims (kolom lama+baru) → countdown 23:59 WIB.
 * KENAPA fix: migration-base.sql (§6 voucher_claims lama: user_id/tenant_id/date/code/redeemed
 *   + UNIQUE(user,tenant,date), code NOT NULL) vs kode lama cuma insert kolom baru
 *   (voucher_id/claim_code/claimed_at) → code NULL → 500 + cek existing pakai
 *   eq(claimed_at, midnight) yang tidak pernah match → 409 bocor. Fix pakai claim_date
 *   YYYY-MM-DD WIB + dual-write date+code lama biar NOL 500 di prod.
 * Contoh: POST {voucher_code:'WKD-7X2K9A'} + Bearer valid → 200 {claim_code, expires_at, time_remaining}.
 *
 * Response:
 *   200: { status: "ok", claim_code, expires_at, voucher, time_remaining }
 *   400: { status: "error", message: "voucher_code wajib / expired / belum aktif / nonaktif" }
 *   401: { status: "error", message: "login dulu / token tidak valid" }
 *   404: { status: "error", message: "voucher tidak ditemukan" }
 *   409: { status: "error", message: "sudah claim hari ini" }
 *   429: { status: "error", message: "max 3 claim/hari" }
 */

import { supabaseAdmin } from '../../utils/db'
import { createError } from 'h3'

function todayWIB(): string {
  // YYYY-MM-DD Asia/Jakarta (en-CA = ISO date, stabil).
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}

function expiryWIBToday(): Date {
  // 23:59 WIB hari ini sebagai Date (pakai offset +07:00 eksplisit, anti-bug TZ server UTC).
  return new Date(`${todayWIB()}T23:59:00+07:00`)
}

export default defineEventHandler(async (event) => {
  // S1: Auth guard — butuh login (Bearer token Supabase).
  const authHeader = getHeader(event, 'authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'UNAUTHORIZED',
      data: { message: 'Login dulu sebelum claim voucher' },
    })
  }

  // S2: Parse body + validasi input.
  const body = await readBody<{ voucher_code?: string }>(event)
  const code = String(body?.voucher_code || '').trim().toUpperCase()

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'VOUCHER_CODE_REQUIRED',
      data: { message: 'voucher_code wajib diisi (contoh: WKD-7X2K9A)' },
    })
  }

  const db = supabaseAdmin()

  const { data: voucher, error: voucherError } = await db
    .from('vouchers')
    .select('*')
    .eq('code', code)
    .maybeSingle()

  if (voucherError || !voucher) {
    throw createError({
      statusCode: 404,
      statusMessage: 'VOUCHER_NOT_FOUND',
      data: { message: 'Voucher tidak ditemukan' },
    })
  }

  // S2: promo dimatikan manual → tolak (selain cek tanggal).
  if (voucher.promo_active === false) {
    throw createError({
      statusCode: 400,
      statusMessage: 'VOUCHER_INACTIVE',
      data: { message: 'Promo ini lagi nonaktif. Coba promo lain.' },
    })
  }

  const now = new Date()
  const validFrom = new Date(voucher.valid_from)
  const validUntil = new Date(voucher.valid_until)

  if (now < validFrom) {
    throw createError({
      statusCode: 400,
      statusMessage: 'VOUCHER_NOT_ACTIVE',
      data: { message: 'Voucher belum aktif. Coba lagi nanti.' },
    })
  }

  if (now > validUntil) {
    throw createError({
      statusCode: 400,
      statusMessage: 'VOUCHER_EXPIRED',
      data: { message: 'Voucher sudah kadaluarsa.' },
    })
  }

  // S3: verifikasi token → user.
  const { data: { user }, error: userError } = await db.auth.getUser(token)

  if (userError || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'UNAUTHORIZED',
      data: { message: 'User token tidak valid. Login ulang ya.' },
    })
  }

  // claim_date WIB (kolom baru) + date WIB (kolom lama) — 1 sumber tanggal.
  const claimDate = todayWIB()
  const nowIso = now.toISOString()

  // Rate-limit global: max 3 claim/hari/user (semua tenant). Cek dulu biar 429 menang atas 409.
  const { count: totalToday, error: totalError } = await db
    .from('voucher_claims')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('claim_date', claimDate)

  if (totalError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'DB_COUNT_FAILED',
      data: { message: 'Gagal cek quota harian. Coba lagi.' },
    })
  }

  if ((totalToday || 0) >= 3) {
    throw createError({
      statusCode: 429,
      statusMessage: 'RATE_LIMIT_EXCEEDED',
      data: { message: 'Batas maksimal 3 voucher per hari. Balik besok ya.' },
    })
  }

  // P0 lock: 1 user + 1 tenant + 1 hari = 1 claim (UNIQUE user,tenant,claim_date).
  const { data: existingTenant, error: existError } = await db
    .from('voucher_claims')
    .select('id')
    .eq('user_id', user.id)
    .eq('tenant_id', voucher.tenant_id)
    .eq('claim_date', claimDate)
    .maybeSingle()

  if (existError && existError.code !== 'PGRST116') {
    throw createError({
      statusCode: 500,
      statusMessage: 'DB_LOOKUP_FAILED',
      data: { message: 'Gagal cek claim. Coba lagi.' },
    })
  }

  if (existingTenant) {
    throw createError({
      statusCode: 409,
      statusMessage: 'ALREADY_CLAIMED',
      data: { message: 'Anda sudah mengklaim voucher tenant ini hari ini. Kembali besok.' },
    })
  }

  // S3: insert dual-write (kolom lama date/code + kolom baru claim_date/claim_code/dll).
  // KENAPA dua-duanya: base NOT NULL code + UNIQUE(date) tetap hidup; v13 baca claim_date.
  const { error: claimError } = await db.from('voucher_claims').insert({
    user_id: user.id,
    tenant_id: voucher.tenant_id,
    voucher_id: voucher.id,
    date: claimDate,
    claim_date: claimDate,
    code: voucher.code,
    claim_code: voucher.code,
    claimed_at: nowIso,
    redeemed: false,
    redeemed_at: null,
  })

  if (claimError) {
    // Race 2 klik bersamaan → UNIQUE nabrak → 409 ramah, bukan 500.
    if ((claimError as { code?: string }).code === '23505') {
      throw createError({
        statusCode: 409,
        statusMessage: 'ALREADY_CLAIMED',
        data: { message: 'Anda sudah mengklaim voucher tenant ini hari ini. Kembali besok.' },
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'DB_INSERT_FAILED',
      data: { message: 'Gagal simpan claim. Coba lagi.' },
    })
  }

  // S4: countdown ke 23:59 WIB hari ini.
  const expiry = expiryWIBToday()
  const diffMs = Math.max(0, expiry.getTime() - Date.now())
  const hours = Math.floor(diffMs / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)

  return {
    status: 'ok',
    claim_code: voucher.code,
    expires_at: expiry.toISOString(),
    voucher: {
      name: voucher.promo_text,
      discount_percent: voucher.discount_percent,
    },
    time_remaining: {
      hours,
      minutes,
      expired: diffMs <= 0,
    },
  }
})
