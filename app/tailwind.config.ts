// tailwind.config.ts — KOMBO 5+10+15 brand tokens (Addendum 09 v1.3 APPROVED).
// Warm base #fffdf9, place orange #f97316, food red #ee2c4b, wallet teal #0e7490, ink #18181b.
// Use as a class (bg-base, bg-place, bg-food, bg-wallet, text-ink). Font Plus Jakarta Sans via the nuxt.config head.
/** @type {import('tailwindcss').Config} */
export default {
  // Templates live in features/ + common/ (not Nuxt's default folders) → MUST be registered,
  // if not Tailwind discards every class there (plain design with no styling).
  content: [
    "./features/**/*.{vue,ts}",
    "./common/**/*.{vue,ts}",
    "./utils/**/*.ts",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0891b2",
          700: "#0e7490",
        },
        accent: {
          DEFAULT: "#f97316",
        },
        base: "#fffdf9",
        place: "#f97316",
        food: "#ee2c4b",
        wallet: "#0e7490",
        ink: "#18181b",
      },
    },
  },
  plugins: [],
};
