/**
 * features/home/utils/__tests__/homeHero.spec.ts — Home hero meta test I17 V2 Ember P1.
 * Hero tokens consolidated into 1 pure helper → HomePage single source of truth.
 */
import { describe, it, expect } from "vitest";
import { getHomeHeroMeta } from "../homeHero";

describe("getHomeHeroMeta (I17 V2 Ember P1)", () => {
  it("hero ink #0C0A09 + ember strip #EA580C (V2, not orange I2)", () => {
    const m = getHomeHeroMeta();
    expect(m.headBg).toBe("#0C0A09");
    expect(m.strip).toBe("#EA580C");
  });

  it("lime-on-dark numbers #D9F99D + lime pill #A3E635 ink text", () => {
    const m = getHomeHeroMeta();
    expect(m.numColor).toBe("#D9F99D");
    expect(m.pillBg).toBe("#A3E635");
    expect(m.pillColor).toBe("#0C0A09");
  });

  it("Tempat/Makan CTA ink #0C0A09 (V2 I17), not ember/rose", () => {
    const m = getHomeHeroMeta();
    expect(m.ctaBg).toBe("#0C0A09");
    expect(m.ctaColor).toBe("#fff");
  });

  it("page canvas is NOT a feature token (owned by app.vue PAGE_BG)", () => {
    const m = getHomeHeroMeta();
    expect(Object.keys(m)).not.toContain("pageBg");
    expect(m.cardBg).toBe("#fff");
  });
});
