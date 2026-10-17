/**
 * common/utils/__tests__/authGate.spec.ts — Login wall moments #1-4 test.
 * Journey: generate 2nd/3rd (quota), Save, Wishlist/History, voucher claim.
 */
import { describe, it, expect } from "vitest";
import {
  isHistoryLoginWall,
  isFoodLoginWall,
  isSaveLoginWall,
  isPlaceLoginWall,
  isVoucherClaimWall,
  isWishlistLoginWall,
} from "../authGate";

describe("login wall moment #1 (2nd place / 3rd food generate)", () => {
  it("anonymous place used=1 → wall (2nd generate locked)", () => {
    expect(isPlaceLoginWall(1, false)).toBe(true);
  });

  it("anonymous place used=0 → no wall yet", () => {
    expect(isPlaceLoginWall(0, false)).toBe(false);
  });

  it("registered place used=2 → NOT a wall (quota exhausted, not login)", () => {
    expect(isPlaceLoginWall(2, true)).toBe(false);
  });

  it("anonymous food used=2 → wall (3rd generate locked)", () => {
    expect(isFoodLoginWall(2, false)).toBe(true);
  });

  it("anonymous food used=1 → no wall yet", () => {
    expect(isFoodLoginWall(1, false)).toBe(false);
  });

  it("registered food used=5 → NOT a wall", () => {
    expect(isFoodLoginWall(5, true)).toBe(false);
  });
});

describe("login wall moments #2-4 (Journey: Save / Wishlist-History / voucher claim)", () => {
  it("anonymous taps Save → wall (moment #2)", () => {
    expect(isSaveLoginWall(false)).toBe(true);
  });

  it("logged in taps Save → NOT a wall", () => {
    expect(isSaveLoginWall(true)).toBe(false);
  });

  it("anonymous opens Wishlist → wall (moment #3)", () => {
    expect(isWishlistLoginWall(false)).toBe(true);
  });

  it("logged in opens Wishlist → NOT a wall", () => {
    expect(isWishlistLoginWall(true)).toBe(false);
  });

  it("anonymous opens History → wall (moment #3)", () => {
    expect(isHistoryLoginWall(false)).toBe(true);
  });

  it("logged in opens History → NOT a wall", () => {
    expect(isHistoryLoginWall(true)).toBe(false);
  });

  it("anonymous voucher claim → wall 401 (moment #4, anti-farming)", () => {
    expect(isVoucherClaimWall(false)).toBe(true);
  });

  it("logged in voucher claim → NOT a wall (proceeds to DB double-claim check)", () => {
    expect(isVoucherClaimWall(true)).toBe(false);
  });
});
