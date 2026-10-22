/**
 * AboutPage — file-assert tests (mirrors AccountPage.spec / LegalPage conventions).
 *
 * APA: halaman /about menjelaskan Wikendo, cara kerja, kuota, privasi, kontak.
 * KENAPA file-assert: konsisten dengan pola repo (readSource), tanpa render.
 */
import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

const PAGE = "features/about/AboutPage.vue";
const ROUTE = "pages/about.vue";

describe("AboutPage — structure", () => {
  it("feature page exists", () => {
    const src = readSource(PAGE);
    expect(src).toContain("features/about/AboutPage.vue");
  });
  it("route wrapper exists and renders AboutPage", () => {
    const src = readSource(ROUTE);
    expect(src).toContain(
      'import AboutPage from "~/features/about/AboutPage.vue"',
    );
  });
  it("root uses max-w-md container without inline background", () => {
    const src = readSource(PAGE);
    expect(src).toMatch(/max-w-md mx-auto px-4/);
    expect(src).not.toMatch(/style="background:/);
  });
  it("sets useHead title + description + canonical", () => {
    const src = readSource(PAGE);
    expect(src).toContain("useHead");
    expect(src).toContain("canonical");
    expect(src).toContain("Tentang Wikendo");
  });
  it("mentions 5 rekomendasi + kuota anonim + voucher", () => {
    const src = readSource(PAGE);
    expect(src).toMatch(/5 rekomendasi/i);
    expect(src).toMatch(/kuota/i);
    expect(src).toMatch(/voucher/i);
  });
  it("links to privacy + terms", () => {
    const src = readSource(PAGE);
    expect(src).toContain("/privacy");
    expect(src).toContain("/terms");
  });
});
