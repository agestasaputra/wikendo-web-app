/**
 * features/auth/utils/phone.ts — Normalisasi + validasi nomor HP (API §register, phone optional).
 *
 * APA: normalizePhone(input) + isPhoneValid(phone). PURE.
 * Schema CHECK: `phone IS NULL OR phone ~ '^\+62[0-9]{9,13}$'`. Kosong = skip (valid).
 * Contoh: normalizePhone("  ") → null; isPhoneValid("+628123456789") → true.
 */

/** Trim input HP; kosong/undefined → null (skip = valid). */
export function normalizePhone(input: string | undefined): string | null {
  const trimmed = (input || "").trim();
  return trimmed ? trimmed : null;
}

/** null/undefined/kosong = true (skip); isi wajib format +62 + 9–13 digit. */
export function isPhoneValid(phone: string | null | undefined): boolean {
  if (phone === null || phone === undefined || phone === "") return true;
  return /^\+62[0-9]{9,13}$/.test(phone);
}
