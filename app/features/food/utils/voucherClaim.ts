/**
 * features/makan/utils/voucherClaim.ts — Hasil klaim placeholder saat tombol ditekan 2x.
 *
 * APA: buildBusyClaimResult(code) → result status "busy" (UX lock anti double-klik). PURE.
 */
import type { VoucherClaimResult } from "../@types/makan";

export function buildBusyClaimResult(claimedCode: string): VoucherClaimResult {
  return {
    status: "busy",
    claim_code: claimedCode,
    expires_at: "",
    voucher: { name: "", discount_percent: 0 },
    time_remaining: { hours: 0, minutes: 0, expired: false },
  };
}
