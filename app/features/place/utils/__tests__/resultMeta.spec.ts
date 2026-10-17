/**
 * features/tempat/utils/__tests__/resultMeta.spec.ts — Test token kartu result TEMPAT R3b (photo + lime).
 * Token lock: lime=nilai, ember=strip, ink=aksi.
 */
import { describe, it, expect } from "vitest";
import { getResultTempatMeta } from "../resultMeta";

describe("getResultTempatMeta (R3b photo + lime)", () => {
  it("strip ember #EA580C + badge BEST lime #A3E635 teks ink", () => {
    const m = getResultTempatMeta();
    expect(m.strip).toBe("#EA580C");
    expect(m.bestBg).toBe("#A3E635");
    expect(m.bestColor).toBe("#0C0A09");
  });

  it("tombol aksi ink #0C0A09 + page paper #F5F5F4 + kartu putih", () => {
    const m = getResultTempatMeta();
    expect(m.actionBg).toBe("#0C0A09");
    expect(m.actionColor).toBe("#fff");
    expect(m.pageBg).toBe("#F5F5F4");
    expect(m.cardBg).toBe("#fff");
  });

  it("chip Lainnya aktif ink + teks lime", () => {
    const m = getResultTempatMeta();
    expect(m.moreBg).toBe("#0C0A09");
    expect(m.moreColor).toBe("#A3E635");
  });
});
