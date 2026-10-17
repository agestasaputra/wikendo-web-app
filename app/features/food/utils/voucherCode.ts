/**
 * features/food/utils/voucherCode.ts — Voucher claim code format `WIK-XXXXX` (API §16).
 *
 * WHAT: isVoucherCodeValid(code) + generateVoucherCode(). PURE (random without I/O).
 * EXAMPLE: isVoucherCodeValid("WIK-HB7K2") → true.
 */
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;

/** API §16: claim code `WIK-XXXXX` (5 uppercase A-Z/0-9 chars). */
export function isVoucherCodeValid(code: string | undefined): boolean {
  return typeof code === "string" && /^WIK-[A-Z0-9]{5}$/.test(code);
}

/** Generate a new claim code `WIK-XXXXX` (random, without ambiguous I/O/0/1 characters). */
export function generateVoucherCode(): string {
  let suffix = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    suffix += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return `WIK-${suffix}`;
}
