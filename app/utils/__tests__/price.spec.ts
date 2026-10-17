import { describe, it, expect } from "vitest";
import { formatPriceRange } from "../price";

describe("formatPriceRange (integer rupiah → display label)", () => {
  it("thousands → rb", () => {
    expect(formatPriceRange(30000, 80000)).toBe("Rp 30-80rb");
    expect(formatPriceRange(150000, 300000)).toBe("Rp 150-300rb");
  });

  it("whole millions → jt", () => {
    expect(formatPriceRange(1000000, 2000000)).toBe("Rp 1-2jt");
  });

  it("mixed thousand/million bounds stay in rb", () => {
    expect(formatPriceRange(500000, 2000000)).toBe("Rp 500-2000rb");
  });

  it("not a whole thousand → plain rupiah with dot separators", () => {
    expect(formatPriceRange(1500, 25500)).toBe("Rp 1.500-25.500");
  });

  it("missing bound → empty string (caller shows its own fallback)", () => {
    expect(formatPriceRange(null, null)).toBe("");
    expect(formatPriceRange(30000, null)).toBe("");
    expect(formatPriceRange(undefined, 80000)).toBe("");
  });
});
