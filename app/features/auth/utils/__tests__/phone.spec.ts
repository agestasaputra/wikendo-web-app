/**
 * features/auth/utils/__tests__/phone.spec.ts — Phone normalization + validation test.
 * API §register: trim, empty → null; Schema CHECK NULL passes, value must be +62.
 */
import { describe, it, expect } from "vitest";
import { isPhoneValid, normalizePhone } from "../phone";

describe("normalizePhone (API §register: trim, empty → null)", () => {
  it("undefined → null (skip = valid)", () => {
    expect(normalizePhone(undefined)).toBeNull();
  });

  it("'' → null", () => {
    expect(normalizePhone("")).toBeNull();
  });

  it("'   ' → null", () => {
    expect(normalizePhone("   ")).toBeNull();
  });

  it("' +628123456789 ' → trimmed", () => {
    expect(normalizePhone(" +628123456789 ")).toBe("+628123456789");
  });
});

describe("isPhoneValid (Schema CHECK: NULL passes, value must be +62)", () => {
  it("null → true (skip)", () => {
    expect(isPhoneValid(null)).toBe(true);
  });

  it("undefined → true", () => {
    expect(isPhoneValid(undefined)).toBe(true);
  });

  it("'' → true (empty = skip)", () => {
    expect(isPhoneValid("")).toBe(true);
  });

  it("'+628123456789' → true", () => {
    expect(isPhoneValid("+628123456789")).toBe(true);
  });

  it("'08123456789' → false (without +62)", () => {
    expect(isPhoneValid("08123456789")).toBe(false);
  });

  it("'+62abc' → false", () => {
    expect(isPhoneValid("+62abc")).toBe(false);
  });

  it("'+62123' → false (too short)", () => {
    expect(isPhoneValid("+62123")).toBe(false);
  });

  it("'+62 + 14 digit' → false (too long)", () => {
    expect(isPhoneValid("+6212345678901234")).toBe(false);
  });
});
