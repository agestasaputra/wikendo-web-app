/**
 * POST /api/voucher/claim — Claim voucher (S1-S4 Gas v13, real schema fix 13 Oct 2026).
 *
 * WHAT: 401 auth guard → check active/expired vouchers → anti-farming UNIQUE(user,tenant,day)
 *   + 3/day rate limit (global) → dual-write voucher_claims (old+new columns) → 23:59 WIB countdown.
 * WHY thin: each step = a function in server/utils/voucherClaim.ts (function size limit + testable).
 * EXAMPLE: POST {voucher_code:'WKD-7X2K9A'} + valid Bearer → 200 {claim_code, expires_at, time_remaining}.
 *
 * Response:
 *   200: { status: "ok", claim_code, expires_at, voucher, time_remaining }
 *   400: { status: "error", message: "voucher_code wajib / expired / belum aktif / nonaktif" }
 *   401: { status: "error", message: "login dulu / token tidak valid" }
 *   404: { status: "error", message: "voucher tidak ditemukan" }
 *   409: { status: "error", message: "sudah claim hari ini" }
 *   429: { status: "error", message: "max 3 claim/hari" }
 */
import { supabaseAdmin } from "../../utils/db";
import {
  assertDailyLimit,
  assertNotClaimedForTenant,
  assertVoucherActive,
  buildClaimResponse,
  insertClaim,
  loadVoucher,
  parseVoucherCode,
  requireBearerToken,
  requireUserId,
  todayWIB,
} from "../../utils/voucherClaim";

export default defineEventHandler(async (event) => {
  const token = requireBearerToken(event);
  const code = parseVoucherCode(
    await readBody<{ voucher_code?: string }>(event),
  );

  const db = supabaseAdmin();
  const voucher = await loadVoucher(db, code);
  const now = new Date();
  assertVoucherActive(voucher, now);

  const userId = await requireUserId(db, token);
  const claimDate = todayWIB();
  await assertDailyLimit(db, userId, claimDate);
  await assertNotClaimedForTenant(db, {
    userId,
    tenantId: voucher.tenant_id,
    claimDate,
  });
  await insertClaim(db, {
    userId,
    voucher,
    claimDate,
    nowIso: now.toISOString(),
  });

  return buildClaimResponse(voucher);
});
