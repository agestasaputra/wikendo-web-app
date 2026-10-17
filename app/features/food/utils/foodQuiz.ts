/**
 * features/food/utils/foodQuiz.ts — Pure FOOD quiz logic (initial step + hint per question).
 *
 * WHAT: getFoodStartStep(mallQuery, validSlugs) + getFoodHint(questionId). PURE.
 * WHY: a user coming from the directory (?mall=valid-slug) → Q1 (pick mall) is skipped.
 * EXAMPLE: getFoodStartStep("grand-indonesia", slugs) → 1.
 */

/** Food quiz initial step: 1 (skip Q1) if ?mall= is valid, otherwise 0. */
export function getFoodStartStep(
  mallQuery: string | undefined,
  validSlugs: string[],
): number {
  return mallQuery && validSlugs.includes(mallQuery) ? 1 : 0;
}

/** Small hint below the header per question. */
export function getFoodHint(questionId: string): string {
  if (questionId === "mall_slug")
    return "Wajib 1 — biar hasil murni tenant situ";
  if (questionId === "companion") return "Terakhir, janji 😄";
  return "Tap 1 — nggak ada jawaban salah";
}
