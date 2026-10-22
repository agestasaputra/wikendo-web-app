/**
 * common/components/__tests__/sticky-search.spec.ts — kontrak "search + Filter nempel di bawah TopNav".
 *
 * WHAT: mengunci 3 hal yang diminta Agesta (22 Oct):
 *   1. Bar search + tombol Filter STICKY saat scroll di Mall List, Tenant Detail, History.
 *   2. Offset sticky = tinggi TopNav (56px), BUKAN angka tebakan per halaman (`top-[38px]` / `top-0`
 *      yang bikin bar slide ke BELAKANG header dan hilang — bug nyata di prod).
 *   3. Chip sort lama di Mall List DIHAPUS (sort sekarang hanya lewat FilterDrawer → 1 kontrol).
 * WHY: file-assert deterministik (tanpa browser) supaya regresi "bar hilang saat scroll" tidak balik.
 *   Offset tinggal di satu custom property CSS (`--topnav-h`), jadi kalau padding TopNav berubah,
 *   tidak ada halaman yang ketinggalan.
 * EXAMPLE: `pnpm vitest run common/components/__tests__/sticky-search.spec.ts`
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readCode, readSource } from "~/test/utils";

const APP_ROOT = join(__dirname, "../../..");
const CSS = readFileSync(join(APP_ROOT, "assets/css/tailwind.css"), "utf8");

const LIST = readSource("features/mall/MallListPage.vue");
const DETAIL = readSource("features/mall/MallDetailPage.vue");
const HISTORY = readSource("features/history/HistoryPage.vue");
const LIST_CODE = readCode("features/mall/MallListPage.vue");

const PAGES = [
  ["mall list", LIST],
  ["tenant detail", DETAIL],
  ["history", HISTORY],
] as const;

describe("sticky search bar — satu pemilik offset (--topnav-h)", () => {
  it("TopNav height token = 56px (sumber tunggal offset sticky)", () => {
    expect(CSS).toMatch(/--topnav-h:\s*56px/);
  });

  it(".sticky-bar = sticky di bawah TopNav + full-bleed dalam kolom app", () => {
    const rule = CSS.slice(
      CSS.indexOf(".sticky-bar"),
      CSS.indexOf(".sticky-bar") + 700,
    );
    expect(rule).toContain("position: sticky");
    expect(rule).toContain("top: var(--topnav-h)");
    // z-30: di atas kartu list, di bawah TopNav (z-40) dan FilterDrawer (z-60).
    expect(rule).toMatch(/z-index:\s*30/);
    // -mx-4 + px-4: gutter 16px halaman ikut tertutup, kartu tidak "bocor" di sisi bar.
    expect(rule).toMatch(/margin-left:\s*-1rem/);
    expect(rule).toMatch(/margin-right:\s*-1rem/);
    expect(rule).toMatch(/padding-left:\s*1rem/);
    expect(rule).toMatch(/padding-right:\s*1rem/);
  });
});

describe("sticky search bar — dipakai 3 halaman", () => {
  for (const [name, src] of PAGES) {
    it(`${name}: bar search + Filter pakai .sticky-bar dengan kanvas PAGE_BG`, () => {
      expect(src).toContain('class="sticky-bar');
      // normalizeSource() menulis ulang style="…" jadi tanpa spasi (`background:PAGE_BG`),
      // jadi assertion WAJIB pakai bentuk ternormalisasi — kalau tidak, test ini mustahil hijau.
      expect(src).toMatch(/class="sticky-bar[\s\S]{0,120}background:PAGE_BG/);
    });
  }

  it("tidak ada lagi offset tebakan lama (top-[38px] / sticky top-0 di bar search)", () => {
    expect(LIST).not.toContain("top-[38px]");
    expect(DETAIL).not.toContain('class="sticky top-0 pt-2 pb-2"');
  });
});

describe("mall list — chip sort lama dihapus (sort pindah ke FilterDrawer)", () => {
  it("tidak merender baris chip sort di body", () => {
    expect(LIST).not.toMatch(/flex gap-1\.5 mt-2 overflow-x-auto/);
    expect(LIST_CODE).not.toMatch(/v-for="opt in SORT_OPTIONS"/);
  });

  it("sort tetap hidup lewat drawer (SORT_OPTIONS dikirim ke FilterDrawer)", () => {
    expect(LIST_CODE).toContain(':sort-options="SORT_OPTIONS"');
    expect(LIST_CODE).toContain('@apply="onFilterApply"');
  });
});

describe("search + tombol Filter sejajar 44px di 3 halaman", () => {
  for (const [name, src] of PAGES) {
    it(`${name}: input & tombol sama-sama h-11 (44px)`, () => {
      const code = src;
      expect(code).toMatch(/h-11[^"]*rounded-xl/); // field
      expect(code).toMatch(/flex-none h-11/); // tombol Filter
    });
  }
});

describe("tenant detail — CTA quiz TIDAK ikut sticky (tidak makan layar)", () => {
  it("CTA /food?mall= dirender setelah blok sticky-bar", () => {
    expect(DETAIL.indexOf("sticky-bar")).toBeLessThan(
      DETAIL.indexOf("/food?mall="),
    );
  });

  it("Filter tetap berada di kanan input di dalam blok sticky", () => {
    expect(DETAIL.indexOf("Cari tenant")).toBeLessThan(
      DETAIL.indexOf('data-testid="open-filter"'),
    );
  });
});
