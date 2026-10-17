/**
 * features/mall/constants/categories.ts — Emoji + avatar color per tenant category (S2c).
 *
 * WHAT: category → thumb lookup. Fallback 🍜 + charcoal #44403C. Data, not logic.
 */
export const DEFAULT_CATEGORY_EMOJI = "🍜";
export const DEFAULT_CATEGORY_BG = "#44403C";

export const CATEGORY_EMOJI: Record<string, string> = {
  coffee: "☕",
  japanese: "🍜",
  ramen: "🍜",
  healthy: "🥗",
  salad: "🥗",
  chinese: "🥟",
  fastfood: "🍔",
  western: "🥩",
  indonesian: "🍛",
  bakery: "🥐",
  dessert: "🍨",
  drinks: "🧋",
};

export const CATEGORY_BG: Record<string, string> = {
  coffee: "#7C2D12",
  japanese: "#1C1917",
  ramen: "#1C1917",
  healthy: "#15803D",
  salad: "#15803D",
  chinese: "#9A3412",
  fastfood: "#B45309",
  western: "#7F1D1D",
  indonesian: "#A16207",
  bakery: "#92400E",
  dessert: "#BE185D",
  drinks: "#0E7490",
};
