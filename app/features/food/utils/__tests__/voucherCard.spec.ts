/**
 * features/food/utils/__tests__/voucherCard.spec.ts — V12 gift voucher card meta test.
 * Gift banner in hero: cream-rose gradient + rose pill.
 */
import { describe, it, expect } from "vitest";
import { getVoucherCardMeta } from "../voucherCard";

describe("getVoucherCardMeta (V12 gift surprise)", () => {
  it("gift → cream-rose gradient bg + pink border + rose pill", () => {
    const m = getVoucherCardMeta("gift");
    expect(m.bg).toBe("linear-gradient(140deg,#FFF7ED,#FFE4E6)");
    expect(m.border).toBe("#FECDD3");
    expect(m.goBg).toBe("#E11D48");
    expect(m.goColor).toBe("#fff");
  });
});
