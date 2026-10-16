/**
 * features/mall/constants/categories.ts — Emoji + warna avatar per kategori tenant (S2c).
 *
 * APA: lookup kategori → thumb. Fallback 🍜 + charcoal #44403C. Data, bukan logic.
 */
export const DEFAULT_CATEGORY_EMOJI = "🍜";
export const DEFAULT_CATEGORY_BG = "#44403C";

export const CATEGORY_EMOJI: Record<string, string> = {
  kopi: "☕",
  japanese: "🍜",
  ramen: "🍜",
  healthy: "🥗",
  salad: "🥗",
  chinese: "🥟",
  fastfood: "🍔",
  western: "🥩",
  indonesia: "🍛",
  bakery: "🥐",
  dessert: "🍨",
  minuman: "🧋",
};

export const CATEGORY_BG: Record<string, string> = {
  kopi: "#7C2D12",
  japanese: "#1C1917",
  ramen: "#1C1917",
  healthy: "#15803D",
  salad: "#15803D",
  chinese: "#9A3412",
  fastfood: "#B45309",
  western: "#7F1D1D",
  indonesia: "#A16207",
  bakery: "#92400E",
  dessert: "#BE185D",
  minuman: "#0E7490",
};
