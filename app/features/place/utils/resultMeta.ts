/**
 * features/place/utils/resultMeta.ts — PLACE result card tokens R3b (photo + lime).
 *
 * WHAT: getResultPlaceMeta() → colors. PURE. Agesta token lock: lime=value, ember=strip, ink=action.
 * WHY: 1 source of truth, not hardcoded hex in the PlaceResultPage template.
 *   `pageBg` is intentionally ABSENT — the page canvas belongs to app.vue via PAGE_BG
 *   (common/constants/theme), so no feature can drift to its own background again.
 * EXAMPLE: getResultPlaceMeta().strip → "#EA580C".
 */
import type { ResultPlaceMeta } from "../@types/place";

/** Place result card meta R3b: ember strip + best lime + action ink. */
export function getResultPlaceMeta(): ResultPlaceMeta {
  return {
    strip: "#EA580C",
    bestBg: "#A3E635",
    bestColor: "#0C0A09",
    actionBg: "#0C0A09",
    actionColor: "#fff",
    cardBg: "#fff",
    moreBg: "#0C0A09",
    moreColor: "#A3E635",
  };
}
