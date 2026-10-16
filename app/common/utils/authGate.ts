/**
 * common/utils/authGate.ts — Momen "login wall" (Auth gate v1.3, Addendum 09).
 *
 * APA: 6 predikat PURE — wall #1 quota (tempat/makan), #2 Simpan, #3 Wishlist/Riwayat, #4 klaim voucher.
 * KENAPA di common/: dipakai server + beberapa feature. Anon dikunci, login lolos.
 * Contoh: isTempatLoginWall(1, false) → true (generate ke-2 anon dikunci).
 */

/** Wall #1 tempat: anon yang used>=1. Register bukan wall. */
export function isTempatLoginWall(used: number, isLoggedIn: boolean): boolean {
  return !isLoggedIn && used >= 1;
}

/** Wall #1 makan: anon yang used>=2. Register bukan wall. */
export function isMakanLoginWall(used: number, isLoggedIn: boolean): boolean {
  return !isLoggedIn && used >= 2;
}

/** Wall #2: tap Simpan — anon dikunci. */
export function isSaveLoginWall(isLoggedIn: boolean): boolean {
  return !isLoggedIn;
}

/** Wall #3a: buka Wishlist — anon dikunci. */
export function isWishlistLoginWall(isLoggedIn: boolean): boolean {
  return !isLoggedIn;
}

/** Wall #3b: buka Riwayat — anon dikunci. */
export function isHistoryLoginWall(isLoggedIn: boolean): boolean {
  return !isLoggedIn;
}

/** Wall #4: klaim voucher WAJIB login (anon → 401, anti-farming). */
export function isVoucherClaimWall(isLoggedIn: boolean): boolean {
  return !isLoggedIn;
}
