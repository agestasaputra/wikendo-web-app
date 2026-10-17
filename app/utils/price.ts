/**
 * utils/price.ts — Pure price-range formatter.
 *
 * WHAT: formatPriceRange(min, max) → "Rp 30-80rb" (thousands) or "Rp 1-2jt" (millions). PURE.
 * WHY: the DB stores integer rupiah (`price_min`/`price_max`); the display text lives in the
 *   UI layer so it can be localized later instead of being stored as a string.
 * EXAMPLE: formatPriceRange(30000, 80000) → "Rp 30-80rb"; formatPriceRange(null, null) → "".
 */
const THOUSAND = 1_000;
const MILLION = 1_000_000;

/** 1500 → "1.500" (Indonesian dot separators, no Intl so output is stable across runtimes). */
function withDots(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Integer rupiah bounds → display label; "" when either bound is missing. */
export function formatPriceRange(
  min: number | null | undefined,
  max: number | null | undefined,
): string {
  if (min == null || max == null) return "";
  if (min >= MILLION && min % MILLION === 0 && max % MILLION === 0) {
    return `Rp ${min / MILLION}-${max / MILLION}jt`;
  }
  if (min % THOUSAND === 0 && max % THOUSAND === 0) {
    return `Rp ${min / THOUSAND}-${max / THOUSAND}rb`;
  }
  return `Rp ${withDots(min)}-${withDots(max)}`;
}
