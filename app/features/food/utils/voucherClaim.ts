/**
 * features/food/utils/voucherClaim.ts — Placeholder claim result when the button is pressed twice.
 *
 * WHAT: buildBusyClaimResult(code) → result status "busy" (UX lock against double-click). PURE.
 */
import type { VoucherClaimResult } from "../@types/food";

export function buildBusyClaimResult(claimedCode: string): VoucherClaimResult {
  return {
    status: "busy",
    claim_code: claimedCode,
    expires_at: "",
    voucher: { name: "", discount_percent: 0 },
    time_remaining: { hours: 0, minutes: 0, expired: false },
  };
}
