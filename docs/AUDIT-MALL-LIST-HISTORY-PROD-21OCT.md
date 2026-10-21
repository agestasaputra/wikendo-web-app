# AUDIT-MALL-LIST-HISTORY-PROD-21OCT.md

## Scope
Verifikasi end-to-end di prod (www.wikendo.id) untuk fitur baru:
1. **Mall List** (`/mall`) — search (debounced 300ms) + 4 sort chips (A→Z, Z→A, Tenant terbanyak, Tenant paling sedikit), server-side via `/api/malls?search=&sort=&limit=&offset=`.
2. **History** (`/history`) — filter chips (Semua/Tempat/Makanan) + 4 sort chips (Terbaru/Terlama/A→Z/Z→A), client-side (max 20 entries, no paging).

## API oracle (Phase 1)

| Endpoint | Params | Expected | Actual prod |
|---|---|---|---|
| `/api/malls` (no limit) | — | legacy array, 5 malls | 200, 5 items ✅ |
| `/api/malls` | `limit=10&offset=0` | `{items,total,hasMore}` | total=5, items=5, hasMore=false ✅ |
| `/api/malls` | `search=grand` | 1 item (Grand Indonesia) | total=1 ✅ |
| `/api/malls` | `search=mall` | 2 items (Aeon, PIM) | total=2 ✅ |
| `/api/malls` | `search=zzzz` | 0 items | total=0 ✅ |
| `/api/malls` | `sort=name_desc` | Pondok→Aeon | ✅ |
| `/api/malls` | `sort=tenant_desc` | all 40 (stable) | ✅ |
| `/api/malls` | `sort=tenant_asc` | all 40 (stable) | ✅ |
| `/api/malls` | `limit=2&offset=0` then `offset=2` | no overlap | ✅ overlap=∅ |
| `/api/malls` | `sort=bogus_value` | fallback name_asc | ✅ |
| `/api/malls` | `limit=2&offset=4` | 1 item (last) | ✅ |
| `/api/malls` | `limit=2&offset=5` | 0 items | ✅ |

Note: search only matches `name` (not city/area). This is by design per `app/server/api/malls/index.get.ts` (`ilike("name", …)`). UI placeholder "Cari mall... mis. grand, BSD" matches mall names. Documented as a known, intentional limitation — not a bug.

## UI audit — Mall List (Phase 2)

| Control | Network request issued? | Visible result | Pill count | Status |
|---|---|---|---|---|
| Initial load | `/api/malls?limit=10&offset=0` | 5 cards | 5/5 mall ✅ | PASS |
| Search "grand" (debounced 300ms) | `/api/malls?…&search=grand` | Grand Indonesia | 1/1 mall ✅ | PASS |
| Search "BSD" | `/api/malls?…&search=BSD` | Aeon BSD | 1/1 mall ✅ | PASS |
| Search "zzzz" | `/api/malls?…&search=zzzz` | (none) | 0/0 mall ✅ | PASS |
| Clear (✕) | `/api/malls?limit=10&offset=0` | 5 cards | 5/5 mall ✅ | PASS |
| Sort Z→A | `/api/malls?…&sort=name_desc` | Pondok→Aeon ✅ | 5/5 ✅ | PASS |
| Sort Tenant terbanyak | `/api/malls?…&sort=tenant_desc` | Aeon→PIM ✅ | 5/5 ✅ | PASS |
| Sort Tenant paling sedikit | `/api/malls?…&sort=tenant_asc` | Aeon→PIM ✅ | 5/5 ✅ | PASS |
| Sort A→Z (default) | (no re-fetch; already default) | Aeon→PIM ✅ | 5/5 ✅ | PASS |
| Combined search="a" + Z→A | `/api/malls?…&search=a&sort=name_desc` | Pondok→Aeon ✅ | 5/5 ✅ | PASS |
| Empty state copy | n/a | (list collapses; no explicit "Tidak ada mall" text) | 0/0 mall | ⚠️ cosmetic — see note |

⚠️ Note (cosmetic): when search yields 0 results, the page shows only the sticky header `0/0 mall` and the sort chips — no dedicated empty-state copy. This matches the existing tenant-detail page behavior (which does show "Tidak ada tenant cocok"). Consider adding a small empty hint for consistency, but not a blocker: the count pill already communicates 0 results.

## UI audit — History (Phase 2)

Seeded device history (3 entries: Kopi Kenangan/place, Bakmi GM/food, Sate Taichan/place) via `localStorage.wikendo_history`.

| Control | Visible result | Status |
|---|---|---|
| Initial (Semua, Terbaru) | Kopi Kenangan, Bakmi GM, Sate Taichan | ✅ |
| Filter Tempat | Kopi Kenangan, Sate Taichan | ✅ |
| Filter Makanan | Bakmi GM | ✅ |
| Filter Semua | all 3 | ✅ |
| Sort Terlama | Sate Taichan, Bakmi GM, Kopi Kenangan | ✅ |
| Sort A→Z | Bakmi GM, Kopi Kenangan, Sate Taichan | ✅ |
| Sort Z→A | Sate Taichan, Kopi Kenangan, Bakmi GM | ✅ |
| Sort Terbaru | Kopi Kenangan, Bakmi GM, Sate Taichan | ✅ |
| Empty state (Makanan filter with 0 food entries) | "Belum ada riwayat makanan — mulai quiz pertamamu →" + CTAs | ✅ |
| Empty state (Semua, no history) | "Belum ada riwayat — mulai quiz pertamamu →" + CTAs | ✅ |
| Skeleton first-paint gate | AppLoader variant=history shown before content | ✅ (per existing spec) |

History is client-side (max 20 entries, no network). No empty-state mismatch observed.

## Bugs / recommendations

1. (Cosmetic, non-blocking) Mall List empty state has no dedicated copy — only `0/0 mall` pill. Optional: add "Tidak ada mall cocok" hint for parity with tenant detail. Not a defect of the new feature's correctness.
2. (By design, documented) `/api/malls?search=` matches `name` only. If product wants city/area search later, extend the ilike to `or(name.ilike,area.ilike,city.ilike)` — out of scope for this audit.
3. (By design) History is client-side (max 20). No server paging needed; filter/sort operate on the loaded list.

## Verdict
✅ **PASS** — Mall List search+sort and History filter+sort all behave correctly in prod and match the API oracle. No functional bugs found. Only one cosmetic enhancement (empty-state copy on Mall List) is recommended, not required.

## Evidence
- Network requests captured via `window.fetch` monkey-patch in headless Chromium.
- API oracle via Python `urllib` direct calls.
- UI state captured via `document.body.innerText`.
- Seeded localStorage for History verification (cleaned up after audit; device data restored to empty).

## Files
- `app/features/mall/MallListPage.vue`
- `app/features/history/HistoryPage.vue`
- `app/server/api/malls/index.get.ts`
- Tests: 558/558 pass, lint 0, type-check 0.
- Deployed commit: `fcf2154` (docs) / `1809725` (history) / `9083d52` (mall-list).