/**
 * utils/__tests__/boolean.spec.ts — Test coerceBool.
 * String "false" dari query frontend tidak boleh jadi truthy (bug filter halal nyala).
 */
import { describe, it, expect } from "vitest";
import { coerceBool } from "../boolean";

describe('coerceBool (string "false" dari query frontend)', () => {
  it("boolean asli lolos apa adanya", () => {
    expect(coerceBool(true)).toBe(true);
    expect(coerceBool(false)).toBe(false);
  });

  it('string "false" → false (BUG result-makan: truthy bikin filter halal nyala)', () => {
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

  it("undefined/null/angka → aman (default false)", () => {
    expect(coerceBool(undefined)).toBe(false);
    expect(coerceBool(null)).toBe(false);
    expect(coerceBool(0)).toBe(false);
    expect(coerceBool(1)).toBe(true);
  });
});
