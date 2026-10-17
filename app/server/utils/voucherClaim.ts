/**
 * server/utils/voucherClaim.ts — Voucher claim steps (S1-S4 Gas v13, real schema 13 Oct 2026).
 *
 * WHAT: 401 guard → parse code → active/expired voucher → user verification → 3/day rate limit
 *   → anti-farming UNIQUE(user,tenant,day) → dual-write voucher_claims → 23:59 WIB countdown.
 * WHY split up: the old handler was 185 lines (hub-chat limit: 50 lines/function, complexity 10);
 *   each step = 1 small function that throws createError. Call order: server/api/voucher/claim.post.ts.
 * WHY the dual-write fix: migration-base (old voucher_claims: user_id/tenant_id/date/code NOT NULL) vs the v13 columns
 *   (claim_date/claim_code/claimed_at) — fill both so there are ZERO 500s in prod.
 * EXAMPLE: expiryWIBToday() → Date 23:59 WIB today (explicit +07:00 offset, anti-bug for UTC server TZ).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createError, getHeader, type H3Event } from "h3";
import type { VoucherRow } from "../../common/types/database";

const DAILY_CLAIM_LIMIT = 3;

/** Throw consistent JSON error: { statusCode, statusMessage, data.message }. */
function fail(
  statusCode: number,
  statusMessage: string,
  message: string,
): never {
  throw createError({ statusCode, statusMessage, data: { message } });
}

/** YYYY-MM-DD Asia/Jakarta (en-CA = ISO date, stable). */
export function todayWIB(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

/** 23:59 WIB today as a Date (explicit +07:00 offset, anti-bug for UTC server TZ). */
export function expiryWIBToday(): Date {
  return new Date(`${todayWIB()}T23:59:00+07:00`);
}

/** S1: Auth guard — requires a Supabase Bearer token. */
export function requireBearerToken(event: H3Event): string {
  const authHeader = getHeader(event, "authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) fail(401, "UNAUTHORIZED", "Login dulu sebelum claim voucher");
  return token;
}

/** S2: voucher code from the body, uppercase; empty → 400. */
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

/** S2: load voucher by code; not found → 404. */
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

/** S2: promo manually disabled / not active yet / expired → 400. */
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

/** S3: verify token → user id; on failure → 401. */
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

/** Global rate limit: max 3 claims/day/user (all tenants). Checked first so that 429 wins over 409. */
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

/** Anti-farming key: 1 user + 1 tenant + 1 day. */
interface ClaimKey {
  userId: string;
  tenantId: string;
  claimDate: string;
}

/** P0 lock: 1 user + 1 tenant + 1 day = 1 claim (UNIQUE user,tenant,claim_date). */
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

/** Data for 1 new claim. */
interface NewClaim {
  userId: string;
  voucher: VoucherRow;
  claimDate: string;
  nowIso: string;
}

/** S3: dual-write insert (old date/code columns + new claim_date/claim_code/etc columns). */
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
  // Race with 2 simultaneous clicks → UNIQUE collision (23505) → friendly 409, not 500.
  if (error.code === "23505") {
    fail(
      409,
      "ALREADY_CLAIMED",
      "Anda sudah mengklaim voucher tenant ini hari ini. Kembali besok.",
    );
  }
  fail(500, "DB_INSERT_FAILED", "Gagal simpan claim. Coba lagi.");
}

/** S4: success response + countdown to 23:59 WIB today. */
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
