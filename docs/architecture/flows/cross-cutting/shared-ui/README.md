---
topic: shared-ui
status: ready
related: [layout-navigation, mall-directory, state-management]
code:
  - app/common/components/AppLoader.vue
  - app/common/components/AppSpinner.vue
  - app/common/components/QuizHeader.vue
  - app/common/components/QuizOptionList.vue
  - app/common/components/ResultError.vue
  - app/common/composables/useInfiniteList.ts
  - app/common/composables/useSentinelObserver.ts
  - app/common/composables/useSupabaseBrowser.ts
  - app/common/constants/malls.ts
  - app/utils/error.ts
  - app/tailwind.config.ts
---

# Shared UI & Utilities

## TL;DR

Semua yang dipakai ≥2 feature hidup di `app/common/` (components, composables, store, utils, constants, types). Komponen & composable memakai import eksplisit (`~/common/...`), bukan auto-import.

## Components

| Component        | Role                                                                |
| ---------------- | ------------------------------------------------------------------- |
| `AppLoader`      | Spinner fetch per variant (tempat orange / makan merah / mall teal) |
| `AppSpinner`     | Ikon spinner tombol (warna + ukuran via prop)                       |
| `QuizHeader`     | Header ink quiz (label putih, dot, segmen lime)                     |
| `QuizOptionList` | Daftar opsi jawaban 56px                                            |
| `ResultError`    | Wall quota vs error + Coba lagi                                     |

## Composables & Utils

| Item                     | File                                            | Role                                        |
| ------------------------ | ----------------------------------------------- | ------------------------------------------- |
| `useInfiniteList`        | `app/common/composables/useInfiniteList.ts`     | Paging start/loadMore/reset                 |
| `useSentinelObserver`    | `app/common/composables/useSentinelObserver.ts` | Sentinel infinity scroll                    |
| `useSupabaseBrowser`     | `app/common/composables/useSupabaseBrowser.ts`  | Client Supabase browser                     |
| `getErrorMessage/Status` | `app/utils/error.ts`                            | Ekstraksi pesan/status dari error `unknown` |
| `MALL_NAMES`             | `app/common/constants/malls.ts`                 | Slug → nama + label pendek                  |

## Rules

- `common/` dan `utils/` dilarang import `features/` (ESLint error).
- Template di folder baru → daftarkan di `app/tailwind.config.ts` (`content`); tanpa itu Tailwind membuang class-nya. Dijaga `app/common/__tests__/tailwindContent.spec.ts`.
- Menambah mall: 1 entry di `MALL_NAMES` + `MALL_SHORT_LABELS`, 1 option Q1 makan, 1 row tabel `malls`.

## See Also

[layout-navigation](../../layout-navigation/README.md) · [mall-directory](../../mall-directory/README.md)
