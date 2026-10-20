# Addendum 25 — SEO P0 Share-Ready (robots · sitemap · og-image · canonical · legal · GA4)

**Status:** APPROVED + DIEKSEKUSI (perintah Agesta 17 Okt 2026: "Gas eksekusi semua di p0")
**Tanggal:** 17 Oktober 2026 · **Owner:** Agesta · **Eksekutor:** Hermes (AI)
**Base:** PRD Final + Addendum 09 v1.3 + Addendum 24 (E1 BottomNav) — PRD Final TIDAK diubah (SOP §1).
**Catatan re-apply:** eksekusi pertama dibuat pre-refactor; setelah `origin/main` maju 10 commit (rename rute ID→EN: `/history` `/food` `/result-food`, vue-router v5), addendum ini di-RE-APPLY ke struktur baru — semua referensi rute di bawah sudah versi baru.

---

## 1. Masalah (hasil review pra-share 17 Okt 2026)

Fitur solid, tapi **belum share-ready** — 6 gap:

1. **NOL `robots.txt`** → Google tidak diberi tahu halaman mana yang boleh crawl; `/mall/:slug` (aset SEO long-tail) tidak terdiscover → CAC organik Rp0 hilang.
2. **NOL `sitemap.xml`** → 5 mall + 200 tenant lambat ter-index.
3. **NOL `og:image` + `twitter:card`** → share WA/IG/X = link abu-abu tanpa thumbnail → CTR share jatuh ±60%.
4. **NOL `canonical`** → `wikendo.id` vs `www.wikendo.id` + parameter `?mall=` berpotensi dibaca Google sebagai halaman ganda.
5. **Footer internal** ("Wikendo MVP • $0/month • Hermes-combo") → kesan "proyek iseng", bukan produk; gate review Google OAuth butuh Privacy/Terms.
6. **GA4 tidak ke-wire** (`runtimeConfig.public.gaId` ada, plugin tidak ada) → funnel share → kunjungan → quiz buta.

## 2. Keputusan & Eksekusi (P0 + 2 bonus P1)

1. **`app/public/robots.txt`** — allow publik; `Disallow` 7 rute personal (`/history` `/account` `/login` `/register` `/check-email` `/result-place` `/result-food`) + `/api/`; `Sitemap:` absolut `https://www.wikendo.id/sitemap.xml`. Alasan: hemat crawl budget + privasi user + konsisten dengan rute `ssr:false`.
2. **`app/server/routes/sitemap.xml.ts` (dinamis)** — `/` (1.0) + `/mall` (0.9) + `/place` `/food` (0.8) + `/mall/:slug` dari DB (`is_active=true`, 0.7); `Cache-Control: s-maxage=3600`; DB down → fallback 4 halaman statis (jangan 500, crawler tetap dapat sitemap valid).
3. **`app/public/og-default.png` 1200×630** — komposisi: icon dadu d16-night (transparan) di bg ink `#0C0A09` + strip ember `#EA580C` atas + eyebrow lime + headline "Bingung Weekend / Mau Kemana?" + pill lime `wikendo.id`. QA vision PASS.
4. **Global head `app/nuxt.config.ts`** — `og:type/site_name/locale/url/image` (+width/height) + `twitter:card=summary_large_image` + `twitter:title/description/image`. Canonical TIDAK global (hindari duplikat di rute non-index).
5. **Per-halaman `useHead`** — canonical + `og:url` di Home, `/mall`, `/mall/:slug`; `og:title` dinamis per mall di detail (share preview kontekstual).
6. **Footer publik `app/app.vue`** — copy produk ("Wikendo — biar weekend nggak bingung lagi.") + © 2026 + link Privacy/Terms; anchor `#tentang` tetap.
7. **(bonus P1) `app/plugins/gtag.client.ts`** — GA4 client-only, guard no-op saat `gaId` kosong; aktif otomatis begitu env `NUXT_PUBLIC_GA_ID` di-set di Vercel.
8. **(bonus P1) `app/pages/privacy.vue` + `app/pages/terms.vue` + `app/features/legal/LegalPage.vue`** — stub jujur (Supabase auth, cookie kuota anonim, GA4, kontak founder@wikendo.id).

## 3. Yang TIDAK dieksekusi (BACKLOG)

- Aktivasi GA4 live: set `NUXT_PUBLIC_GA_ID` di Vercel env (aksi user, ±2 menit).
- P2: OG per-mall dinamis (gambar), compress `icon-512.png` → webp + preload font, FAQ/Tentang 300 kata, event GA `quiz_start/result_view/voucher_claim`.

## 4. Konsekuensi

- Google bisa crawl + mulai index mall pages (SEO long-tail jalan); share sosmed tampil dengan thumbnail besar + judul.
- Rute personal tetap `ssr:false` + `Disallow` → privasi aman, crawl budget hemat.
- Sitemap cache 1 jam → beban DB terjaga; konten baru muncul di sitemap maks 1 jam.
- GA4 tidak mengirim data apa pun sampai env di-set (aman untuk dev/preview).

## 5. Verifikasi

- TDD: `app/common/__tests__/seo-p0.spec.ts` (10 assert file-teks, pola `security.spec.ts`) RED → GREEN.
- Suite lokal (pasca re-apply): 363/363 test (51 file) · lint 0 · build 9.71s 3.52MB (870kB gzip; `sitemap.xml.mjs` terbundel di server chunks). QA vision og-image PASS.
- Audit prod live: lihat LOG `docs/08-PROGRESS.md` entry 2026-10-17 "Gas SEO P0".
