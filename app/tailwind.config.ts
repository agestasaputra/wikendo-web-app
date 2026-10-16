// tailwind.config.ts — Token brand KOMBO 5+10+15 (Addendum 09 v1.3 APPROVED).
// Base hangat #fffdf9, Orange tempat #f97316, Merah makan #ee2c4b, wallet teal #0e7490, teks #18181b.
// Pakai sebagai class (bg-base, bg-tempat, bg-makan, bg-wallet, text-ink). Font Plus Jakarta Sans via nuxt.config head.
/** @type {import('tailwindcss').Config} */
export default {
  content: [],
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
        tempat: "#f97316",
        makan: "#ee2c4b",
        wallet: "#0e7490",
        ink: "#18181b",
      },
    },
  },
  plugins: [],
};
