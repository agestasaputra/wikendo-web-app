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

Everything used by ≥2 features lives in `app/common/` (components, composables, store, utils, constants, types). Components & composables use explicit imports (`~/common/...`), not auto-import.

## Components

| Component        | Role                                                                |
| ---------------- | ------------------------------------------------------------------- |
| `AppLoader`      | Fetch spinner per variant (place orange / food red / mall teal)    |
| `AppSpinner`     | Button spinner icon (colour + size via props)                      |
| `QuizHeader`     | Quiz ink header (white label, dot, lime segments)                  |
| `QuizOptionList` | 56px answer option list                                           |
| `ResultError`    | Quota wall vs error + Coba lagi                                   |

## Composables & Utils

| Item                     | File                                            | Role                                        |
| ------------------------ | ----------------------------------------------- | ------------------------------------------- |
| `useInfiniteList`        | `app/common/composables/useInfiniteList.ts`     | Paging start/loadMore/reset                 |
| `useSentinelObserver`    | `app/common/composables/useSentinelObserver.ts` | Infinite-scroll sentinel                   |
| `useSupabaseBrowser`     | `app/common/composables/useSupabaseBrowser.ts`  | Browser Supabase client                    |
| `getErrorMessage/Status` | `app/utils/error.ts`                            | Extract message/status from an `unknown` error|
| `MALL_NAMES`             | `app/common/constants/malls.ts`                 | Slug → name + short label                  |

## Rules

- `common/` and `utils/` must not import `features/` (ESLint error).
- Templates in a new folder → register them in `app/tailwind.config.ts` (`content`); otherwise Tailwind drops their classes. Guarded by `app/common/__tests__/tailwindContent.spec.ts`.
- Adding a mall: 1 entry in `MALL_NAMES` + `MALL_SHORT_LABELS`, 1 Q1 food option, 1 row in the `malls` table.

## See Also

[layout-navigation](../../layout-navigation/README.md) · [mall-directory](../../mall-directory/README.md)
