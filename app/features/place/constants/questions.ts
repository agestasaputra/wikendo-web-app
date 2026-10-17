/**
 * features/place/constants/questions.ts — 5 PLACE quiz questions (mood → companion → budget → area → time).
 *
 * WHAT: question + option data. WHY separate: data isn't logic; the quiz page stays thin.
 * Answers are sent via query string to /result (id = QuizPlaceInput field name).
 */
import type { QuizQuestion } from "~/common/types/quiz";

export const PLACE_QUESTIONS: QuizQuestion[] = [
  {
    id: "mood",
    question: "Weekend ini pengen yang gimana? 🧭",
    options: [
      {
        icon: "🧘",
        label: "Santai / Healing",
        desc: "Slow living, recharge",
        value: "relax",
      },
      {
        icon: "🎉",
        label: "Seru / Hype",
        desc: "Ramai, FOMO, viral",
        value: "fun",
      },
      { icon: "🍜", label: "Kulineran", desc: "Makan enak", value: "foodie" },
      {
        icon: "🌿",
        label: "Alam / Outdoor",
        desc: "Hijau, udara segar",
        value: "nature",
      },
    ],
  },
  {
    id: "companion",
    question: "Dengan siapa? 👯",
    options: [
      { icon: "🧘", label: "Sendiri", desc: "Me time", value: "solo" },
      {
        icon: "💑",
        label: "Pasangan",
        desc: "Pasangan / teman",
        value: "couple",
      },
      { icon: "👥", label: "Teman 2–4", desc: "3+ orang", value: "group" },
      { icon: "👨‍👩‍👧", label: "Keluarga", desc: "Anak / ortu", value: "family" },
    ],
  },
  {
    id: "budget",
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
    id: "location",
    question: "Area mana? 📍",
    options: [
      {
        icon: "📍",
        label: "Jakarta Selatan",
        desc: "Jaksel hype",
        value: "south-jakarta",
      },
      {
        icon: "📍",
        label: "Jakarta Pusat",
        desc: "Jakpus klasik",
        value: "central-jakarta",
      },
      {
        icon: "📍",
        label: "Jakarta Barat",
        desc: "Jakbar cozy",
        value: "west-jakarta",
      },
      {
        icon: "📍",
        label: "Bebas / Fleksibel",
        desc: "Dimana aja oke",
        value: "anywhere",
      },
    ],
  },
  {
    id: "time",
    question: "Kapan mau jalan? ⏰",
    options: [
      { icon: "☀️", label: "Siang", desc: "Siang-sore", value: "day" },
      { icon: "🌙", label: "Malam", desc: "Malam-minggu", value: "night" },
      { icon: "📅", label: "Fleksibel", desc: "Kapan aja", value: "flexible" },
    ],
  },
];
