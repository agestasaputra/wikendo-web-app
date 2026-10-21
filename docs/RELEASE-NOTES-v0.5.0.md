# Wikendo — Release Notes (1 halaman)

**Versi:** v0.5.0 — "Directory-first" (21 Okt 2026)
**Scope:** Mall directory (GI, Senayan City, …) + tenant ranking + analytics

## Apa yang baru
- **Sort bisnis yang jujur.** Ranking default kini: `promo live → hype TikTok → verified → nama`.
  Promo bukan kolom palsu di `tenants`: promo nyata datang dari join tabel `vouchers`
  (`promo_active = true` & `valid_until > now`). Tidak ada lagi kolom `promo` fiktif.
- **Pencarian & filter server-side.** `?search`, `?halal`, `?budget`, `?mission`, `?kids` dievaluasi
  di Postgres (ilike + eq); mission (array) di-memory. Infinity scroll 10/page, sticky count
  `10/40` + 2-row skeleton + tombol fallback jika IntersectionObserver tidak tembak.
- **Metric funnel.** Endpoint tenants menulis 1 baris `analytics_events` per request pencarian/filter
  (event `directory_search` / `directory_filter` + keyword + filter + result_count).
  Klik promo di PromoStrip menulis `promo_click` (keepalive, best-effort).
  Sink: tabel `analytics_events` yang sudah ada — tidak ada DDL baru.
- **Aksesibilitas & performa.** Sentinel button fallback (tappable) untuk scroll yang gagal tembak.

## Yang diperbaiki (bug)
- Kolom `promo` palsu di `tenants` (PostgREST 400 → listing kosong) — dihapus dari path query.
- HistoryStore di SSR (window undefined) — 9 test yang gagal sebelumnya karena happy-dom env.

## Cara verifikasi (staging smoke)
1. `GET /api/malls/grand-indonesia/tenants?limit=10&offset=0` → 200, `items.length ≤ 10`, `total ≥ items.length`.
2. `?search=sushi&limit=5` → item cocok; cek 1 row baru di `analytics_events` (`event_type='directory_search'`).
3. `?halal=true` → hanya tenant halal; cek 1 row `directory_filter`.
4. Klik promo di PromoStrip → 1 row `promo_click` (network tab: POST `/api/analytics/track` → 204).
5. Scroll ke bawah sampai habis → pill `🟢 N/N tenant (semua)`; tombol fallback muncul jika IO tidak tembak.
6. `npx vitest run` → 0 fail baru (9 fail pre-existing env, lihat catatan).

## Known limitations
- Metric ditulis server-side per request; cache CDN 60s menekan volume row.
- Promo rank dihitung in-memory (1 query vouchers per mall) — OK untuk ≤ 40 tenant/mall.
- Item 6 staging/e2e smoke: dijalankan manual via curl + browser (tidak ada Playwright di repo).

## Files touched
- `app/common/constants/analytics.ts`, `app/common/composables/useAnalytics.ts`
- `app/server/utils/directoryMetrics.ts`, `app/server/utils/clientEvent.ts`
- `app/server/api/analytics/track.post.ts`
- `app/server/api/malls/[slug]/tenants.get.ts` (metric + sort business-fit)
- `app/features/mall/components/PromoStrip.vue` (promo_click)
- `app/server/utils/__tests__/directoryMetrics.spec.ts`, `clientEvent.spec.ts`
- `docs/08-PROGRESS.md` (BOARD + LOG)
- `docs/RELEASE-NOTES-v0.5.0.md` (file ini)
