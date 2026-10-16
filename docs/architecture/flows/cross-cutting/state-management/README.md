---
topic: state-management
status: ready
related: [auth, history, voucher-claim, shared-ui]
code:
  - app/common/store/AuthStore.ts
  - app/common/store/HistoryStore.ts
  - app/features/makan/store/VoucherStore.ts
  - app/nuxt.config.ts
---

# State Management

## TL;DR

Pinia (setup syntax, `@pinia/nuxt`) untuk state yang dipakai banyak file/feature. Composable + `ref` untuk state lokal satu feature. Data server yang cukup dibaca sekali per halaman memakai `useFetch`. Quiz memakai state lokal + query string (tanpa store).

## Decision Guide

| Situasi                                              | Pakai                                                  |
| ---------------------------------------------------- | ------------------------------------------------------ |
| Dipakai ≥2 file / lintas feature / seluruh app       | Pinia store (`common/store` atau `features/<f>/store`) |
| Hanya 1 halaman/komponen                             | `ref`/`reactive` lokal                                 |
| Logic stateful dipakai ≥2 halaman, tanpa persistensi | Composable (`common/composables`)                      |
| Data GET yang dirender SSR (mis. quota)              | `useFetch`                                             |
| Jawaban quiz                                         | state lokal → query string → result                    |

## Stores

| Store          | File                                       | State                                   | Persistensi      |
| -------------- | ------------------------------------------ | --------------------------------------- | ---------------- |
| `AuthStore`    | `app/common/store/AuthStore.ts`            | isLoggedIn, email, displayName, initial | Supabase session |
| `HistoryStore` | `app/common/store/HistoryStore.ts`         | items (max 20)                          | localStorage     |
| `VoucherStore` | `app/features/makan/store/VoucherStore.ts` | claiming, claimedCode, claimError       | — (per sesi)     |

## Rules

- File `XStore.ts`, fungsi `useXStore()`, nama store `xStore`.
- Destructure state dengan `storeToRefs()` (destructuring langsung memutus reaktivitas).
- Store di `features/` hanya dipakai feature itu; lintas feature → `common/store`.
- Modul yang diuji unit mengimpor `vue`/`pinia` secara eksplisit (tanpa auto-import).

## See Also

[auth](../../auth/README.md) · [history](../../history/README.md) · [voucher-claim](../../voucher-claim/README.md)
