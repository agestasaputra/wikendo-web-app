/**
 * common/utils/mall.ts — Mall name helper (slug → name / short label).
 *
 * WHAT: getMallName + getMallShortLabel. PURE: no route/DB reads.
 * WHY: used in 3 places (mall list, mall detail, food quiz/result) → single source of truth.
 * EXAMPLE: getMallShortLabel("grand-indonesia") → "GI".
 */
import { MALL_NAMES, MALL_SHORT_LABELS } from "../constants/malls";

/** Slug → full name. Wrong slug = fallback to slug as-is (no crash). */
export function getMallName(slug: string): string {
  return MALL_NAMES[slug] || slug;
}

/** Slug → short chip label (GI, CP, Kokas, PIM, Aeon). Wrong = fallback to slug. */
export function getMallShortLabel(slug: string): string {
  return MALL_SHORT_LABELS[slug] || slug;
}
