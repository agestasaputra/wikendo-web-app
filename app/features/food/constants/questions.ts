/**
 * features/makan/constants/questions.ts — 4 pertanyaan quiz MAKAN + 3 promo seed GI.
 *
 * APA: data pertanyaan (mall → misi → budget → rombongan+toggle) dan daftar voucher sheet V13B.
 * KENAPA terpisah: data bukan logic; halaman jadi tipis. Q1 mall wajib biar hasil murni tenant situ.
 * Mall ke-6 = 1 option di Q1 (+ MALL_NAMES di common/constants/malls.ts).
 */
import type { QuizQuestion } from "~/common/types/quiz";
import type { VoucherItem } from "../@types/makan";

export const MAKAN_QUESTIONS: QuizQuestion[] = [
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
        value: "makan_cepat",
      },
      {
        icon: "☕",
        label: "Nongkrong Lama",
        desc: "Ngobrol, kerja, kopi",
        value: "nongkrong_lama",
      },
      {
        icon: "👨‍👩‍👧",
        label: "Keluarga",
        desc: "Ajak anak / rame",
        value: "keluarga",
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
      { icon: "💰", label: "Hemat", desc: "< Rp 50.000", value: "hemat" },
      {
        icon: "💰💰",
        label: "Menengah",
        desc: "Rp 50-150rb",
        value: "menengah",
      },
      {
        icon: "💰💰💰",
        label: "Leluasa",
        desc: "> Rp 150.000",
        value: "leluasa",
      },
    ],
  },
  {
    id: "companion",
    question: "Rombongan + pantangan? 👥",
    toggles: true,
    options: [
      { icon: "🧘", label: "Sendiri", desc: "Me time", value: "sendiri" },
      {
        icon: "💑",
        label: "Berdua",
        desc: "Pasangan / teman",
        value: "berdua",
      },
      { icon: "👥", label: "Rame-rame", desc: "3+ orang", value: "rame" },
    ],
  },
];

/** Slug mall valid (opsi Q1) — pre-fill ?mall= dari direktori hanya lolos kalau ada di sini. */
export const MAKAN_MALL_SLUGS: string[] = (
  MAKAN_QUESTIONS[0]?.options ?? []
).map((o) => o.value);

/** 3 promo seed GI (WKD-7X2K9A / WKD-4Y5B3C / WKD-L8M2N1) + sisa cap per row. */
export const MAKAN_PROMOS: VoucherItem[] = [
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
