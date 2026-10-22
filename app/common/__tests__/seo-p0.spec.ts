import { describe, it, expect } from "vitest";
import { readSource, sourceExists } from "~/test/utils";

/**
 * seo-p0.spec.ts — Gate SEO P0 sebelum share publik (robots + sitemap + og + canonical + footer + GA).
 * KENAPA: share ke sosmed tanpa OG image = link abu-abu tanpa thumbnail (CTR jatuh).
 *   robots + sitemap = Google bisa crawl /mall/:slug (SEO long-tail gratis, CAC 0).
 * Kontrak diuji sebagai teks source (deterministik, NOL network) — sama pola dgn security.spec.ts.
 */

const NUXT = readSource("nuxt.config.ts");
const APP = readSource("app.vue");
const HOME = readSource("features/home/HomePage.vue");
const MALL = readSource("features/mall/MallListPage.vue");
const DETAIL = readSource("features/mall/MallDetailPage.vue");

const SITE = "https://www.wikendo.id";

describe("robots.txt + sitemap (SEO teknis)", () => {
  it("robots.txt di public/ allow crawl + menunjuk sitemap absolut", () => {
    expect(sourceExists("public/robots.txt")).toBe(true);
    const robots = readSource("public/robots.txt");
    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
    // Rute app (ssr:false, tanpa konten publik) jangan di-index — hemat crawl budget.
    expect(robots).toContain("Disallow: /history");
    expect(robots).toContain("Disallow: /account");
    expect(robots).toContain("Disallow: /login");
    expect(robots).toContain("Disallow: /register");
    expect(robots).toContain("Disallow: /result-place");
    expect(robots).toContain("Disallow: /result-food");
    expect(robots).toContain("/check-email");
    expect(robots).toContain("/api/");
  });

  it("sitemap dinamis server route: 5 halaman statis + mall dari DB (isr + cache)", () => {
    const sitemap = readSource("server/routes/sitemap.xml.ts");
    expect(sitemap).toContain("sitemap");
    expect(sitemap).toContain("/mall");
    expect(sitemap).toContain("/about");
    expect(sitemap).toContain("supabaseAdmin");
    expect(sitemap).toContain("s-maxage=3600");
    expect(sitemap).toContain("lastmod");
    // Rute personal (history/account/result-*) DILARANG masuk sitemap.
    expect(sitemap).not.toContain('"/history"');
    expect(sitemap).not.toContain('"/account"');
    expect(sitemap).not.toContain('"/result-place"');
  });
});

describe("OG / Twitter / canonical (share preview)", () => {
  it("global head: og:image absolut + twitter card + og:site_name + og:locale + og:url", () => {
    expect(NUXT).toContain("/og-default.png");
    expect(NUXT).toContain("summary_large_image");
    expect(NUXT).toContain("og:site_name");
    expect(NUXT).toContain("og:locale");
    expect(NUXT).toContain("id_ID");
    // Canonical per-halaman (bukan global) — hindari duplikat di rute non-index.
    expect(NUXT).toContain("og:url");
  });

  it("og-default.png (1200x630) ADA di public/", () => {
    expect(sourceExists("public/og-default.png")).toBe(true);
  });

  it("home: canonical absolut + og:url (2 meta sama-sama ada)", () => {
    expect(HOME).toContain("canonical");
    expect(HOME).toContain(`${SITE}/`);
    expect(HOME).toContain("og:url");
  });

  it("mall hub + detail: canonical absolut per-halaman", () => {
    expect(MALL).toContain("canonical");
    expect(MALL).toContain(`${SITE}/mall`);
    expect(DETAIL).toContain("canonical");
    expect(DETAIL).toContain(`${SITE}/mall/`);
  });

  it("per-mall og:title dinamis dari nama mall (share preview context-aware)", () => {
    expect(DETAIL).toContain("og:title");
    // Nama mall masuk title og (template literal).
    expect(DETAIL).toMatch(/og:title[\s\S]{0,160}mallName/);
  });
});

describe("footer publik (kredibilitas share, bukan pesan dev)", () => {
  it("footer: copy produk + 3 link (Tentang, Privacy, Terms) + TANPA jargon dev", () => {
    expect(APP).toContain("Privacy");
    expect(APP).toContain("Terms");
    expect(APP).toContain("© 2026");
    // Jargon internal dihapus dari footer.
    expect(APP).not.toContain("$0/month");
    expect(APP).not.toContain("Hermes-combo");
  });

  it("halaman privacy + terms + about ADA (stub jujur, gate review Google OAuth)", () => {
    expect(sourceExists("pages/privacy.vue")).toBe(true);
    expect(sourceExists("pages/terms.vue")).toBe(true);
    expect(sourceExists("pages/about.vue")).toBe(true);
    expect(sourceExists("features/legal/LegalPage.vue")).toBe(true);
  });
});

describe("GA4 wiring (ukur share → kunjungan)", () => {
  it("plugin gtag.client.ts: pakai runtimeConfig gaId + guard kosong", () => {
    const GA = readSource("plugins/gtag.client.ts");
    expect(GA).toContain("gaId");
    expect(GA).toContain("googletagmanager.com/gtag/js");
    // Guard: gaId kosong → plugin no-op (dev tidak kirim data).
    expect(GA).toMatch(/if\s*\(\s*!\s*gaId/);
  });
});
