/**
 * common/utils/mall.ts — Helper nama mall (slug → nama / label pendek).
 *
 * APA: getMallName + getMallShortLabel. PURE: tanpa baca route/DB.
 * KENAPA: dipakai 3 tempat (mall list, mall detail, quiz/result makan) → 1 sumber.
 * Contoh: getMallShortLabel("grand-indonesia") → "GI".
 */
import { MALL_NAMES, MALL_SHORT_LABELS } from "../constants/malls";

/** Slug → nama lengkap. Slug ngaco = fallback slug as-is (tidak crash). */
export function getMallName(slug: string): string {
  return MALL_NAMES[slug] || slug;
}

/** Slug → label pendek chip (GI, CP, Kokas, PIM, Aeon). Ngaco = fallback slug. */
export function getMallShortLabel(slug: string): string {
  return MALL_SHORT_LABELS[slug] || slug;
}
