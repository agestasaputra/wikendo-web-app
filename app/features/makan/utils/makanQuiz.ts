/**
 * features/makan/utils/makanQuiz.ts — Logic murni quiz MAKAN (step awal + hint per pertanyaan).
 *
 * APA: getMakanStartStep(mallQuery, validSlugs) + getMakanHint(questionId). PURE.
 * KENAPA: user datang dari direktori (?mall=slug-valid) → Q1 (pilih mall) di-skip.
 * Contoh: getMakanStartStep("grand-indonesia", slugs) → 1.
 */

/** Step awal quiz makan: 1 (skip Q1) kalau ?mall= valid, selain itu 0. */
export function getMakanStartStep(
  mallQuery: string | undefined,
  validSlugs: string[],
): number {
  return mallQuery && validSlugs.includes(mallQuery) ? 1 : 0;
}

/** Hint kecil di bawah header per pertanyaan. */
export function getMakanHint(questionId: string): string {
  if (questionId === "mall_slug")
    return "Wajib 1 — biar hasil murni tenant situ";
  if (questionId === "companion") return "Terakhir, janji 😄";
  return "Tap 1 — nggak ada jawaban salah";
}
