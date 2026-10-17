/**
 * features/food/constants/questions.ts — 4 FOOD quiz questions + 3 GI promo seeds.
 *
 * WHAT: question data (mall → mission → budget → group+toggle) and the V13B voucher sheet list.
 * WHY separate: data isn't logic; the page stays thin. Q1 mall required so the result is purely that mall's tenants.
 * Mall #6 = 1 option in Q1 (+ MALL_NAMES in common/constants/malls.ts).
 */
import type { QuizQuestion } from "~/common/types/quiz";
import type { VoucherItem } from "../@types/food";

export const FOOD_QUESTIONS: QuizQuestion[] = [
  {
    id: "mall_slug",
    question: "Makan di mall mana? 📍",
    options: [
      {
        icon: "🏬",
        label: "Grand Indonesia",
        desc: "40 tenant • Thamrin",
        value: "grand-indonesia",
      },
      {
        icon: "🏬",
        label: "Central Park",
        desc: "Grogol, Jakbar",
        value: "central-park",
      },
      {
        icon: "🏬",
        label: "Kota Kasablanka",
        desc: "Tebet, Jaksel",
        value: "kota-kasablanka",
      },
      {
        icon: "🏬",
        label: "Pondok Indah Mall",
        desc: "PIM, Jaksel",
        value: "pondok-indah-mall",
      },
      {
        icon: "🏬",
        label: "Aeon BSD",
        desc: "BSD, Tangerang",
        value: "aeon-bsd",
      },
    ],
  },
  {
    id: "mission",
    question: "Misi makan kali ini? 🎯",
    options: [
      {
        icon: "⚡",
        label: "Makan Cepat",
        desc: "Laper, langsung makan",
        value: "quick_bite",
      },
      {
        icon: "☕",
        label: "Nongkrong Lama",
        desc: "Ngobrol, kerja, kopi",
        value: "long_hangout",
      },
      {
        icon: "👨‍👩‍👧",
        label: "Keluarga",
        desc: "Ajak anak / rame",
        value: "family",
      },
      {
        icon: "🧘",
        label: "Healing",
        desc: "Me time, santai",
        value: "healing",
      },
    ],
  },
  {
    id: "budget_tier",
    question: "Budget per orang? 💰",
    options: [
      { icon: "💰", label: "Hemat", desc: "< Rp 50.000", value: "budget" },
      {
        icon: "💰💰",
        label: "Menengah",
        desc: "Rp 50-150rb",
        value: "mid",
      },
      {
        icon: "💰💰💰",
        label: "Leluasa",
        desc: "> Rp 150.000",
        value: "splurge",
      },
    ],
  },
  {
    id: "companion",
    question: "Rombongan + pantangan? 👥",
    toggles: true,
    options: [
      { icon: "🧘", label: "Sendiri", desc: "Me time", value: "solo" },
      {
        icon: "💑",
        label: "Berdua",
        desc: "Pasangan / teman",
        value: "couple",
      },
      { icon: "👥", label: "Rame-rame", desc: "3+ orang", value: "group" },
    ],
  },
];

/** Valid mall slugs (Q1 options) — a ?mall= pre-fill from the directory passes only if it's here. */
export const FOOD_MALL_SLUGS: string[] = (FOOD_QUESTIONS[0]?.options ?? []).map(
  (o) => o.value,
);

/** 3 GI promo seeds (WKD-7X2K9A / WKD-4Y5B3C / WKD-L8M2N1) + remaining cap per row. */
export const FOOD_PROMOS: VoucherItem[] = [
  {
    code: "WKD-7X2K9A",
    name: "Kopi Weekday -20%",
    min: "Min. 50rb",
    left: 17,
    cap: 20,
  },
  {
    code: "WKD-4Y5B3C",
    name: "Free Upsize Large",
    min: "Min. 35rb",
    left: 12,
    cap: 20,
  },
  {
    code: "WKD-L8M2N1",
    name: "Dessert 35rb",
    min: "Min. 100rb",
    left: 8,
    cap: 20,
  },
];
