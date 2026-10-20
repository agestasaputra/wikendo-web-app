/**
 * features/home/utils/homeHero.ts — Hero token for home I17 V2 Ember P1 (sliced from the V2 screenshot).
 *
 * WHAT: getHomeHeroMeta() → hero colors. PURE (reads no route/state).
 * WHY: single source of truth, not hardcoded hex in the HomePage template.
 *   `pageBg` is intentionally ABSENT — the page canvas belongs to app.vue (common/constants/theme
 *   PAGE_BG), so home cannot drift from history/account/mall any more.
 * Example: getHomeHeroMeta().strip → "#EA580C".
 */
import type { HomeHeroMeta } from "../@types/home";

/** Home hero meta: I17 V2 Ember P1 lock (ember strip, not the orange I2). */
export function getHomeHeroMeta(): HomeHeroMeta {
  return {
    headBg: "#0C0A09",
    strip: "#EA580C",
    numColor: "#D9F99D",
    pillBg: "#A3E635",
    pillColor: "#0C0A09",
    ctaBg: "#0C0A09",
    ctaColor: "#fff",
    cardBg: "#fff",
    tagBg: "#ECFDF5",
    tagColor: "#047857",
  };
}
