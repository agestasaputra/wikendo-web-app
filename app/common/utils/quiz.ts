/**
 * common/utils/quiz.ts — Pure quiz logic (progress, last step, header meta).
 *
 * WHAT: progressPercent, isLastStep, getQuizHeaderMeta, getQuizSegState. PURE.
 * WHY: used by place quiz + food quiz → 1 engine, not duplicated hex/math per page.
 * EXAMPLE: getQuizSegState(0, 5) → [true, false, false, false, false].
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

/** Quiz header meta per flow: white label + dot + lime segment + selected split. */
export function getQuizHeaderMeta(flow: QuizFlow): QuizHeaderMeta {
  if (flow === "food") {
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

/** Quiz block segment: index <= step = on. EXAMPLE: (0,5) → [T,F,F,F,F]. */
export function getQuizSegState(step: number, total: number): boolean[] {
  return Array.from({ length: total }, (_, i) => i <= step);
}

/** The question at this step (step out of range → first question). Empty list = error. */
export function getQuestion(
  questions: QuizQuestion[],
  step: number,
): QuizQuestion {
  const q = questions[step] ?? questions[0];
  if (!q) throw new Error("QUIZ_EMPTY");
  return q;
}
