# Glossary

Single source of truth for terminology used across `docs/architecture/`. Use the **bolded form** when writing or editing any doc. Add an entry here before introducing a new term.

---

## 1. Domain Concepts

| Term          | Definition                                                                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wikendo**   | Product: quiz → weekend recommendations in Jabodetabek. Two fully separate modes: **Tempat** (Place) and **Makan** (Food).                                              |
| **Tempat**    | Mode that recommends 5 tourist/hangout places via LLM (slice `features/place`). Route `/place` → `/result-place` (legacy `/quiz` → `/result` 301). Never mixed with tenants.                            |
| **Makan**     | Mode that recommends 5 **Tenants** in 1 mall (slice `features/food`). Route `/food` → `/result-food`. Candidates come from the DB first; the LLM only ranks.                           |
| **Mall**      | One of the 5 active malls (`grand-indonesia`, `central-park`, `kota-kasablanka`, `pondok-indah-mall`, `aeon-bsd`). Identity = **slug**.    |
| **Tenant**    | Restaurant/cafe inside a mall (row of the `tenants` table). Has tri-state flags `halal`, `kids_friendly`, `hype_tiktok` (NULL = not yet researched).        |
| **Direktori** | Pages `/mall` + `/mall/:slug`: list of malls & tenants with no login/quota/LLM (SEO).                                                             |
| **Quota**     | Daily generate allowance. **Anon**: place 1x + food 2x (cookie). **Registered**: place 2x + food 5x. Resets at 00:00 WIB.                         |
| **Anon**      | User who is not logged in. Quota is tracked via the `quota_used` / `food_quota_used` cookies.                                                            |
| **Wall**      | UI moment that locks an action for anon users and redirects to login (#1 quota, #2 Save, #3 Wishlist/History, #4 voucher claim).                  |
| **Wallet**    | Quota card on Home: remaining headline ("1 tempat • 2 makan") + a chip per mode. Always honest, following `GET /api/quota`.                                 |
| **Voucher**   | Tenant promo (`vouchers`). **Claiming** requires login; 1 user + 1 tenant + 1 day = 1 claim; max 3 claims/day.                                 |
| **Gift**      | V12 voucher banner style in the food result hero ("Ada -20% buat lu" + Buka →). Promo details live in the **Sheet**.                                         |
| **Sheet**     | Overlay panel: `QuizPlusSheet` (pick a quiz) and `VoucherSheet` (pick 1 of 3 promos).                                                         |
| **History**   | List of the latest quiz results (max 20) in localStorage `wikendo_history`. No backend.                                                             |
| **Hero**      | Main card of a result (BEST deck) or the quota block on Home. Its value is derived by pure helpers (`buildPlaceHero`, `buildFoodHero`).            |
| **Slicing**   | Copying a design/screenshot 1:1 into a component. "Token lock" = colours/spacing locked by Agesta (ink `#0C0A09`, ember `#EA580C`, lime `#A3E635`). |
| **Sentinel**  | Element at the bottom of a list that triggers loading the next page when it enters the viewport (infinite scroll, `useSentinelObserver`).                            |

## 2. Architecture Patterns

| Term                   | Definition                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Feature slice**      | Folder `app/features/<name>/` containing `XPage.vue`, `components/`, `utils/`, `constants/`, `@types/`, `store/`. Must not import other slices. |
| **Thin page**          | An `app/pages/*.vue` file that only renders 1 `XPage.vue` from a feature (no business logic).                                                |
| **Common**             | `app/common/`: components, composables, store, utils, constants, types shared across features. Must not import `features/`.          |
| **Pure helper**        | Input → output function with no side effects/route/cookie/DB; the only place where logic can be tested without Nuxt (`utils/`, `*/utils/`).            |
| **Setup store**        | Pinia store using setup syntax (`defineStore("x", () => {...})`), file `XStore.ts`, function `useXStore()`.                                      |
| **File-assert test**   | Test that reads source as text (`test/utils.ts → readSource`) to lock UI copy/tokens. ZERO network, deterministic.               |
| **Definition of done** | Checklist in `AGENTS.md`: lint 0, type-check 0, tests green, build exit 0, docs & boundaries preserved.                                           |

## 3. External Services

| Term                      | Definition                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Supabase**              | Postgres + Auth. Browser uses the anon key (`useSupabaseBrowser`); server uses the service key (`supabaseAdmin`, bypasses RLS). |
| **Cloudflare Workers AI** | Production LLM provider (OpenAI-compatible endpoint). Chosen when `cfAccountId` + `cfApiToken` are set.                      |
| **Hermes-combo**          | Local LLM provider for dev (`http://127.0.0.1:20128`). Fallback when the Cloudflare env is empty.                              |
| **Vercel**                | Production hosting (root directory = `app/`).                                                                                 |
| **Google OAuth**          | 1-click login via Supabase `signInWithOAuth({ provider: "google" })`.                                                      |
| **GitHub Actions**        | CI `.github/workflows/ci.yml`: security (gitleaks + audit) and verify (lint, type-check, test, build).                      |
