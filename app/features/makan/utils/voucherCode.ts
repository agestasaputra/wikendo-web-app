/**
 * features/makan/utils/voucherCode.ts — Format kode klaim voucher `WIK-XXXXX` (API §16).
 *
 * APA: isVoucherCodeValid(code) + generateVoucherCode(). PURE (acak tanpa I/O).
 * Contoh: isVoucherCodeValid("WIK-HB7K2") → true.
 */
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;

/** API §16: kode klaim `WIK-XXXXX` (5 char A-Z/0-9 uppercase). */
export function isVoucherCodeValid(code: string | undefined): boolean {
  return typeof code === "string" && /^WIK-[A-Z0-9]{5}$/.test(code);
}

/** Generate kode klaim baru `WIK-XXXXX` (random, tanpa karakter ambigu I/O/0/1). */
export function generateVoucherCode(): string {
  let suffix = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    suffix += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return `WIK-${suffix}`;
}
