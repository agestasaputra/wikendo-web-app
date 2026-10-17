/**
 * features/mall/utils/__tests__/directory.spec.ts — Directory logic test (search, area, floor, price, pill, filter).
 * S2c/D1 slots 1:1; real DB without rating/promo columns → deterministic derivation.
 */
import { describe, it, expect } from "vitest";
import {
  buildDirCountLabel,
  buildTenantQuery,
  filterTenantsByKeyword,
  formatFloor,
  shortArea,
} from "../directory";

describe("filterTenantsByKeyword (directory search)", () => {
  const tenants = [
    { name: "Kopi Kenangan" },
    { name: "Ramen Seirock-ya" },
    { name: "KOPI KENANGAN" },
  ];

  it("case-insensitive", () => {
    expect(filterTenantsByKeyword(tenants, "kopi")).toHaveLength(2);
  });

  it("empty keyword = all", () => {
    expect(filterTenantsByKeyword(tenants, "")).toHaveLength(3);
  });

  it("no match = empty array", () => {
    expect(filterTenantsByKeyword(tenants, "sushi")).toHaveLength(0);
  });
});

describe("shortArea (full area → short 1:1 D1)", () => {
  it("takes the shortest segment (Thamrin, Grogol)", () => {
    expect(shortArea("Thamrin / Menteng")).toBe("Thamrin");
    expect(shortArea("Tanjung Duren / Grogol")).toBe("Grogol");
  });

  it("single area as-is, empty → empty string", () => {
    expect(shortArea("BSD City")).toBe("BSD City");
    expect(shortArea("")).toBe("");
    expect(shortArea(undefined)).toBe("");
  });
});

describe("formatFloor (DB floor → S2c card label)", () => {
  it("number → L prefix (1→L1, 3A→L3A)", () => {
    expect(formatFloor("1")).toBe("L1");
    expect(formatFloor("3")).toBe("L3");
    expect(formatFloor("3A")).toBe("L3A");
    expect(formatFloor("5")).toBe("L5");
  });

  it("building code as-is (LG, GF, UG, G, area name)", () => {
    expect(formatFloor("LG")).toBe("LG");
    expect(formatFloor("GF")).toBe("GF");
    expect(formatFloor("UG")).toBe("UG");
    expect(formatFloor("G")).toBe("G");
    expect(formatFloor("Foodprint")).toBe("Foodprint");
    expect(formatFloor("Tribeca")).toBe("Tribeca");
    expect(formatFloor("")).toBe("");
  });
});

describe("buildDirCountLabel (pill infinity S2c)", () => {
  it("10/40 → 🟢 10/40 tenant · scroll untuk 10 berikutnya ↓", () => {
    expect(buildDirCountLabel(10, 40)).toBe(
      "🟢 10/40 tenant · scroll untuk 10 berikutnya ↓",
    );
  });
});

describe("buildTenantQuery (3 filter chips → server-side query)", () => {
  it("all off → empty object", () => {
    expect(
      buildTenantQuery({ halal: false, budget: false, mission: false }),
    ).toEqual({});
  });

  it("all on → halal + mid budget + hangout mission", () => {
    expect(
      buildTenantQuery({ halal: true, budget: true, mission: true }),
    ).toEqual({
      halal: "true",
      budget: "mid",
      mission: "long_hangout",
    });
  });
});
