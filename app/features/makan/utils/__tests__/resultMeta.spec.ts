/**
 * features/makan/utils/__tests__/resultMeta.spec.ts — Test token kartu result MAKAN F1b (tiket ink + diskon lime).
 * Token lock Agesta: ink + lime + rose + mint.
 */
import { describe, it, expect } from "vitest";
import { getResultMakanMeta } from "../resultMeta";

describe("getResultMakanMeta (F1b tiket voucher)", () => {
  it("tiket ink #0C0A09 + diskon lime #A3E635 + border dashed pink #FECDD3", () => {
    const m = getResultMakanMeta();
    expect(m.ticketBg).toBe("#0C0A09");
    expect(m.discountColor).toBe("#A3E635");
    expect(m.ticketBorder).toBe("#FECDD3");
  });

  it("tombol Klaim rose #E11D48 + BEST lime + halal mint", () => {
    const m = getResultMakanMeta();
    expect(m.claimBg).toBe("#E11D48");
    expect(m.claimColor).toBe("#fff");
    expect(m.bestBg).toBe("#A3E635");
    expect(m.halalBg).toBe("#ECFDF5");
    expect(m.halalColor).toBe("#047857");
  });

  it("page paper #F5F5F4 + kartu putih (token lock)", () => {
    const m = getResultMakanMeta();
    expect(m.pageBg).toBe("#F5F5F4");
    expect(m.cardBg).toBe("#fff");
  });
});
