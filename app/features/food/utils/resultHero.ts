/**
 * features/food/utils/resultHero.ts — FOOD result card data (hero, chips, rank #1-3).
 *
 * WHAT: buildFoodHero(rec), buildFoodChips(list), buildRankItems(list). PURE.
 * WHY: previously a long computed on the page → split out so it's testable + easier to read.
 * EXAMPLE: buildFoodHero(undefined).name → "—".
 */
import type { TenantRecommendation } from "~/common/types/api";
import { formatPriceRange } from "~/utils/price";
import type { FoodHero, RankItem } from "../@types/food";

/** Halal tri-state → word (null = not yet verified ❓). */
function halalWord(halal: boolean | null | undefined): string {
  if (halal === true) return "Halal";
  if (halal === false) return "Non-halal";
  return "❓";
}

/** 1 recommendation (may be empty) → hero data. Empty field = "—"/"?". */
export function buildFoodHero(
  rec: Partial<TenantRecommendation> | undefined,
): FoodHero {
  const r = rec ?? {};
  return {
    name: r.name || "—",
    reason: r.reason || "—",
    price: formatPriceRange(r.price_min, r.price_max) || "—",
    floor: r.floor || "?",
    halal: r.halal ?? null,
    kids: r.kids_friendly ? "👶 kids" : "—",
    maps: r.maps_url || "#",
  };
}

/** 2 chip previews (2nd & 3rd recommendations), name truncated to 6 chars. */
export function buildFoodChips(list: TenantRecommendation[]): string[] {
  return list.slice(1, 3).map((r) => (r.name || "").slice(0, 6).trim() + "...");
}

/** Rank #1-3: name + tags (halal · floor · promo · reason 28 chars). */
export function buildRankItems(list: TenantRecommendation[]): RankItem[] {
  return list.slice(0, 3).map((r) => ({
    name: r.name || "—",
    tags: `${halalWord(r.halal)} · L${r.floor || "?"} · -20% · ${(r.reason || "").slice(0, 28)}`,
  }));
}
