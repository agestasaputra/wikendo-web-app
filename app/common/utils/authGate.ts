/**
 * common/utils/authGate.ts — "Login wall" moments (Auth gate v1.3, Addendum 09).
 *
 * WHAT: 6 PURE predicates — wall #1 quota (place/food), #2 Save, #3 Wishlist/History, #4 voucher claim.
 * WHY in common/: used by server + several features. Anonymous is locked, logged-in passes.
 * EXAMPLE: isPlaceLoginWall(1, false) → true (2nd anonymous generate is locked).
 */

/** Wall #1 place: anonymous with used>=1. Register is not a wall. */
export function isPlaceLoginWall(used: number, isLoggedIn: boolean): boolean {
  return !isLoggedIn && used >= 1;
}

/** Wall #1 food: anonymous with used>=2. Register is not a wall. */
export function isFoodLoginWall(used: number, isLoggedIn: boolean): boolean {
  return !isLoggedIn && used >= 2;
}

/** Wall #2: tap Save — anonymous is locked. */
export function isSaveLoginWall(isLoggedIn: boolean): boolean {
  return !isLoggedIn;
}

/** Wall #3a: open Wishlist — anonymous is locked. */
export function isWishlistLoginWall(isLoggedIn: boolean): boolean {
  return !isLoggedIn;
}

/** Wall #3b: open History — anonymous is locked. */
export function isHistoryLoginWall(isLoggedIn: boolean): boolean {
  return !isLoggedIn;
}

/** Wall #4: voucher claim REQUIRES login (anonymous → 401, anti-farming). */
export function isVoucherClaimWall(isLoggedIn: boolean): boolean {
  return !isLoggedIn;
}
