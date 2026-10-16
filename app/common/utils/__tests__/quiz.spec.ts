/**
 * common/utils/__tests__/quiz.spec.ts — Test logic quiz (progress, step terakhir, header Q2d/M3d, segmen).
 * Header: label putih + dot ember/rose, segmen lime. Dipakai quiz tempat + quiz makan.
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
  it("step 0 dari 5 = 20%", () => {
    expect(progressPercent(0, 5)).toBe(20);
  });

  it("step terakhir dari 5 = 100%", () => {
    expect(progressPercent(4, 5)).toBe(100);
  });

  it("step 0 dari 4 (quiz makan) = 25%", () => {
    expect(progressPercent(0, 4)).toBe(25);
  });
});

describe("isLastStep", () => {
  it("true kalau step terakhir", () => {
    expect(isLastStep(4, 5)).toBe(true);
  });

  it("false kalau masih ada pertanyaan", () => {
    expect(isLastStep(0, 5)).toBe(false);
  });
});

describe("getQuizHeaderMeta (Q2d/M3d label putih + dot)", () => {
  it("tempat → label QUIZ TEMPAT + dot ember-terang #FB923C", () => {
    const m = getQuizHeaderMeta("tempat");
    expect(m.label).toBe("QUIZ TEMPAT");
    expect(m.dot).toBe("#FB923C");
  });

  it("makan → label QUIZ MAKAN + dot rose-terang #FDA4AF", () => {
    const m = getQuizHeaderMeta("makan");
    expect(m.label).toBe("QUIZ MAKAN");
    expect(m.dot).toBe("#FDA4AF");
  });

  it("label + question putih #fff di atas ink #0C0A09 (AAA)", () => {
    const m = getQuizHeaderMeta("tempat");
    expect(m.labelColor).toBe("#fff");
    expect(m.questionColor).toBe("#fff");
    expect(m.headBg).toBe("#0C0A09");
  });

  it("segmen lime #A3E635 (kemajuan), bukan ember/rose (aksi)", () => {
    const m = getQuizHeaderMeta("tempat");
    expect(m.segOn).toBe("#A3E635");
  });

  it("selected tempat ember #EA580C vs makan rose #E11D48 (split)", () => {
    expect(getQuizHeaderMeta("tempat").selBorder).toBe("#EA580C");
    expect(getQuizHeaderMeta("tempat").selBg).toBe("#FFF7ED");
    expect(getQuizHeaderMeta("makan").selBorder).toBe("#E11D48");
    expect(getQuizHeaderMeta("makan").selBg).toBe("#FFE4E6");
  });
});

describe("getQuizSegState (segmen blok, isi = step+1)", () => {
  it("step 0 dari 5 → 1 nyala, 4 mati (Q2d)", () => {
    expect(getQuizSegState(0, 5)).toEqual([true, false, false, false, false]);
  });

  it("step 1 dari 4 → 2 nyala (M3d pre-fill mall)", () => {
    expect(getQuizSegState(1, 4)).toEqual([true, true, false, false]);
  });

  it("step terakhir → semua nyala", () => {
    expect(getQuizSegState(4, 5)).toEqual([true, true, true, true, true]);
  });
});

describe("getQuestion (pertanyaan pada step, aman di luar rentang)", () => {
  const qs = [
    { id: "a", question: "A?", options: [] },
    { id: "b", question: "B?", options: [] },
  ];

  it("step valid → pertanyaan itu", () => {
    expect(getQuestion(qs, 1).id).toBe("b");
  });

  it("step di luar rentang → pertanyaan pertama (tidak crash)", () => {
    expect(getQuestion(qs, 9).id).toBe("a");
  });

  it("daftar kosong → throw QUIZ_EMPTY", () => {
    expect(() => getQuestion([], 0)).toThrow("QUIZ_EMPTY");
  });
});
