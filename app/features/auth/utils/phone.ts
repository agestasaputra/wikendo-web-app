/**
 * features/auth/utils/phone.ts — Phone number normalization + validation (API §register, phone optional).
 *
 * WHAT: normalizePhone(input) + isPhoneValid(phone). PURE.
 * Schema CHECK: `phone IS NULL OR phone ~ '^\+62[0-9]{9,13}$'`. Empty = skip (valid).
 * EXAMPLE: normalizePhone("  ") → null; isPhoneValid("+628123456789") → true.
 */

/** Trim the phone input; empty/undefined → null (skip = valid). */
export function normalizePhone(input: string | undefined): string | null {
  const trimmed = (input || "").trim();
  return trimmed ? trimmed : null;
}

/** null/undefined/empty = true (skip); filled requires the +62 format + 9–13 digits. */
export function isPhoneValid(phone: string | null | undefined): boolean {
  if (phone === null || phone === undefined || phone === "") return true;
  return /^\+62[0-9]{9,13}$/.test(phone);
}
