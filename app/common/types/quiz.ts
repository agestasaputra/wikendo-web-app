/**
 * common/types/quiz.ts — KONTRAK header quiz Q2d/M3d (dipakai quiz tempat + quiz makan).
 *
 * APA: flow + meta warna header (label putih, dot ember/rose, segmen lime).
 * Dipakai: getQuizHeaderMeta() di common/utils/quiz + QuizHeader.vue.
 */
export type QuizFlow = "tempat" | "makan";

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
