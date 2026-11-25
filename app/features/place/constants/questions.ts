/**
 * features/place/constants/questions.ts — 5 PLACE quiz questions (mood → companion → budget → area → time).
 *
 * WHAT: question + option data. WHY separate: data isn't logic; the quiz page stays thin.
 * Answers are sent via query string to /result-place (id = QuizPlaceInput field name).
 */
import type { QuizQuestion } from "~/common/types/quiz";

export const PLACE_QUESTIONS: QuizQuestion[] = [
  {
    id: "mood",
    question: "Weekend ini pengen yang gimana",
    options: [
      {
        icon: "relax",
        label: "Santai / Healing",
        desc: "Slow living, recharge",
        value: "relax",
      },
      {
        icon: "fun",
        label: "Seru / Hype",
        desc: "Ramai, FOMO, viral",
        value: "fun",
      },
      {
        icon: "foodie",
        label: "Kulineran",
        desc: "Makan enak",
        value: "foodie",
      },
      {
        icon: "nature",
        label: "Alam / Outdoor",
        desc: "Hijau, udara segar",
        value: "nature",
      },
    ],
  },
  {
    id: "companion",
    question: "Dengan siapa",
    options: [
      { icon: "relax", label: "Sendiri", desc: "Me time", value: "solo" },
      {
        icon: "couple",
        label: "Pasangan",
        desc: "Pasangan / teman",
        value: "couple",
      },
      { icon: "group", label: "Teman 2–4", desc: "3+ orang", value: "group" },
      {
        icon: "family",
        label: "Keluarga",
        desc: "Anak / ortu",
        value: "family",
      },
    ],
  },
  {
    id: "budget",
    question: "Budget per orang",
    options: [
      { icon: "money", label: "Hemat", desc: "< Rp 50.000", value: "budget" },
      {
        icon: "money2",
        label: "Menengah",
        desc: "Rp 50-150rb",
        value: "mid",
      },
      {
        icon: "money3",
        label: "Leluasa",
        desc: "> Rp 150.000",
        value: "splurge",
      },
    ],
  },
  {
    id: "location",
    question: "Area mana",
    options: [
      {
        icon: "location",
        label: "Jakarta Selatan",
        desc: "Jaksel hype",
        value: "south-jakarta",
      },
      {
        icon: "location",
        label: "Jakarta Pusat",
        desc: "Jakpus klasik",
        value: "central-jakarta",
      },
      {
        icon: "location",
        label: "Jakarta Barat",
        desc: "Jakbar cozy",
        value: "west-jakarta",
      },
      {
        icon: "location",
        label: "Bebas / Fleksibel",
        desc: "Dimana aja oke",
        value: "anywhere",
      },
    ],
  },
  {
    id: "time",
    question: "Kapan mau jalan",
    options: [
      { icon: "day", label: "Siang", desc: "Siang-sore", value: "day" },
      { icon: "night", label: "Malam", desc: "Malam-minggu", value: "night" },
      {
        icon: "flexible",
        label: "Fleksibel",
        desc: "Kapan aja",
        value: "flexible",
      },
    ],
  },
];
