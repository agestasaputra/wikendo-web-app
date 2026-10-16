/**
 * common/utils/quiz.ts — Logic murni quiz (progress, step terakhir, header meta).
 *
 * APA: progressPercent, isLastStep, getQuizHeaderMeta, getQuizSegState. PURE.
 * KENAPA: dipakai quiz tempat + quiz makan → 1 engine, bukan duplikat hex/math per halaman.
 * Contoh: getQuizSegState(0, 5) → [true, false, false, false, false].
 */
import type { QuizFlow, QuizHeaderMeta, QuizQuestion } from "../types/quiz";

const QUIZ_HEADER_BASE = {
  labelColor: "#fff",
  questionColor: "#fff",
  headBg: "#0C0A09",
  segOn: "#A3E635",
};

export function progressPercent(step: number, total: number): number {
  return ((step + 1) / total) * 100;
}

export function isLastStep(step: number, total: number): boolean {
  return step >= total - 1;
}

/** Meta header quiz per flow: label putih + dot + segmen lime + selected split. */
export function getQuizHeaderMeta(flow: QuizFlow): QuizHeaderMeta {
  if (flow === "makan") {
    return {
      ...QUIZ_HEADER_BASE,
      label: "QUIZ MAKAN",
      dot: "#FDA4AF",
      selBorder: "#E11D48",
      selBg: "#FFE4E6",
    };
  }
  return {
    ...QUIZ_HEADER_BASE,
    label: "QUIZ TEMPAT",
    dot: "#FB923C",
    selBorder: "#EA580C",
    selBg: "#FFF7ED",
  };
}

/** Segmen blok quiz: index <= step = nyala. Contoh: (0,5) → [T,F,F,F,F]. */
export function getQuizSegState(step: number, total: number): boolean[] {
  return Array.from({ length: total }, (_, i) => i <= step);
}

/** Pertanyaan pada step ini (step di luar rentang → pertanyaan pertama). Daftar kosong = error. */
export function getQuestion(
  questions: QuizQuestion[],
  step: number,
): QuizQuestion {
  const q = questions[step] ?? questions[0];
  if (!q) throw new Error("QUIZ_EMPTY");
  return q;
}
