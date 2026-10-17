/**
 * features/makan/utils/__tests__/voucherCode.spec.ts — Test format kode klaim WIK-XXXXX.
 * API §16 claim.
 */
import { describe, it, expect } from "vitest";
import { generateVoucherCode, isVoucherCodeValid } from "../voucherCode";

describe("voucher code WIK-XXXXX (API §16 claim)", () => {
  it("'WIK-HB7K2' → valid (contoh spek)", () => {
    expect(isVoucherCodeValid("WIK-HB7K2")).toBe(true);
  });

  it("'WIK-12345' → valid (digit semua)", () => {
    expect(isVoucherCodeValid("WIK-12345")).toBe(true);
  });

  it("undefined → false", () => {
    expect(isVoucherCodeValid(undefined)).toBe(false);
  });

  it("'wik-hb7k2' → false (lowercase)", () => {
    expect(isVoucherCodeValid("wik-hb7k2")).toBe(false);
  });

  it("'WIK-HB72' → false (cuma 4 char)", () => {
    expect(isVoucherCodeValid("WIK-HB72")).toBe(false);
  });

  it("generateVoucherCode() → format valid + prefix WIK-", () => {
    const code = generateVoucherCode();
    expect(code.startsWith("WIK-")).toBe(true);
    expect(code).toHaveLength(9);
    expect(isVoucherCodeValid(code)).toBe(true);
  });
});
