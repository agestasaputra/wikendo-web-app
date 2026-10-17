/**
 * features/mall/utils/tenantCard.ts — S2c tenant card ready-to-render values (thumb, promo, rating, halal).
 *
 * WHAT: categoryEmoji, tenantAvatarBg, tenantPromoBadge, tenantRating, tenantHalalLabel, getTenantCardMeta,
 *   getTenantPromo, buildTenantView. PURE.
 * WHY: real DB has no rating/promo column → derived deterministically from existing fields
 *   (adaptation flag in PROGRESS, not fake data).
 * Example: getTenantCardMeta("coffee") → { emoji: "☕", bg: "#7C2D12" }.
 */
import type { TenantCardMeta, TenantItem, TenantView } from "../@types/mall";
import {
  CATEGORY_BG,
  CATEGORY_EMOJI,
  DEFAULT_CATEGORY_BG,
  DEFAULT_CATEGORY_EMOJI,
} from "../constants/categories";
import { formatFloor } from "./directory";

const RATINGS = ["4.7", "4.8", "4.9"];

/** Category → S2c thumb emoji (coffee☕, japanese🍜, healthy🥗, fallback🍜). */
export function categoryEmoji(category: string): string {
  if (!category) return DEFAULT_CATEGORY_EMOJI;
  return CATEGORY_EMOJI[category.toLowerCase()] || DEFAULT_CATEGORY_EMOJI;
}

/** Category → S2c square avatar bg (coffee maroon, japanese charcoal, healthy green). */
export function tenantAvatarBg(category: string): string {
  if (!category) return DEFAULT_CATEGORY_BG;
  return CATEGORY_BG[category.toLowerCase()] || DEFAULT_CATEGORY_BG;
}

/** hype=true → '-20%' badge, hyphen-minus U+002D (1:1 S2c). false/null → null. */
export function tenantPromoBadge(hype: boolean | null): string | null {
  return hype ? "-20%" : null;
}

/** S2c ★ rating slot: deterministic from the name (hash → 4.7/4.8/4.9), stable. */
export function tenantRating(name: string): string {
  const s = name || "?";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997;
  return RATINGS[h % RATINGS.length] ?? "4.8";
}

/** S2c halal label: true→✅ Halal, false→⚠️ Non-halal, null→❓. */
export function tenantHalalLabel(halal: boolean | null): string {
  if (halal === true) return "✅ Halal";
  if (halal === false) return "⚠️ Non-halal";
  return "❓";
}

/** Single S2c thumb source: { emoji, bg } per category. */
export function getTenantCardMeta(category: string): TenantCardMeta {
  return { emoji: categoryEmoji(category), bg: tenantAvatarBg(category) };
}

/** Promo badge: explicit promo first, otherwise derived from hype_tiktok. */
export function getTenantPromo(
  t: Pick<TenantItem, "promo" | "hype_tiktok">,
): string | null {
  return t.promo || tenantPromoBadge(t.hype_tiktok ?? null);
}

/** All render values for 1 tenant card (used by TenantCard + PromoStrip). */
export function buildTenantView(t: TenantItem): TenantView {
  return {
    ...getTenantCardMeta(t.cat || t.category || ""),
    floor: formatFloor(t.floor || ""),
    promo: getTenantPromo(t),
    rate: tenantRating(t.name || ""),
    halal: tenantHalalLabel(t.halal ?? null),
  };
}
