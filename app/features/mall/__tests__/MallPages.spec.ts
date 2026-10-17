import { describe, it, expect } from "vitest";
import { readSource, sourceExists } from "~/test/utils";

/**
 * MallPages.spec.ts — Mall directory: buttons don't double-fetch (Oct 10) + V13C promo strip (Gas v13).
 * Deterministic file-assert. V13C: promo strip on the mall page WITHOUT a new route.
 */
const LIST = readSource("features/mall/MallListPage.vue");
const DETAIL = readSource("features/mall/MallDetailPage.vue");
const STRIP = readSource("features/mall/components/PromoStrip.vue");

describe("content buttons — disabled while fetching (anti double-fetch)", () => {
  it("mall hub + detail: filter chips / Coba lagi disabled while pending (anti race-condition reset)", () => {
    for (const s of [LIST, DETAIL]) {
      expect(s).toContain(':disabled="pending"');
      expect(s).toContain("Coba lagi");
    }
  });
});

describe("V13C promo strip on the mall page", () => {
  it("HAS a 'Promo hari ini di' section + short label", () => {
    expect(STRIP).toContain("Promo hari ini di");
    expect(DETAIL).toContain("PromoStrip");
  });

  it("HAS a promo row + Lihat action with no new route (/food?mall=)", () => {
    expect(STRIP).toMatch(/Lihat|Buka|promo/i);
    expect(STRIP).toContain("/food?mall=");
  });

  it("ZERO new routes: no pages/vouchers", () => {
    expect(sourceExists("pages/vouchers.vue")).toBe(false);
    expect(`${DETAIL} ${STRIP}`).not.toContain("/vouchers");
  });
});
