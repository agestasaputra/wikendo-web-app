/**
 * features/tempat/constants/questions.ts — 5 pertanyaan quiz TEMPAT (mood → companion → budget → area → waktu).
 *
 * APA: data pertanyaan + opsi. KENAPA terpisah: data bukan logic; halaman quiz jadi tipis.
 * Jawaban dikirim via query string ke /result (id = nama field QuizTempatInput).
 */
import type { QuizQuestion } from "~/common/types/quiz";

export const TEMPAT_QUESTIONS: QuizQuestion[] = [
  {
    id: "mood",
    question: "Weekend ini pengen yang gimana? 🧭",
    options: [
      {
        icon: "🧘",
        label: "Santai / Healing",
        desc: "Slow living, recharge",
        value: "santai",
      },
      {
        icon: "🎉",
        label: "Seru / Hype",
        desc: "Ramai, FOMO, viral",
        value: "seru",
      },
      { icon: "🍜", label: "Kulineran", desc: "Makan enak", value: "kuliner" },
      {
        icon: "🌿",
        label: "Alam / Outdoor",
        desc: "Hijau, udara segar",
        value: "alam",
      },
    ],
  },
  {
    id: "companion",
    question: "Dengan siapa? 👯",
    options: [
      { icon: "🧘", label: "Sendiri", desc: "Me time", value: "sendiri" },
      {
        icon: "💑",
        label: "Pasangan",
        desc: "Pasangan / teman",
        value: "berdua",
      },
      { icon: "👥", label: "Teman 2–4", desc: "3+ orang", value: "rame" },
      { icon: "👨‍👩‍👧", label: "Keluarga", desc: "Anak / ortu", value: "keluarga" },
    ],
  },
  {
    id: "budget",
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
    id: "location",
    question: "Area mana? 📍",
    options: [
      {
        icon: "📍",
        label: "Jakarta Selatan",
        desc: "Jaksel hype",
        value: "jaksel",
      },
      {
        icon: "📍",
        label: "Jakarta Pusat",
        desc: "Jakpus klasik",
        value: "jakpus",
      },
      {
        icon: "📍",
        label: "Jakarta Barat",
        desc: "Jakbar cozy",
        value: "jakbar",
      },
      {
        icon: "📍",
        label: "Bebas / Fleksibel",
        desc: "Dimana aja oke",
        value: "bebas",
      },
    ],
  },
  {
    id: "time",
    question: "Kapan mau jalan? ⏰",
    options: [
      { icon: "☀️", label: "Siang", desc: "Siang-sore", value: "siang" },
      { icon: "🌙", label: "Malam", desc: "Malam-minggu", value: "malam" },
      { icon: "📅", label: "Fleksibel", desc: "Kapan aja", value: "fleksibel" },
    ],
  },
];
