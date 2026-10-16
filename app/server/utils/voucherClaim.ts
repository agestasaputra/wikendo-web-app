/**
 * server/utils/voucherClaim.ts — Langkah-langkah klaim voucher (S1-S4 Gas v13, skema real 13 Okt 2026).
 *
 * APA: guard 401 → parse kode → voucher aktif/expired → verifikasi user → rate-limit 3/hari
 *   → anti-farming UNIQUE(user,tenant,hari) → dual-write voucher_claims → countdown 23:59 WIB.
 * KENAPA dipecah: handler lama 185 baris (batas hub-chat: 50 baris/fungsi, kompleksitas 10);
 *   tiap langkah = 1 fungsi kecil yang melempar createError. Urutan dipanggil: server/api/voucher/claim.post.ts.
 * KENAPA fix dual-write: migration-base (voucher_claims lama: user_id/tenant_id/date/code NOT NULL) vs kolom v13
 *   (claim_date/claim_code/claimed_at) — isi dua-duanya biar NOL 500 di prod.
 * Contoh: expiryWIBToday() → Date 23:59 WIB hari ini (offset +07:00 eksplisit, anti-bug TZ server UTC).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createError, getHeader, type H3Event } from "h3";
import type { VoucherRow } from "../../common/types/database";

const DAILY_CLAIM_LIMIT = 3;

/** Lempar error JSON konsisten: { statusCode, statusMessage, data.message }. */
function fail(
  statusCode: number,
  statusMessage: string,
  message: string,
): never {
  throw createError({ statusCode, statusMessage, data: { message } });
}

/** YYYY-MM-DD Asia/Jakarta (en-CA = ISO date, stabil). */
export function todayWIB(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

/** 23:59 WIB hari ini sebagai Date (offset +07:00 eksplisit, anti-bug TZ server UTC). */
export function expiryWIBToday(): Date {
  return new Date(`${todayWIB()}T23:59:00+07:00`);
}

/** S1: Auth guard — butuh Bearer token Supabase. */
export function requireBearerToken(event: H3Event): string {
  const authHeader = getHeader(event, "authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) fail(401, "UNAUTHORIZED", "Login dulu sebelum claim voucher");
  return token;
}

/** S2: kode voucher dari body, uppercase; kosong → 400. */
export function parseVoucherCode(
  body: { voucher_code?: string } | undefined,
): string {
  const code = String(body?.voucher_code || "")
    .trim()
    .toUpperCase();
  if (!code) {
    fail(
      400,
      "VOUCHER_CODE_REQUIRED",
      "voucher_code wajib diisi (contoh: WKD-7X2K9A)",
    );
  }
  return code;
}

/** S2: ambil voucher by kode; tidak ada → 404. */
export async function loadVoucher(
  db: SupabaseClient,
  code: string,
): Promise<VoucherRow> {
  const { data: voucher, error } = await db
    .from("vouchers")
    .select("*")
    .eq("code", code)
    .maybeSingle<VoucherRow>();
  if (error || !voucher)
    fail(404, "VOUCHER_NOT_FOUND", "Voucher tidak ditemukan");
  return voucher;
}

/** S2: promo dimatikan manual / belum aktif / kadaluarsa → 400. */
export function assertVoucherActive(voucher: VoucherRow, now: Date): void {
  if (voucher.promo_active === false) {
    fail(400, "VOUCHER_INACTIVE", "Promo ini lagi nonaktif. Coba promo lain.");
  }
  if (now < new Date(voucher.valid_from)) {
    fail(400, "VOUCHER_NOT_ACTIVE", "Voucher belum aktif. Coba lagi nanti.");
  }
  if (now > new Date(voucher.valid_until)) {
    fail(400, "VOUCHER_EXPIRED", "Voucher sudah kadaluarsa.");
  }
}

/** S3: verifikasi token → user id; gagal → 401. */
export async function requireUserId(
  db: SupabaseClient,
  token: string,
): Promise<string> {
  const {
    data: { user },
    error,
  } = await db.auth.getUser(token);
  if (error || !user)
    fail(401, "UNAUTHORIZED", "User token tidak valid. Login ulang ya.");
  return user.id;
}

/** Rate-limit global: max 3 claim/hari/user (semua tenant). Dicek dulu biar 429 menang atas 409. */
export async function assertDailyLimit(
  db: SupabaseClient,
  userId: string,
  claimDate: string,
): Promise<void> {
  const { count: totalToday, error } = await db
    .from("voucher_claims")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("claim_date", claimDate);
  if (error) fail(500, "DB_COUNT_FAILED", "Gagal cek quota harian. Coba lagi.");
  if ((totalToday || 0) >= DAILY_CLAIM_LIMIT) {
    fail(
      429,
      "RATE_LIMIT_EXCEEDED",
      "Batas maksimal 3 voucher per hari. Balik besok ya.",
    );
  }
}

/** Kunci anti-farming: 1 user + 1 tenant + 1 hari. */
interface ClaimKey {
  userId: string;
  tenantId: string;
  claimDate: string;
}

/** P0 lock: 1 user + 1 tenant + 1 hari = 1 claim (UNIQUE user,tenant,claim_date). */
export async function assertNotClaimedForTenant(
  db: SupabaseClient,
  key: ClaimKey,
): Promise<void> {
  const { data: existingTenant, error } = await db
    .from("voucher_claims")
    .select("id")
    .eq("user_id", key.userId)
    .eq("tenant_id", key.tenantId)
    .eq("claim_date", key.claimDate)
    .maybeSingle();
  if (error && error.code !== "PGRST116") {
    fail(500, "DB_LOOKUP_FAILED", "Gagal cek claim. Coba lagi.");
  }
  if (existingTenant) {
    fail(
      409,
      "ALREADY_CLAIMED",
      "Anda sudah mengklaim voucher tenant ini hari ini. Kembali besok.",
    );
  }
}

/** Data 1 klaim baru. */
interface NewClaim {
  userId: string;
  voucher: VoucherRow;
  claimDate: string;
  nowIso: string;
}

/** S3: insert dual-write (kolom lama date/code + kolom baru claim_date/claim_code/dll). */
export async function insertClaim(
  db: SupabaseClient,
  claim: NewClaim,
): Promise<void> {
  const { userId, voucher, claimDate, nowIso } = claim;
  const { error } = await db.from("voucher_claims").insert({
    user_id: userId,
    tenant_id: voucher.tenant_id,
    voucher_id: voucher.id,
    date: claimDate,
    claim_date: claimDate,
    code: voucher.code,
    claim_code: voucher.code,
    claimed_at: nowIso,
    redeemed: false,
    redeemed_at: null,
  });
  if (!error) return;
  // Race 2 klik bersamaan → UNIQUE nabrak (23505) → 409 ramah, bukan 500.
  if (error.code === "23505") {
    fail(
      409,
      "ALREADY_CLAIMED",
      "Anda sudah mengklaim voucher tenant ini hari ini. Kembali besok.",
    );
  }
  fail(500, "DB_INSERT_FAILED", "Gagal simpan claim. Coba lagi.");
}

/** S4: response sukses + countdown ke 23:59 WIB hari ini. */
export function buildClaimResponse(voucher: VoucherRow): {
  status: string;
  claim_code: string;
  expires_at: string;
  voucher: { name: string; discount_percent: number };
  time_remaining: { hours: number; minutes: number; expired: boolean };
} {
  const expiry = expiryWIBToday();
  const diffMs = Math.max(0, expiry.getTime() - Date.now());
  return {
    status: "ok",
    claim_code: voucher.code,
    expires_at: expiry.toISOString(),
    voucher: {
      name: voucher.promo_text,
      discount_percent: voucher.discount_percent,
    },
    time_remaining: {
      hours: Math.floor(diffMs / 3600000),
      minutes: Math.floor((diffMs % 3600000) / 60000),
      expired: diffMs <= 0,
    },
  };
}
