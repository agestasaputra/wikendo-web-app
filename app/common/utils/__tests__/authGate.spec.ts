/**
 * common/utils/__tests__/authGate.spec.ts — Test login wall momen #1-4.
 * Journey: generate ke-2/3 (quota), Simpan, Wishlist/Riwayat, klaim voucher.
 */
import { describe, it, expect } from "vitest";
import {
  isHistoryLoginWall,
  isMakanLoginWall,
  isSaveLoginWall,
  isTempatLoginWall,
  isVoucherClaimWall,
  isWishlistLoginWall,
} from "../authGate";

describe("login wall momen #1 (generate ke-2 tempat / ke-3 makan)", () => {
  it("anon tempat used=1 → wall (generate ke-2 dikunci)", () => {
    expect(isTempatLoginWall(1, false)).toBe(true);
  });

  it("anon tempat used=0 → belum wall", () => {
    expect(isTempatLoginWall(0, false)).toBe(false);
  });

  it("register tempat used=2 → BUKAN wall (quota exhausted, bukan login)", () => {
    expect(isTempatLoginWall(2, true)).toBe(false);
  });

  it("anon makan used=2 → wall (generate ke-3 dikunci)", () => {
    expect(isMakanLoginWall(2, false)).toBe(true);
  });

  it("anon makan used=1 → belum wall", () => {
    expect(isMakanLoginWall(1, false)).toBe(false);
  });

  it("register makan used=5 → BUKAN wall", () => {
    expect(isMakanLoginWall(5, true)).toBe(false);
  });
});

describe("login wall momen #2-4 (Journey: Simpan / Wishlist-Riwayat / klaim voucher)", () => {
  it("anon tap Simpan → wall (momen #2)", () => {
    expect(isSaveLoginWall(false)).toBe(true);
  });

  it("login tap Simpan → BUKAN wall", () => {
    expect(isSaveLoginWall(true)).toBe(false);
  });

  it("anon buka Wishlist → wall (momen #3)", () => {
    expect(isWishlistLoginWall(false)).toBe(true);
  });

  it("login buka Wishlist → BUKAN wall", () => {
    expect(isWishlistLoginWall(true)).toBe(false);
  });

  it("anon buka Riwayat → wall (momen #3)", () => {
    expect(isHistoryLoginWall(false)).toBe(true);
  });

  it("login buka Riwayat → BUKAN wall", () => {
    expect(isHistoryLoginWall(true)).toBe(false);
  });

  it("anon klaim voucher → wall 401 (momen #4, anti-farming)", () => {
    expect(isVoucherClaimWall(false)).toBe(true);
  });

  it("login klaim voucher → BUKAN wall (lanjut cek double-klaim DB)", () => {
    expect(isVoucherClaimWall(true)).toBe(false);
  });
});
