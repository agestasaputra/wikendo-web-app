/**
 * features/food/utils/resultMeta.ts — FOOD result card tokens F1b (ink ticket + lime discount).
 *
 * WHAT: getResultFoodMeta() → colors. PURE. Agesta token lock: ink + lime + rose + mint.
 *   `pageBg` is intentionally ABSENT — the page canvas is owned by app.vue via PAGE_BG
 *   (common/constants/theme), so a feature page can never drift to its own background again.
 * EXAMPLE: getResultFoodMeta().claimBg → "#E11D48".
 */
import type { ResultFoodMeta } from "../@types/food";

/** Food result card meta F1b: ink ticket + lime discount + Claim rose + halal mint. */
export function getResultFoodMeta(): ResultFoodMeta {
  return {
    ticketBg: "#0C0A09",
    discountColor: "#A3E635",
    ticketBorder: "#FECDD3",
    claimBg: "#E11D48",
    claimColor: "#fff",
    bestBg: "#A3E635",
    halalBg: "#ECFDF5",
    halalColor: "#047857",
    cardBg: "#fff",
  };
}
