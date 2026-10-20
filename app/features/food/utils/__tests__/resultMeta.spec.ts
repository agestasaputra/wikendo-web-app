/**
 * features/food/utils/__tests__/resultMeta.spec.ts — FOOD result card token test F1b (ink ticket + lime discount).
 * Agesta token lock: ink + lime + rose + mint.
 */
import { describe, it, expect } from "vitest";
import { getResultFoodMeta } from "../resultMeta";

describe("getResultFoodMeta (F1b voucher ticket)", () => {
  it("ink ticket #0C0A09 + lime discount #A3E635 + pink dashed border #FECDD3", () => {
    const m = getResultFoodMeta();
    expect(m.ticketBg).toBe("#0C0A09");
    expect(m.discountColor).toBe("#A3E635");
    expect(m.ticketBorder).toBe("#FECDD3");
  });

  it("Klaim button rose #E11D48 + lime BEST + mint halal", () => {
    const m = getResultFoodMeta();
    expect(m.claimBg).toBe("#E11D48");
    expect(m.claimColor).toBe("#fff");
    expect(m.bestBg).toBe("#A3E635");
    expect(m.halalBg).toBe("#ECFDF5");
    expect(m.halalColor).toBe("#047857");
  });

  it("white card + no page canvas token (owned by app.vue PAGE_BG)", () => {
    const m = getResultFoodMeta();
    expect(Object.keys(m)).not.toContain("pageBg");
    expect(m.cardBg).toBe("#fff");
  });
});
