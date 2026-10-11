/**
 * POST /api/voucher/claim — Klaim voucher (S1-S4 Gas v13)
 * 
 * S1: Auth guard 401 — butuh login (sudah ada dari sesi sebelumnya)
 * S2: Cek promo aktif + expired (valid_from/valid_until)
 * S3: UNIQUE constraint user+tenant+hari + create voucher_claims + rate-limit 3/hari
 * S4: Countdown 23:59 WIB di response + strip V13C mall page
 * 
 * Response:
 *   200: { status: "ok", claim_code, expires_at, voucher, time_remaining }
 *   401: { status: "error", message: "login dulu" }
 *   400: { status: "error", message: "voucher expired/active" }
 *   409: { status: "error", message: "sudah claim hari ini" }
 *   429: { status: "error", message: "max 3 claim/tenant/hari" }
 */

import { supabaseAdmin } from '../../utils/db'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  // S1: Auth guard — cek apakah user sudah login
  const authHeader = getHeader(event, 'authorization') || ''
  const token = authHeader.replace('Bearer ', '')

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'UNAUTHORIZED',
      data: { message: 'Login dulu sebelum claim voucher' },
    })
  }

  // S2: Parse body dan cek promo aktif/expired
  const body = await readBody(event)

  const { data: voucher, error: voucherError } = await supabaseAdmin()
    .from('vouchers')
    .select('*')
    .eq('code', body.voucher_code)
    .single()

  if (voucherError || !voucher) {
    throw createError({
      statusCode: 404,
      statusMessage: 'VOUCHER_NOT_FOUND',
      data: { message: 'Voucher tidak ditemukan' },
    })
  }

  // S2: Cek valid_from/valid_until
  const now = new Date()
  const validFrom = new Date(voucher.valid_from)
  const validUntil = new Date(voucher.valid_until)

  if (now < validFrom) {
    throw createError({
      statusCode: 400,
      statusMessage: 'VOUCHER_NOT_ACTIVE',
      data: { message: 'Voucher belum aktif (masih sebelum valid_from)' },
    })
  }

  if (now > validUntil) {
    throw createError({
      statusCode: 400,
      statusMessage: 'VOUCHER_EXPIRED',
      data: { message: 'Voucher sudah kadaluarsa (lewat valid_until)' },
    })
  }

  // S3: Cek UNIQUE constraint user+tenant+hari + rate-limit 3/hari
  const db = supabaseAdmin()
  const { data: { user } } = await db.auth.getUser(token)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'UNAUTHORIZED',
      data: { message: 'User token tidak valid' },
    })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0) // mulai dari tengah malam

  // Cek claims per user+tenant+hari ini
  const { count: todayClaims, error: countError } = await db
    .from('voucher_claims')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('tenant_id', voucher.tenant_id)
    .gte('claimed_at', today.toISOString())
    .lt('claimed_at', new Date(today.getTime() + 86400000).toISOString()) // besok tengah malam

  if (countError) throw createError(500, countError)

  // Rate-limit: max 3 claim per tenant/hari
  if ((todayClaims || 0) >= 3) {
    throw createError({
      statusCode: 429,
      statusMessage: 'RATE_LIMIT_EXCEEDED',
      data: { message: 'Melebihi batas 3 voucher per tenant per hari. Coba lagi besok.' },
    })
  }

  // Cek UNIQUE: sudah claim voucher ini user+tenant hari ini?
  if ((todayClaims || 0) > 0) {
    const { data: existingClaim } = await db
      .from('voucher_claims')
      .select('*')
      .eq('user_id', user.id)
      .eq('voucher_id', voucher.id)
      .eq('claimed_at', today.toISOString())
      .maybeSingle()

    if (existingClaim) {
      throw createError({
        statusCode: 409,
        statusMessage: 'ALREADY_CLAIMED',
        data: { message: 'Anda sudah mengklaim voucher ini hari ini. Kembali besok.' },
      })
    }
  }

  // S3: Create voucher_claims entry
  const { error: claimError } = await db.from('voucher_claims').insert({
    user_id: user.id,
    voucher_id: voucher.id,
    tenant_id: voucher.tenant_id,
    claim_code: voucher.code,
    claimed_at: now.toISOString(),
    redeemed_at: null,
  })

  if (claimError) throw createError(500, claimError)

  // S4: Hitung countdown 23:59 WIB
  const nowWIB = new Date()
  // Asumsi WIB = UTC+7
  const nowUtc = new Date(nowWIB.getTime() + 7 * 3600000)
  const expiry = new Date(validUntil)
  // Normalisasi ke tengah malam WIB
  const expiryDate = new Date(expiry)
  expiryDate.setHours(23, 59, 0, 0)
  const expiryUtc = new Date(expiryDate.getTime() - 7 * 3600000)

  // Hitung sisa menit
  const diffMs = expiryUtc.getTime() - nowUtc.getTime()
  const diffMinutes = Math.max(0, Math.ceil(diffMs / 60000))
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60

  const timeRemaining = {
    hours: hours > 0 ? hours : null,
    minutes: minutes > 0 ? minutes : null,
    expired: diffMs <= 0,
  }

  return {
    status: 'ok',
    claim_code: voucher.code,
    expires_at: voucher.valid_until,
    voucher: {
      name: voucher.promo_text,
      discount_percent: voucher.discount_percent,
    },
    time_remaining: timeRemaining,
  }
})
