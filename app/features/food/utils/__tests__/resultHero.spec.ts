import { describe, it, expect } from "vitest";
import type { TenantRecommendation } from "~/common/types/api";
import { buildFoodChips, buildFoodHero, buildRankItems } from "../resultHero";

const rec = (
  over: Partial<TenantRecommendation> = {},
): TenantRecommendation => ({
  name: "Kopi Kekinian",
  category: "coffee",
  floor: "2",
  halal: true,
  budget_tier: "mid",
  price_min: 50000,
  price_max: 100000,
  kids_friendly: true,
  hype_tiktok: false,
  reason: "Cocok buat nongkrong lama bareng teman",
  maps_url: "https://maps.example/x",
  ...over,
});

describe("buildFoodHero", () => {
  it("filled → mapped", () => {
    const h = buildFoodHero(rec());
    expect(h).toMatchObject({
      name: "Kopi Kekinian",
      price: "Rp 50-100rb",
      floor: "2",
      halal: true,
      kids: "👶 kids",
      maps: "https://maps.example/x",
    });
  });

  it("missing price bounds → dash placeholder", () => {
    const h = buildFoodHero(rec({ price_min: null, price_max: null }));
    expect(h.price).toBe("—");
  });

  it("empty → safe placeholder, halal null (tri-state)", () => {
    const h = buildFoodHero(undefined);
    expect(h).toMatchObject({
      name: "—",
      floor: "?",
      halal: null,
      kids: "—",
      maps: "#",
    });
  });
});

describe("buildFoodChips + buildRankItems", () => {
  const list = [
    rec({ name: "Alpha Cafe" }),
    rec({ name: "Bravo Kitchen" }),
    rec({ name: "Charlie Bakery", halal: false }),
    rec({ name: "Delta" }),
  ];

  it('chips: 2nd & 3rd recommendations, name truncated to 6 chars + "..."', () => {
    expect(buildFoodChips(list)).toEqual(["Bravo...", "Charli..."]);
  });

  it("rank: top 3 with halal · floor · promo · reason tags, 28 chars", () => {
    const items = buildRankItems(list);
    expect(items).toHaveLength(3);
    expect(items[0]?.tags).toBe(
      "Halal · L2 · -20% · Cocok buat nongkrong lama ba",
    );
    expect(items[2]?.tags.startsWith("Non-halal")).toBe(true);
  });

  it("halal null → ❓ (not yet verified)", () => {
    expect(
      buildRankItems([rec({ halal: null })])[0]?.tags.startsWith("❓"),
    ).toBe(true);
  });
});
