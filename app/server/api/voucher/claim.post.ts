/**
 * POST /api/voucher/claim — Klaim voucher (S1-S4 Gas v13, fix skema real 13 Okt 2026).
 *
 * APA: auth guard 401 → cek vouchers aktif/expired → anti-farming UNIQUE(user,tenant,hari)
 *   + rate-limit 3/hari (global) → dual-write voucher_claims (kolom lama+baru) → countdown 23:59 WIB.
 * KENAPA tipis: tiap langkah = fungsi di server/utils/voucherClaim.ts (batas ukuran fungsi + testable).
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
