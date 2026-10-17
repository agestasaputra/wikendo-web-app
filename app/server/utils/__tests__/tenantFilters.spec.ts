import { describe, it, expect } from "vitest";
import type { QuizFoodInput, TenantRow } from "../../../common/types/api";
import {
  buildDirectoryEqFilters,
  buildFoodEqFilters,
  filterByMission,
} from "../tenantFilters";

describe("buildDirectoryEqFilters (directory query → eq conditions)", () => {
  it("no query → empty", () => {
    expect(buildDirectoryEqFilters({})).toEqual([]);
  });

  it("halal=true + budget + kids=true", () => {
    expect(
      buildDirectoryEqFilters({
        halal: "true",
        budget: "budget",
        kids: "true",
      }),
    ).toEqual([
      ["halal", true],
      ["budget_tier", "budget"],
      ["kids_friendly", true],
    ]);
  });

  it('halal="false" does NOT enable the filter (tri-state: don\'t blindly exclude NULL)', () => {
    expect(buildDirectoryEqFilters({ halal: "false" })).toEqual([]);
  });
});

describe("buildFoodEqFilters (food quiz body → eq conditions)", () => {
  const body = (over: Partial<QuizFoodInput> = {}): QuizFoodInput => ({
    mall_slug: "grand-indonesia",
    mission: "quick_bite",
    budget_tier: "mid",
    companion: "solo",
    ...over,
  });

  it("budget_tier always included; halal/kids only if true", () => {
    expect(buildFoodEqFilters(body())).toEqual([["budget_tier", "mid"]]);
    expect(
      buildFoodEqFilters(body({ halal_only: true, kids_friendly: "true" })),
    ).toEqual([
      ["budget_tier", "mid"],
      ["halal", true],
      ["kids_friendly", true],
    ]);
  });

  it('"false" (string from frontend query) → filter does NOT activate (old bug)', () => {
    expect(
      buildFoodEqFilters(body({ halal_only: "false", kids_friendly: "false" })),
    ).toEqual([["budget_tier", "mid"]]);
  });
});

describe("filterByMission (array column, in-memory)", () => {
  const t = (name: string, mission?: string[]): TenantRow => ({
    name,
    category: "c",
    floor: "1",
    halal: null,
    budget_tier: "budget",
    price_min: null,
    price_max: null,
    kids_friendly: null,
    hype_tiktok: null,
    mission,
  });
  const list = [t("A", ["long_hangout"]), t("B", ["quick_bite"]), t("C")];

  it("no mission → all", () => {
    expect(filterByMission(list, undefined)).toHaveLength(3);
  });

  it("matching mission → only those containing it; empty mission on a row safely ignored", () => {
    expect(filterByMission(list, "long_hangout").map((x) => x.name)).toEqual([
      "A",
    ]);
  });
});
