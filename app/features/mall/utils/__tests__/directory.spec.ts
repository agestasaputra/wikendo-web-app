/**
 * features/mall/utils/__tests__/directory.spec.ts — Test logic direktori (search, area, lantai, harga, pill, filter).
 * Slot S2c/D1 1:1; DB real tanpa kolom rating/promo → turunan deterministik.
 */
import { describe, it, expect } from "vitest";
import {
  buildDirCountLabel,
  buildTenantQuery,
  filterTenantsByKeyword,
  formatLantai,
  priceShort,
  shortArea,
} from "../directory";

describe("filterTenantsByKeyword (search direktori)", () => {
  const tenants = [
    { name: "Kopi Kenangan" },
    { name: "Ramen Seirock-ya" },
    { name: "KOPI KENANGAN" },
  ];

  it("case-insensitive", () => {
    expect(filterTenantsByKeyword(tenants, "kopi")).toHaveLength(2);
  });

  it("keyword kosong = semua", () => {
    expect(filterTenantsByKeyword(tenants, "")).toHaveLength(3);
  });

  it("tidak ketemu = array kosong", () => {
    expect(filterTenantsByKeyword(tenants, "sushi")).toHaveLength(0);
  });
});

describe("shortArea (area full → pendek 1:1 D1)", () => {
  it("ambil segmen terpendek (Thamrin, Grogol)", () => {
    expect(shortArea("Thamrin / Menteng")).toBe("Thamrin");
    expect(shortArea("Tanjung Duren / Grogol")).toBe("Grogol");
  });

  it("area tunggal as-is, kosong → string kosong", () => {
    expect(shortArea("BSD City")).toBe("BSD City");
    expect(shortArea("")).toBe("");
    expect(shortArea(undefined)).toBe("");
  });
});

describe("formatLantai (lantai DB → label kartu S2c)", () => {
  it("angka → prefix L (1→L1, 3A→L3A)", () => {
    expect(formatLantai("1")).toBe("L1");
    expect(formatLantai("3")).toBe("L3");
    expect(formatLantai("3A")).toBe("L3A");
    expect(formatLantai("5")).toBe("L5");
  });

  it("kode gedung as-is (LG, GF, UG, G, nama area)", () => {
    expect(formatLantai("LG")).toBe("LG");
    expect(formatLantai("GF")).toBe("GF");
    expect(formatLantai("UG")).toBe("UG");
    expect(formatLantai("G")).toBe("G");
    expect(formatLantai("Foodprint")).toBe("Foodprint");
    expect(formatLantai("Tribeca")).toBe("Tribeca");
    expect(formatLantai("")).toBe("");
  });
});

describe("priceShort (Rp 50-90rb → 50-90rb)", () => {
  it("buang prefix Rp", () => {
    expect(priceShort("Rp 50-90rb")).toBe("50-90rb");
    expect(priceShort("50-100rb")).toBe("50-100rb");
    expect(priceShort("")).toBe("");
  });
});

describe("buildDirCountLabel (pill infinity S2c)", () => {
  it("10/40 → 🟢 10/40 tenant · scroll untuk 10 berikutnya ↓", () => {
    expect(buildDirCountLabel(10, 40)).toBe(
      "🟢 10/40 tenant · scroll untuk 10 berikutnya ↓",
    );
  });
});

describe("buildTenantQuery (3 chip filter → query server-side)", () => {
  it("semua mati → objek kosong", () => {
    expect(
      buildTenantQuery({ halal: false, budget: false, mission: false }),
    ).toEqual({});
  });

  it("semua nyala → halal + budget menengah + misi nongkrong", () => {
    expect(
      buildTenantQuery({ halal: true, budget: true, mission: true }),
    ).toEqual({
      halal: "true",
      budget: "menengah",
      mission: "nongkrong_lama",
    });
  });
});
