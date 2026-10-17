/**
 * features/makan/utils/__tests__/voucherCard.spec.ts — Test meta kartu voucher gift V12.
 * Banner gift di hero: grad cream-rose + pill rose.
 */
import { describe, it, expect } from "vitest";
import { getVoucherCardMeta } from "../voucherCard";

describe("getVoucherCardMeta (V12 gift surprise)", () => {
  it("gift → bg grad cream-rose + border pink + pill rose", () => {
    const m = getVoucherCardMeta("gift");
    expect(m.bg).toBe("linear-gradient(140deg,#FFF7ED,#FFE4E6)");
    expect(m.border).toBe("#FECDD3");
    expect(m.goBg).toBe("#E11D48");
    expect(m.goColor).toBe("#fff");
  });
});
