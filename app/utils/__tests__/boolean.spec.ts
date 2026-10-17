/**
 * utils/__tests__/boolean.spec.ts — coerceBool test.
 * The string "false" from the frontend query must not become truthy (halal filter enabled bug).
 */
import { describe, it, expect } from "vitest";
import { coerceBool } from "../boolean";

describe('coerceBool (string "false" from the frontend query)', () => {
  it("real booleans pass through as-is", () => {
    expect(coerceBool(true)).toBe(true);
    expect(coerceBool(false)).toBe(false);
  });

  it('string "false" → false (result-food BUG: truthy turned the halal filter on)', () => {
    expect(coerceBool("false")).toBe(false);
    expect(coerceBool("False")).toBe(false);
    expect(coerceBool(" FALSE ")).toBe(false);
  });

  it('string "true"/"1" → true, "0"/"" → false', () => {
    expect(coerceBool("true")).toBe(true);
    expect(coerceBool("1")).toBe(true);
    expect(coerceBool("0")).toBe(false);
    expect(coerceBool("")).toBe(false);
  });

  it("undefined/null/number → safe (default false)", () => {
    expect(coerceBool(undefined)).toBe(false);
    expect(coerceBool(null)).toBe(false);
    expect(coerceBool(0)).toBe(false);
    expect(coerceBool(1)).toBe(true);
  });
});
