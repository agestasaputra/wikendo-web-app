/**
 * common/constants/malls.ts — Mall data: slug → full name + short label.
 *
 * WHAT: 5 active malls. WHY here: used by directory, food quiz, food result.
 * 6th mall = add 1 entry in these 2 maps (+ row in `malls` table + food quiz option).
 */
export const MALL_NAMES: Record<string, string> = {
  "grand-indonesia": "Grand Indonesia",
  "central-park": "Central Park",
  "kota-kasablanka": "Kota Kasablanka",
  "pondok-indah-mall": "Pondok Indah Mall",
  "aeon-bsd": "Aeon BSD",
};

export const MALL_SHORT_LABELS: Record<string, string> = {
  "grand-indonesia": "GI",
  "central-park": "CP",
  "kota-kasablanka": "Kokas",
  "pondok-indah-mall": "PIM",
  "aeon-bsd": "Aeon",
};
