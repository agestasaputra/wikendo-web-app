import { describe, it, expect } from "vitest";
import type { QuizMakanInput, TenantRow } from "../../../common/types/api";
import {
  buildDirectoryEqFilters,
  buildMakanEqFilters,
  filterByMission,
} from "../tenantFilters";

describe("buildDirectoryEqFilters (query direktori → kondisi eq)", () => {
  it("tanpa query → kosong", () => {
    expect(buildDirectoryEqFilters({})).toEqual([]);
  });

  it("halal=true + budget + kids=true", () => {
    expect(
      buildDirectoryEqFilters({ halal: "true", budget: "hemat", kids: "true" }),
    ).toEqual([
      ["halal", true],
      ["budget_tier", "hemat"],
      ["kids_friendly", true],
    ]);
  });

  it('halal="false" TIDAK menyalakan filter (tri-state: NULL jangan ikut ke-exclude sembarangan)', () => {
    expect(buildDirectoryEqFilters({ halal: "false" })).toEqual([]);
  });
});

describe("buildMakanEqFilters (body quiz makan → kondisi eq)", () => {
  const body = (over: Partial<QuizMakanInput> = {}): QuizMakanInput => ({
    mall_slug: "grand-indonesia",
    mission: "makan_cepat",
    budget_tier: "menengah",
    companion: "sendiri",
    ...over,
  });

  it("budget_tier selalu ikut; halal/kids hanya kalau true", () => {
    expect(buildMakanEqFilters(body())).toEqual([["budget_tier", "menengah"]]);
    expect(
      buildMakanEqFilters(body({ halal_only: true, kids_friendly: "true" })),
    ).toEqual([
      ["budget_tier", "menengah"],
      ["halal", true],
      ["kids_friendly", true],
    ]);
  });

  it('"false" (string dari query frontend) → filter TIDAK nyala (bug lama)', () => {
    expect(
      buildMakanEqFilters(
        body({ halal_only: "false", kids_friendly: "false" }),
      ),
    ).toEqual([["budget_tier", "menengah"]]);
  });
});

describe("filterByMission (kolom array, di-memory)", () => {
  const t = (name: string, mission?: string[]): TenantRow => ({
    name,
    category: "c",
    lantai: "1",
    halal: null,
    budget_tier: "hemat",
    price_range: "",
    kids_friendly: null,
    hype_tiktok: null,
    mission,
  });
  const list = [t("A", ["nongkrong_lama"]), t("B", ["makan_cepat"]), t("C")];

  it("tanpa mission → semua", () => {
    expect(filterByMission(list, undefined)).toHaveLength(3);
  });

  it("mission cocok → hanya yang memuat; mission kosong di row diabaikan aman", () => {
    expect(filterByMission(list, "nongkrong_lama").map((x) => x.name)).toEqual([
      "A",
    ]);
  });
});
