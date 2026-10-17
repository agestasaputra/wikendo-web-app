/**
 * common/types/quiz.ts — Quiz header CONTRACT Q2d/M3d (used by place quiz + food quiz).
 *
 * WHAT: flow + header color meta (white label, ember/rose dot, lime segment).
 * Used by: getQuizHeaderMeta() in common/utils/quiz + QuizHeader.vue.
 */
export type QuizFlow = "place" | "food";

export interface QuizHeaderMeta {
  label: string;
  dot: string;
  labelColor: string;
  questionColor: string;
  headBg: string;
  segOn: string;
  selBorder: string;
  selBg: string;
}

export interface QuizOption {
  icon: string;
  label: string;
  desc: string;
  value: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  toggles?: boolean;
  options: QuizOption[];
}
