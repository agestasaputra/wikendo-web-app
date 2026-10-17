/**
 * common/utils/__tests__/quiz.spec.ts — Quiz logic test (progress, last step, Q2d/M3d header, segments).
 * Header: white label + ember/rose dot, lime segment. Used by the place quiz + food quiz.
 */
import { describe, it, expect } from "vitest";
import {
  getQuestion,
  getQuizHeaderMeta,
  getQuizSegState,
  isLastStep,
  progressPercent,
} from "../quiz";

describe("progressPercent", () => {
  it("step 0 of 5 = 20%", () => {
    expect(progressPercent(0, 5)).toBe(20);
  });

  it("last step of 5 = 100%", () => {
    expect(progressPercent(4, 5)).toBe(100);
  });

  it("step 0 of 4 (food quiz) = 25%", () => {
    expect(progressPercent(0, 4)).toBe(25);
  });
});

describe("isLastStep", () => {
  it("true if it's the last step", () => {
    expect(isLastStep(4, 5)).toBe(true);
  });

  it("false if there are still questions", () => {
    expect(isLastStep(0, 5)).toBe(false);
  });
});

describe("getQuizHeaderMeta (Q2d/M3d white label + dot)", () => {
  it("place → QUIZ TEMPAT label + light-ember dot #FB923C", () => {
    const m = getQuizHeaderMeta("place");
    expect(m.label).toBe("QUIZ TEMPAT");
    expect(m.dot).toBe("#FB923C");
  });

  it("food → QUIZ MAKAN label + light-rose dot #FDA4AF", () => {
    const m = getQuizHeaderMeta("food");
    expect(m.label).toBe("QUIZ MAKAN");
    expect(m.dot).toBe("#FDA4AF");
  });

  it("label + question white #fff on ink #0C0A09 (AAA)", () => {
    const m = getQuizHeaderMeta("place");
    expect(m.labelColor).toBe("#fff");
    expect(m.questionColor).toBe("#fff");
    expect(m.headBg).toBe("#0C0A09");
  });

  it("lime segment #A3E635 (progress), not ember/rose (action)", () => {
    const m = getQuizHeaderMeta("place");
    expect(m.segOn).toBe("#A3E635");
  });

  it("selected place ember #EA580C vs food rose #E11D48 (split)", () => {
    expect(getQuizHeaderMeta("place").selBorder).toBe("#EA580C");
    expect(getQuizHeaderMeta("place").selBg).toBe("#FFF7ED");
    expect(getQuizHeaderMeta("food").selBorder).toBe("#E11D48");
    expect(getQuizHeaderMeta("food").selBg).toBe("#FFE4E6");
  });
});

describe("getQuizSegState (block segments, filled = step+1)", () => {
  it("step 0 of 5 → 1 on, 4 off (Q2d)", () => {
    expect(getQuizSegState(0, 5)).toEqual([true, false, false, false, false]);
  });

  it("step 1 of 4 → 2 on (M3d pre-filled mall)", () => {
    expect(getQuizSegState(1, 4)).toEqual([true, true, false, false]);
  });

  it("last step → all on", () => {
    expect(getQuizSegState(4, 5)).toEqual([true, true, true, true, true]);
  });
});

describe("getQuestion (question at a step, safe out of range)", () => {
  const qs = [
    { id: "a", question: "A?", options: [] },
    { id: "b", question: "B?", options: [] },
  ];

  it("valid step → that question", () => {
    expect(getQuestion(qs, 1).id).toBe("b");
  });

  it("step out of range → first question (no crash)", () => {
    expect(getQuestion(qs, 9).id).toBe("a");
  });

  it("empty list → throws QUIZ_EMPTY", () => {
    expect(() => getQuestion([], 0)).toThrow("QUIZ_EMPTY");
  });
});
