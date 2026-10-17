/**
 * features/place/utils/__tests__/resultMeta.spec.ts — PLACE result card token test R3b (photo + lime).
 * Token lock: lime=value, ember=strip, ink=action.
 */
import { describe, it, expect } from "vitest";
import { getResultPlaceMeta } from "../resultMeta";

describe("getResultPlaceMeta (R3b photo + lime)", () => {
  it("ember strip #EA580C + lime BEST badge #A3E635 ink text", () => {
    const m = getResultPlaceMeta();
    expect(m.strip).toBe("#EA580C");
    expect(m.bestBg).toBe("#A3E635");
    expect(m.bestColor).toBe("#0C0A09");
  });

  it("action button ink #0C0A09 + page paper #F5F5F4 + white card", () => {
    const m = getResultPlaceMeta();
    expect(m.actionBg).toBe("#0C0A09");
    expect(m.actionColor).toBe("#fff");
    expect(m.pageBg).toBe("#F5F5F4");
    expect(m.cardBg).toBe("#fff");
  });

  it("Lainnya chip active ink + lime text", () => {
    const m = getResultPlaceMeta();
    expect(m.moreBg).toBe("#0C0A09");
    expect(m.moreColor).toBe("#A3E635");
  });
});
