---
topic: state-management
status: ready
related: [auth, history, voucher-claim, shared-ui]
code:
  - app/common/store/AuthStore.ts
  - app/common/store/HistoryStore.ts
  - app/features/food/store/VoucherStore.ts
  - app/nuxt.config.ts
---

# State Management

## TL;DR

Pinia (setup syntax, `@pinia/nuxt`) for state used by many files/features. Composables + `ref` for the local state of a single feature. Server data that only needs to be read once per page uses `useFetch`. The quiz uses local state + query string (no store).

## Decision Guide

| Situation                                            | Use                                                    |
| ---------------------------------------------------- | ------------------------------------------------------ |
| Used by ≥2 files / across features / app-wide        | Pinia store (`common/store` or `features/<f>/store`) |
| Only 1 page/component                                | `ref`/`reactive` lokal                                 |
| Stateful logic used by ≥2 pages, no persistence      | Composable (`common/composables`)                      |
| GET data rendered via SSR (e.g. quota)              | `useFetch`                                             |
| Quiz answers                                        | local state → query string → result                   |

## Stores

| Store          | File                                       | State                                   | Persistence      |
| -------------- | ------------------------------------------ | --------------------------------------- | ---------------- |
| `AuthStore`    | `app/common/store/AuthStore.ts`            | isLoggedIn, email, displayName, initial | Supabase session |
| `HistoryStore` | `app/common/store/HistoryStore.ts`         | items (max 20)                          | localStorage     |
| `VoucherStore` | `app/features/food/store/VoucherStore.ts` | claiming, claimedCode, claimError       | — (per session)  |

## Rules

- File `XStore.ts`, function `useXStore()`, store name `xStore`.
- Destructure state with `storeToRefs()` (direct destructuring breaks reactivity).
- A store in `features/` is used only by that feature; cross-feature → `common/store`.
- Unit-tested modules import `vue`/`pinia` explicitly (no auto-import).

## See Also

[auth](../../auth/README.md) · [history](../../history/README.md) · [voucher-claim](../../voucher-claim/README.md)
