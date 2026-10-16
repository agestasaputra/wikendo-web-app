/**
 * features/makan/utils/__tests__/makanQuiz.spec.ts — Test step awal quiz makan + hint.
 * Pre-fill ?mall= dari direktori skip Q1.
 */
import { describe, it, expect } from "vitest";
import { getMakanHint, getMakanStartStep } from "../makanQuiz";

const VALID_SLUGS = [
  "grand-indonesia",
  "central-park",
  "kota-kasablanka",
  "pondok-indah-mall",
  "aeon-bsd",
];

describe("getMakanStartStep (pre-fill dari direktori)", () => {
  it("skip Q1 (return 1) kalau ?mall= valid", () => {
    expect(getMakanStartStep("grand-indonesia", VALID_SLUGS)).toBe(1);
  });

  it("mulai dari 0 kalau ?mall= tidak ada", () => {
    expect(getMakanStartStep(undefined, VALID_SLUGS)).toBe(0);
  });

  it("mulai dari 0 kalau ?mall= slug ngaco", () => {
    expect(getMakanStartStep("mall-ngaco", VALID_SLUGS)).toBe(0);
  });
});

describe("getMakanHint (hint per pertanyaan)", () => {
  it("Q1 mall wajib, Q4 terakhir, sisanya netral", () => {
    expect(getMakanHint("mall_slug")).toContain("Wajib 1");
    expect(getMakanHint("companion")).toContain("Terakhir");
    expect(getMakanHint("mission")).toBe("Tap 1 — nggak ada jawaban salah");
  });
});
