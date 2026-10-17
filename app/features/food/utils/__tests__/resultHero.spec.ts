import { describe, it, expect } from "vitest";
import type { TenantRecommendation } from "~/common/types/api";
import { buildMakanChips, buildMakanHero, buildRankItems } from "../resultHero";

const rec = (
  over: Partial<TenantRecommendation> = {},
): TenantRecommendation => ({
  name: "Kopi Kekinian",
  category: "kopi",
  lantai: "2",
  halal: true,
  budget_tier: "menengah",
  price_range: "Rp 50-100rb",
  kids_friendly: true,
  hype_tiktok: false,
  reason: "Cocok buat nongkrong lama bareng teman",
  maps_url: "https://maps.example/x",
  ...over,
});

describe("buildMakanHero", () => {
  it("terisi → dipetakan", () => {
    const h = buildMakanHero(rec());
    expect(h).toMatchObject({
      name: "Kopi Kekinian",
      floor: "2",
      halal: true,
      kids: "👶 kids",
      maps: "https://maps.example/x",
    });
  });

  it("kosong → placeholder aman, halal null (tri-state)", () => {
    const h = buildMakanHero(undefined);
    expect(h).toMatchObject({
      name: "—",
      floor: "?",
      halal: null,
      kids: "—",
      maps: "#",
    });
  });
});

describe("buildMakanChips + buildRankItems", () => {
  const list = [
    rec({ name: "Alpha Cafe" }),
    rec({ name: "Bravo Kitchen" }),
    rec({ name: "Charlie Bakery", halal: false }),
    rec({ name: "Delta" }),
  ];

  it('chips: rekomendasi ke-2 & ke-3, nama dipotong 6 huruf + "..."', () => {
    expect(buildMakanChips(list)).toEqual(["Bravo...", "Charli..."]);
  });

  it("rank: 3 teratas dengan tag halal · lantai · promo · alasan 28 huruf", () => {
    const items = buildRankItems(list);
    expect(items).toHaveLength(3);
    expect(items[0]?.tags).toBe(
      "Halal · L2 · -20% · Cocok buat nongkrong lama ba",
    );
    expect(items[2]?.tags.startsWith("Non-halal")).toBe(true);
  });

  it("halal null → ❓ (belum verifikasi)", () => {
    expect(
      buildRankItems([rec({ halal: null })])[0]?.tags.startsWith("❓"),
    ).toBe(true);
  });
});
