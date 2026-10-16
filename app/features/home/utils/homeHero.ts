/**
 * features/home/utils/homeHero.ts — Token hero home I17 V2 Ember P1 (slicing dari screenshot V2).
 *
 * APA: getHomeHeroMeta() → warna hero. PURE (tanpa baca route/state).
 * KENAPA: 1 sumber kebenaran, bukan hardcode hex di template HomePage.
 * Contoh: getHomeHeroMeta().strip → "#EA580C".
 */
import type { HomeHeroMeta } from "../@types/home";

/** Meta hero home: I17 V2 Ember P1 lock (strip ember, bukan orange I2). */
export function getHomeHeroMeta(): HomeHeroMeta {
  return {
    headBg: "#0C0A09",
    strip: "#EA580C",
    numColor: "#D9F99D",
    pillBg: "#A3E635",
    pillColor: "#0C0A09",
    ctaBg: "#0C0A09",
    ctaColor: "#fff",
    pageBg: "#F5F5F4",
    cardBg: "#fff",
    tagBg: "#ECFDF5",
    tagColor: "#047857",
  };
}
