import { describe, it, expect } from "vitest";
import { readSource, sourceExists } from "~/test/utils";

/**
 * MallPages.spec.ts — Direktori mall: tombol tidak double-fetch (10 Okt) + strip promo V13C (Gas v13).
 * File-assert deterministik. V13C: strip promo di mall page TANPA route baru.
 */
const LIST = readSource("features/mall/MallListPage.vue");
const DETAIL = readSource("features/mall/MallDetailPage.vue");
const STRIP = readSource("features/mall/components/PromoStrip.vue");

describe("content buttons — disabled saat fetch (anti double-fetch)", () => {
  it("mall hub + detail: chip filter / Coba lagi disabled saat pending (anti race reset)", () => {
    for (const s of [LIST, DETAIL]) {
      expect(s).toContain(':disabled="pending"');
      expect(s).toContain("Coba lagi");
    }
  });
});

describe("V13C strip promo di mall page", () => {
  it("ADA section Promo hari ini di + short label", () => {
    expect(STRIP).toContain("Promo hari ini di");
    expect(DETAIL).toContain("PromoStrip");
  });

  it("ADA row promo + aksi Lihat tanpa route baru (/makan?mall=)", () => {
    expect(STRIP).toMatch(/Lihat|Buka|promo/i);
    expect(STRIP).toContain("/makan?mall=");
  });

  it("NOL route baru: tidak ada pages/vouchers", () => {
    expect(sourceExists("pages/vouchers.vue")).toBe(false);
    expect(`${DETAIL} ${STRIP}`).not.toContain("/vouchers");
  });
});
