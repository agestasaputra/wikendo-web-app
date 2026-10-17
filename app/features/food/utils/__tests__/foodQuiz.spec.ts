/**
 * features/food/utils/__tests__/foodQuiz.spec.ts — Food quiz initial step + hint test.
 * ?mall= pre-fill from the directory skips Q1.
 */
import { describe, it, expect } from "vitest";
import { getFoodHint, getFoodStartStep } from "../foodQuiz";

const VALID_SLUGS = [
  "grand-indonesia",
  "central-park",
  "kota-kasablanka",
  "pondok-indah-mall",
  "aeon-bsd",
];

describe("getFoodStartStep (pre-fill from directory)", () => {
  it("skips Q1 (returns 1) if ?mall= is valid", () => {
    expect(getFoodStartStep("grand-indonesia", VALID_SLUGS)).toBe(1);
  });

  it("starts from 0 if ?mall= is absent", () => {
    expect(getFoodStartStep(undefined, VALID_SLUGS)).toBe(0);
  });

  it("starts from 0 if ?mall= slug is bogus", () => {
    expect(getFoodStartStep("mall-ngaco", VALID_SLUGS)).toBe(0);
  });
});

describe("getFoodHint (hint per question)", () => {
  it("Q1 mall required, Q4 last, the rest neutral", () => {
    expect(getFoodHint("mall_slug")).toContain("Wajib 1");
    expect(getFoodHint("companion")).toContain("Terakhir");
    expect(getFoodHint("mission")).toBe("Tap 1 — nggak ada jawaban salah");
  });
});
