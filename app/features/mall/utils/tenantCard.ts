/**
 * features/mall/utils/tenantCard.ts — Nilai siap-render kartu tenant S2c (thumb, promo, rating, halal).
 *
 * APA: categoryEmoji, tenantAvatarBg, tenantPromoBadge, tenantRating, tenantHalalLabel, getTenantCardMeta,
 *   getTenantPromo, buildTenantView. PURE.
 * KENAPA: DB real tanpa kolom rating/promo → diturunkan deterministik dari field yang ada
 *   (flag adaptasi di PROGRESS, bukan data bohong).
 * Contoh: getTenantCardMeta("kopi") → { emoji: "☕", bg: "#7C2D12" }.
 */
import type { TenantCardMeta, TenantItem, TenantView } from "../@types/mall";
import {
  CATEGORY_BG,
  CATEGORY_EMOJI,
  DEFAULT_CATEGORY_BG,
  DEFAULT_CATEGORY_EMOJI,
} from "../constants/categories";
import { formatLantai } from "./directory";

const RATINGS = ["4.7", "4.8", "4.9"];

/** Kategori → thumb emoji S2c (kopi☕, japanese🍜, healthy🥗, fallback🍜). */
export function categoryEmoji(category: string): string {
  if (!category) return DEFAULT_CATEGORY_EMOJI;
  return CATEGORY_EMOJI[category.toLowerCase()] || DEFAULT_CATEGORY_EMOJI;
}

/** Kategori → bg avatar kotak S2c (kopi maroon, japanese charcoal, healthy hijau). */
export function tenantAvatarBg(category: string): string {
  if (!category) return DEFAULT_CATEGORY_BG;
  return CATEGORY_BG[category.toLowerCase()] || DEFAULT_CATEGORY_BG;
}

/** hype=true → badge '-20%' hyphen-minus U+002D (1:1 S2c). false/null → null. */
export function tenantPromoBadge(hype: boolean | null): string | null {
  return hype ? "-20%" : null;
}

/** Slot rating ★ S2c: deterministik dari nama (hash → 4.7/4.8/4.9), stabil. */
export function tenantRating(name: string): string {
  const s = name || "?";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997;
  return RATINGS[h % RATINGS.length] ?? "4.8";
}

/** Label halal S2c: true→✅ Halal, false→⚠️ Non-halal, null→❓. */
export function tenantHalalLabel(halal: boolean | null): string {
  if (halal === true) return "✅ Halal";
  if (halal === false) return "⚠️ Non-halal";
  return "❓";
}

/** 1 sumber thumb S2c: { emoji, bg } per kategori. */
export function getTenantCardMeta(category: string): TenantCardMeta {
  return { emoji: categoryEmoji(category), bg: tenantAvatarBg(category) };
}

/** Badge promo: promo eksplisit dulu, selain itu turunan hype_tiktok. */
export function getTenantPromo(
  t: Pick<TenantItem, "promo" | "hype_tiktok">,
): string | null {
  return t.promo || tenantPromoBadge(t.hype_tiktok ?? null);
}

/** Semua nilai render 1 kartu tenant (dipakai TenantCard + PromoStrip). */
export function buildTenantView(t: TenantItem): TenantView {
  return {
    ...getTenantCardMeta(t.cat || t.category || ""),
    floor: formatLantai(t.lantai || ""),
    promo: getTenantPromo(t),
    rate: tenantRating(t.name || ""),
    halal: tenantHalalLabel(t.halal ?? null),
  };
}
