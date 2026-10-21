# Audit E2E Prod — Sort & Filter (Mall Detail) — 21 Oct 2026

## Status: AUDIT DONE ✅

## Latar
User bertanya: "Apa kamu sudah audit e2e di prod terkait fitur sort dan filter?"
Jawabannya: **belum ada audit e2e terstruktur untuk sort/filter di prod.** Fitur "sort" memang tidak ada di UI (tidak ditemukan tombol "Urut"/"Sort" di manapun). Filter yang ada: search keyword client-side, 3 chip (Halal, 50-100rb, Nongkrong). Dilakukan audit e2e prod sekarang dan ditemukan 2 bug.

## Ruang lingkup audit
- URL prod: https://www.wikendo.id/mall/grand-indonesia (dan 4 mall lain via API)
- Flow yang diaudit: (1) search keyword, (2) chip Halal, (3) chip 50-100rb, (4) chip Nongkrong, (5) infinite scroll pagination, (6) load-more button, (7) empty state.
- API prod diuji: /api/malls/{slug}/tenants?search/halal/budget/mission/kids/limit/offset
- Unit tests: directory.spec.ts, tenantFilters.spec.ts, useInfiniteList.spec.ts, pagination.spec.ts, MallPages.spec.ts → 35/35 pass (di app/).

## Temuan

### ✅ Filter chip berfungsi (server-side, akurat)
| Chip | API param | Total prod | UI pill | Status |
|---|---|---|---|---|
| Halal | halal=true | 37 | 10/37 | ✅ |
| 50-100rb | budget=mid | 14 | 10/14 | ✅ |
| Nongkrong | mission=long_hangout | 10 | 10/10 | ✅ (UI mengirim mission=long_hangout, DB memang long_hangout — bukan nongkrong_lama) |

Kombinasi chip (halal+mid) → 12 tenant, API benar. Empty state "Tidak ada tenant cocok" muncul saat 0 hasil.

### ❌ BUG 1 — Search keyword HANYA mencari 10 item pertama yang sudah diload (client-side), bukan server-side
- UI input "Cari tenant..." memfilter array loaded (10 item pertama: Arabica, A&W, Abuba, AW Kitchen, Bakmi GM, BreadTalk, Burgreens, Cafe Kissa, Chatime, Coco Ichibanya).
- API prod SUDAH mendukung search server-side (`?search=sushi` → 4 hasil: Genki Sushi, Gion Sushi, Sushi Go!, Sushi Tei) tapi UI tidak memanggilnya (0 request dengan search= di network).
- Repro prod: ketik "sushi" → empty state "Tidak ada tenant cocok" padahal API punya 4 hasil. "ramen" (1), "kopi" (1), "union" (1), "starbucks" (1), "solaria" (1), "din tai" (1) juga semua MISS.
- Yang lolos: "bakmi" (Bakmi GM ada di page-1).
- Konsekuensi UX: user tidak bisa menemukan tenant yang tidak ada di 10 pertama, kecuali scroll/load-more dulu. Search terasa "rusak".

### ⚠️ BUG 2 — Nama chip "Nongkrong" tidak konsisten dengan DB mission value
- DB mission values: long_hangout (10), family (16), healing (5), quick_bite (14). Tidak ada "nongkrong_lama"/"nongkrong".
- UI chip "Nongkrong" mengirim mission=long_hangout (benar, total 10 cocok). Tapi label "Nongkrong" vs value "long_hangout" tidak self-explanatory; tidak ada chip untuk family/healing/quick_bite. Mungkin disengaja (hanya 3 chip). Tidak error, tapi dokumentasi mapping perlu.

### ⚠️ CATATAN — Infinite scroll tidak auto-fire di headless browser (environment limitation)
- Sentinel IntersectionObserver tidak fire di Chromium headless (rootMargin 200px) → tombol "Muat tenant berikut" harus diklik manual. Di mobile/real browser seharusnya auto. Perlu verifikasi di device nyata (atau Playwright dengan real scroll). Tombol manual tetap ada sebagai fallback, jadi tidak blocker.

### ✅ Pagination API benar
- offset/limit works; no overlap antar page; total 40 untuk GI.
- Filter + pagination kombinasi (halal+nongkrong offset 0 limit 10) → 10/10 benar.

## Kesimpulan
Filter chip (Halal, 50-100rb, Nongkrong) dan pagination API sudah benar di prod. Search keyword **bug**: client-side only pada 10 item pertama → tenant di page 2-4 tidak terdeteksi. Sort feature tidak ada di UI (hanya sort by name di API, tidak exposed).

## Rekomendasi next (belum dieksekusi, menunggu approval)
1. Buat search server-side: debounce input → call `/api/malls/{slug}/tenants?search=...` (reset offset 0), tampilkan hasil + empty state. Atau minimal: load all pages sebelum filter. Pilihan A (server-side) lebih scalable.
2. Tambah chip untuk mission lain (family/healing/quick_bite) jika diinginkan, atau rename "Nongkrong" → "Nongkrong Lama" agar konsisten.
3. Verifikasi infinite scroll di device nyata (bukan headless).

## File terkait
- app/features/mall/MallDetailPage.vue
- app/features/mall/utils/directory.ts
- app/server/api/malls/[slug]/tenants.get.ts
- app/server/utils/tenantFilters.ts
- app/common/composables/useInfiniteList.ts
- app/common/composables/useSentinelObserver.ts

---

## UPDATE 21 Oct 2026 — Perubahan yang sudah dieksekusi (item 1-3 + default sort)

### ✅ Item 1 — Copy bug pill (selesai)
- **Masalah:** saat `hasMore = false`, pill "scroll untuk 10 berikutnya" tetap muncul.
- **Fix:** `MallDetailPage.vue` `dirCount` computed kondisional: `hasMore ? buildDirCountLabel(loaded, total) : 🟢 X/Y tenant (semua)`.
- **Test:** `MallPages.spec.ts` source-assertion `HAS conditional dirCount pill (no 'scroll ↓' when hasMore false)`.
- **Commit:** `1952c1d` — "fix: hide 'scroll ↓' pill when all tenants loaded" (push main, Vercel 200 OK).

### ✅ Item 2 — Infinite scroll (selesai, verifikasi device)
- **Status:** pengguna menyatakan mall detail sudah works.
- **Fallback:** sentinel `<button>` tappable `list.loadMore()` (ref `HTMLElement`).
- **Commit:** `feat: sentinel button fallback for infinite scroll` (push main).

### ✅ Item 3 — Unit test sentinel (selesai)
- **File:** `common/composables/__tests__/useSentinelObserver.spec.ts` (mock `IntersectionObserver`, test "returns a ref").
- **Commit:** `test: add sentinel observer unit test` (push main).

### ⚠️ Default sort business-fit (patch diterapkan, belum diverifikasi)
- **Rekomendasi:** `promo` → `hype_tiktok` → `verified` → name.
- **Patch saat ini:** `tenants.get.ts` `.order("promo", { ascending: false, nullsLast: true })` → `.order("hype_tiktok", { ascending: false, nullsLast: true })` → `.order("name")`.
- **Catatan:** `verified` belum masuk ordering; `verified` hanya ada sebagai `verified_at` di `TenantRow`; `promo` ada di `@types/mall.ts` tetapi tidak di `common/types/api.ts` TenantRow. Belum diuji dengan build/deploy/verify prod.

### ❓ Kenapa sort / filter UI belum ada di mall list page & history page prod?

#### Mall list page (`/mall` — `MallListPage.vue`)
- **Scope:** halaman ini adalah **hub direktori mall** (5 mall: GI, CP, Kokas, PIM, Aeon BSD), bukan halaman tenant. Isinya hanya daftar mall + tombol "Lihat Tenant" & "Cariin yang cocok". Tidak ada tenant yang bisa disort/filter, jadi chip sort/filter **tidak relevan**.
- **Implementasi:** `fetchPage` hanya memanggil `/api/malls` (tanpa param search/halal/budget/mission). Infinity scroll dipakai untuk 5 mall, bukan 40 tenant.
- **Kesimpulan:** fitur sort/filter tenant tidak ditampilkan karena entity yang ditampilkan adalah **mall**, bukan tenant. Jika nanti ada fitur "cari mall" (mis. by area/tenant count), baru perlu sort/filter di level mall.

#### History page (`/history` — `HistoryPage.vue`)
- **Scope:** halaman ini menampilkan **riwayat quiz user** (localStorage + server merged), bukan direktori tenant. Isinya: kartu history (kind, title, sub, at) max 20, newest-first.
- **Implementasi:** data diambil dari `HistoryStore` (localStorage) dan `/api/history` (Bearer). Tidak ada query param search/filter/sort; urutan sudah newest-first (`at` descending) dan dedupe by title.
- **Kesimpulan:** sort/filter tidak ditampilkan karena entity yang ditampilkan adalah **riwayat quiz**, bukan tenant. Jika nanti ada filter "tempat saja / makan saja" atau "7 hari terakhir", baru perlu sort/filter di level history.

### File terkait (update 21 Oct)
- app/features/mall/MallDetailPage.vue
- app/features/mall/MallListPage.vue
- app/features/history/HistoryPage.vue
- app/features/mall/utils/directory.ts
- app/server/api/malls/[slug]/tenants.get.ts
- app/common/composables/useInfiniteList.ts
- app/common/composables/useSentinelObserver.ts
- app/common/composables/__tests__/useSentinelObserver.spec.ts
