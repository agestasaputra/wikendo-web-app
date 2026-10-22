/**
 * GET /sitemap.xml — Sitemap dinamis (SEO teknis): halaman publik + seluruh mall aktif.
 *
 * APA: daftar URL yang boleh di-index Google (4 halaman statis + /mall/:slug dari DB).
 * KENAPA: /mall/:slug = konten SEO utama (tenant kuliner per mall). Tanpa sitemap,
 *   indexing long-tail lambat; sitemap mempercepat penemuan halaman (CAC organik = 0).
 * Cache: s-maxage=3600 — hemat DB; konten sitemap cukup segar per jam.
 * Contoh: curl https://www.wikendo.id/sitemap.xml | grep -c "<url>"
 */
import { supabaseAdmin } from "../utils/db";

const SITE = "https://www.wikendo.id";

interface SitemapEntry {
  loc: string;
  priority: string;
  changefreq: string;
}

export default defineEventHandler(async (event) => {
  setHeader(event, "Content-Type", "application/xml; charset=utf-8");
  setHeader(
    event,
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400",
  );

  // DB down jangan bikin sitemap 500 — halaman statis tetap valid buat crawler.
  let mallSlugs: string[] = [];
  try {
    const { data } = await supabaseAdmin()
      .from("malls")
      .select("slug")
      .eq("is_active", true)
      .order("name");
    mallSlugs = (data || []).map((row: { slug: string }) => row.slug);
  } catch {
    // sengaja kosong: fallback halaman statis.
  }

  const today = new Date().toISOString().slice(0, 10);
  const entries: SitemapEntry[] = [
    { loc: `${SITE}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${SITE}/mall`, priority: "0.9", changefreq: "daily" },
    { loc: `${SITE}/place`, priority: "0.8", changefreq: "monthly" },
    { loc: `${SITE}/food`, priority: "0.8", changefreq: "monthly" },
    { loc: `${SITE}/about`, priority: "0.5", changefreq: "monthly" },
    ...mallSlugs.map((slug) => ({
      loc: `${SITE}/mall/${slug}`,
      priority: "0.7",
      changefreq: "weekly",
    })),
  ];

  const body = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
});
