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
