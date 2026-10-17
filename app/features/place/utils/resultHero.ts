/**
 * features/place/utils/resultHero.ts — PLACE result hero card data from 1 recommendation.
 *
 * WHAT: buildPlaceHero(rec, idx) + buildPlaceMapsUrl(name). PURE.
 * WHY: previously a long 1-line computed on the page → split out so it's testable + easier to read.
 * EXAMPLE: buildPlaceHero({ name: "Rooftop", location_area: "Senayan, Jaksel" }, 0).areaLabel → "SENAYAN".
 */
import type { PlaceRecommendation } from "~/common/types/api";
import type { PlaceHero } from "../@types/place";

const HERO_EMOJIS = ["🌇", "☕", "🌳", "🎡", "🌊"];
const HERO_GRADIENTS = [
  "linear-gradient(140deg,#ffedd5,#fdba74)",
  "linear-gradient(140deg,#fef3c7,#fcd34d)",
  "linear-gradient(140deg,#dcfce7,#86efac)",
  "linear-gradient(140deg,#e0e7ff,#a5b4fc)",
  "linear-gradient(140deg,#cffafe,#67e8f9)",
];

/** Area "Senayan, Jaksel" → "SENAYAN" (first word letters only), empty → "JKT". */
function toAreaLabel(area: string): string {
  const firstPart = area.split(",")[0] ?? "";
  const firstWord = firstPart.split(" ")[0] ?? "";
  return firstWord.replace(/[^A-Za-z]/g, "").toUpperCase() || "JKT";
}

/** Empty/undefined value → "—". */
function orDash(value: string | undefined): string {
  return value || "—";
}

/** Recommendation (may be empty) + card index → hero deck data. Empty field = "—". */
export function buildPlaceHero(
  rec: Partial<PlaceRecommendation> | undefined,
  idx: number,
): PlaceHero {
  const r = rec ?? {};
  const area = orDash(r.location_area);
  return {
    name: orDash(r.name),
    category: r.category || "place",
    reason: orDash(r.reason),
    cost: orDash(r.estimated_cost),
    area,
    areaLabel: toAreaLabel(area),
    time: orDash(r.best_time),
    rating: "4.8",
    vibe: (r.reason || "sunset + live music").slice(0, 24),
    emoji: HERO_EMOJIS[idx % HERO_EMOJIS.length] ?? "🌇",
    bg: HERO_GRADIENTS[idx % HERO_GRADIENTS.length] ?? "",
  };
}

/** Google Maps search link for 1 place (Jakarta). */
export function buildPlaceMapsUrl(name: string): string {
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(`${name} Jakarta`)
  );
}
