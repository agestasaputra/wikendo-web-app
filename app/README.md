# 🗓️ Wikendo — Nuxt Project Documentation

> 30-second quiz → 5 weekend recommendations in Jabodetabek + 20-second food quiz → 5 mall tenants.
> Stack: **Nuxt 4 + Vue 3 + TypeScript + Tailwind + Supabase + Hermes-combo (LLM)** — hosting on **Vercel, cost $0/month**.

This document is the main guide for the `app/` folder.
Written for **beginners**: each section explains **what it is, why it exists, and how to use it**.

> **For AI assistants** (Cursor, Copilot, Claude, etc.): read **[`../AGENTS.md`](../AGENTS.md)** (single source of truth:
> conventions, size limits, patterns for adding features, prohibitions) — not this README.
> **To understand the architecture**: [`../docs/architecture/architecture.md`](../docs/architecture/architecture.md) (hub + spoke per flow).
> **For unit testing**: `pnpm test` (Vitest, tests co-located in `__tests__/*.spec.ts`). New pure logic →
> put it in `utils/` (or `features/<x>/utils/`) + add a sibling test.

> ⚠️ **Update Oct 16, 2026:** the folder structure changed to _vertical slice_ (`features/`, `common/`) + Pinia + Prettier +
> type-check + Husky. Sections 3 (Folder Structure), 8 (Types), 10 (Lint), 11 (Commands) have been updated; other sections that
> mention `types/index.ts`, `utils/quiz-logic.ts` or `components/` are old notes.

---

## Table of Contents

1. [Big Picture](#1-big-picture)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Setup & Installation](#4-setup--installation)
5. [Environment Variables](#5-environment-variables)
6. [Pages](#6-pages)
7. [Server API (Backend)](#7-server-api-backend)
8. [Types (Data Contracts)](#8-types-data-contracts)
9. [Styling (Tailwind)](#9-styling-tailwind)
10. [Lint, Format & Type-check](#10-lint-format--type-check)
11. [NPM Commands](#11-npm-commands)
12. [End-to-End Data Flow](#12-end-to-end-data-flow)
13. [Quota & Limits](#13-quota--limits)
14. [Deploying to Vercel](#14-deploying-to-vercel)
15. [Troubleshooting (Common Issues)](#15-troubleshooting-common-issues)
16. [FAQ](#16-faq)

---

## 1. Big Picture

**Wikendo** answers one problem: _decision fatigue_ — not knowing what to do every weekend.

There are **2 totally separate modes** (their results are never mixed):

| Mode                | Route                    | Input                     | Output                           | Quota                                                 |
| ------------------- | ------------------------ | ------------------------- | -------------------------------- | ----------------------------------------------------- |
| 🗺️ **Plan** (place) | `/quiz` → `/result`      | 5 questions (~30 seconds) | 5 **place** recommendations      | Anonymous 1x (cookie; login 2x target for production) |
| 🍜 **Mall** (food)  | `/food` → `/result-food` | 4 questions (~20 seconds) | 5 **F&B tenant** recommendations | Anonymous 2x (cookie; login 5x target for production) |

Plus 1 directory page (no login, no quota, no LLM):

| Page              | Route         | Function                                                                  |
| ----------------- | ------------- | ------------------------------------------------------------------------- |
| 🏬 Mall directory | `/mall/:slug` | List all tenants of 1 mall + search & filter + banner to `/food?mall=...` |

**Why a monolith (1 repo)?**
Backend = Nuxt Server Routes + Supabase. There is no separate backend repo because Supabase is already the backend (Auth + Postgres + RLS), and the Nuxt server is only a thin layer: keep secrets, enforce quota, call the LLM. We'd only consider splitting if: there's a 2nd non-web client, >10k req/day, or a team >3 people. (See `docs/02-ADR.md`.)

---

## 2. Tech Stack

| Layer           | Technology                                 | Version         | Function                                                    |
| --------------- | ------------------------------------------ | --------------- | ----------------------------------------------------------- |
| Framework       | **Nuxt**                                   | ^4.6.0 (stable) | SSR + routing + server API in 1 framework                   |
| UI              | **Vue** + **Vue Router**                   | ^3.5 / ^4.5     | Reactive components + page navigation                       |
| Language        | **TypeScript**                             | ^5.6            | Type safety — mistyped fields caught before runtime         |
| Styling         | **Tailwind CSS** via `@nuxtjs/tailwindcss` | 6.14.0          | Utility-first CSS, no manual CSS                            |
| Database + Auth | **Supabase** (`@supabase/supabase-js`)     | 2.117.2         | Postgres + Auth + Row Level Security                        |
| LLM             | **Hermes-combo via 9Router**               | —               | Rank Top 5 + 1-sentence reason (see `server/utils/llm.ts`)  |
| Lint            | **ESLint 10** + `@nuxt/eslint`             | ^10 / 1.17.0    | Keep code consistent (`pnpm lint`)                          |
| Hosting         | **Vercel Hobby**                           | —               | 1 project = frontend + serverless backend                   |
| Analytics       | **GA4**                                    | —               | Events: quiz_started, quiz_completed, quota_exhausted, etc. |

**Laptop prerequisites:** Node.js 22.x (check: `node -v; pnpm -v`).

---

## 3. Folder Structure

Nuxt project location: **`wikendo-web-app/app/`** (not the repo root — the root holds `docs/`, `data/`, `design/`).

```text
app/
├── app.vue                  # Thin global layout: AppHeader + <NuxtPage/> + footer + BottomNav
├── nuxt.config.ts           # Modules (tailwind, eslint, pinia), runtimeConfig, head/SEO
├── eslint.config.mjs        # ESLint flat config + Prettier + size/module/security limits
├── .prettierrc              # semi, double quote, printWidth 80
├── tsconfig.json            # Nuxt tsconfig reference (used by `pnpm type-check`)
├── vitest.config.ts         # Co-located tests **/*.spec.ts
├── .husky/                  # pre-commit (lint-staged → type-check → test:related) + commit-msg
│
├── pages/                   # THIN ROUTES: file name = URL, content = render 1 XPage from features/
├── features/                # VERTICAL SLICE per domain (may not import each other)
│   ├── home/  place/  food/  mall/  auth/  account/  history/
│   │   └── XPage.vue · components/ · utils/ · constants/ · @types/ · store/ · __tests__/
├── common/                  # Shared code (may not import features/)
│   └── components/ composables/ store/ utils/ constants/ types/
├── utils/                   # App-wide pure functions (error, pagination, url, boolean)
├── plugins/                 # dompurify-html (HTML sanitization)
├── server/                  # BACKEND — secrets are safe here
│   ├── api/                 # quota.get, place/recommend.post, food/recommend.post,
│   │                        # malls/index.get, malls/[slug]/tenants.get, voucher/claim.post
│   └── utils/               # db, llm, llmParsing, foodCandidates, tenantFilters, voucherClaim
└── test/utils.ts            # Test helper (readSource)
```

**Server route naming rule (important for beginners):**
`recommend.post.ts` = only accepts HTTP POST. `index.get.ts` / `tenants.get.ts` = only accept HTTP GET.
Wrong method → Nuxt replies 405 automatically.

---

## 4. Setup & Installation

From zero to running on your laptop (5–10 minutes):

```bash
# 1. Enter the app folder
cd wikendo-web-app/app

# 2. Install dependencies (once, ~3 minutes)
pnpm install

# 3. Set up the environment
cp .env.example .env
# → then fill in the real values in .env (see Section 5)

# 4. Run the dev server
pnpm dev
# → open http://localhost:3000
```

**Try the main flows:**

1. `http://localhost:3000/` — landing, click 🗺️ or 🍜
2. `http://localhost:3000/quiz` — answer 5Q → redirect to `/result`
3. `http://localhost:3000/food` — answer 4Q → redirect to `/result-food`
4. `http://localhost:3000/mall/grand-indonesia` — directory (needs the Supabase DB populated)
5. `http://localhost:3000/food?mall=grand-indonesia` — Q1 mall is auto-skipped (pre-filled from the directory)

> Note: `/result`, `/result-food`, and `/mall/:slug` need Supabase + Hermes-combo running.
> Without them, the quiz pages still open, but generating recommendations will error (see Section 15).

---

## 5. Environment Variables

Copy `.env.example` → `.env`, fill in the real values. **The `.env` file must not be committed** (already in `.gitignore`).

| Variable                        | Example                   | Used in                             | Notes                                                                     |
| ------------------------------- | ------------------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| `NUXT_PUBLIC_SUPABASE_URL`      | `https://xxx.supabase.co` | Client + server                     | Supabase project URL. The `NUXT_PUBLIC_` prefix = readable by the browser |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxx…`                 | Client                              | Anon key (safe in the browser, restricted by RLS)                         |
| `SUPABASE_SERVICE_KEY`          | `eyJxxx…service_role`     | Server ONLY (`server/utils/db.ts`)  | Service-role key — **SECRET, never expose to the client**                 |
| `HERMES_API_URL`                | `http://127.0.0.1:20128`  | Server ONLY (`server/utils/llm.ts`) | Local 9Router endpoint; on Vercel use the prod URL                        |
| `HERMES_API_KEY`                | `sk-…`                    | Server ONLY                         | Hermes API key — **SECRET**                                               |
| `NUXT_PUBLIC_GA_ID`             | `G-XXXXXXX`               | Client                              | Google Analytics ID                                                       |

**How to read them in code (Nuxt runtimeConfig):**

```ts
// On the server (can access secrets):
const config = useRuntimeConfig();
config.hermesApiKey; // ✅ secret, server only
config.supabaseServiceKey; // ✅ secret, server only

// In the browser/client (public only):
config.public.supabaseUrl; // ✅ allowed
config.public.supabaseAnonKey;
```

The env → runtimeConfig mapping is defined in `nuxt.config.ts`.

---

## 6. Pages

All in `pages/`. **The file name = the URL automatically** (file-based routing, no manual router config).

### `pages/index.vue` → `/` (Landing, SSR)

Hero "Bingung Weekend Mau Kemana?" + **2 CTAs**: 🗺️ Cari Tempat (`/quiz`) and 🍜 Lagi di Mall (`/food`).
A static page, great for SSR + SEO.

### `pages/quiz.vue` → `/quiz` (Place Quiz — 5 questions, ~30 seconds)

- Concept: **1 screen, 1 question** + progress bar + Back button.
- Local state: `step` (question index), `answers` (reactive object), `q` & `progress` (computed).
- Questions: `mood` → `companion` → `budget` → `location` → `time`.
- On finish → `router.push({ path: '/result', query: { ...answers } })` — answers are sent via a **query string**.
- No fetch here — the quiz just collects answers in the browser.

### `pages/result.vue` → `/result` (Place Result)

```ts
const { data, pending, error } = await useFetch("/api/place/recommend", {
  method: "POST",
  body: route.query, // quiz answers from the URL
});
```

- 3 UI states: `pending` (loading ✨) → `error` (red box) → `data` (5 cards `#1–#5`: name, category, reason 💡, estimated cost, best time).
- The same principle is used by `result-food.vue`.

### `pages/food.vue` → `/food` (Food Quiz — 4 questions, ~20 seconds)

- Q1 `mall_slug` (required: the 5 V1 malls) → Q2 `mission` → Q3 `budget_tier` → Q4 `companion` + **Halal-only & Kids-friendly toggles**.
- **Pre-fill:** if opened from the directory (`/food?mall=grand-indonesia`), Q1 is auto-skipped:

```ts
const startStep =
  route.query.mall &&
  questions[0].options.some((o) => o.value === route.query.mall)
    ? 1
    : 0;
```

- On finish → redirect to `/result-food` with the answers + `halal_only` + `kids_friendly` in the query string.

### `pages/result-food.vue` → `/result-food` (Tenant Result)

- POST the answers to `/api/food/recommend`, render 5 tenant cards: badge `[#N]`, `[✅ Halal / ⚠️ Non-halal]`, `[🔥 Hype]`, reason 💡, **📍 Maps** button (Google Maps link + floor info).
- The "results are never mixed" principle: this page renders **only** tenants, no tourist spots.

### `pages/mall/[slug].vue` → `/mall/:slug` (Directory — no login/quota/LLM)

- `[slug].vue` = a **dynamic route**: 1 file serves `/mall/grand-indonesia`, `/mall/central-park`, etc. (`route.params.slug`).
- Fetch: `useFetch('/api/malls/${slug}/tenants')` + a client-side search box (`keyword` + a `filtered` computed).
- The gradient banner at the top points to `/food?mall=${slug}` (a bridge from directory → quiz).
- `TenantItem` is defined locally in this file (a compact shape for the list; the full shape lives in `TenantRecommendation`).

### `app.vue` (Global layout)

Header (logo + 🍜 Makan link + 🏬 Mall link) + `<NuxtPage />` (where each page renders) + footer.
Want to add a global navbar/footer? Edit this file, not each page.

---

## 7. Server API (Backend)

All in `server/`. **This code is never sent to the browser** — a safe place for secrets & quota.

### `server/utils/db.ts` — Supabase connection (admin)

```ts
export function supabaseAdmin() {
  // singleton: 1 client reused (saves connections)
  // uses config.public.supabaseUrl + config.supabaseServiceKey
}
```

Used by every endpoint that reads/writes the DB. The service key **bypasses RLS** — so input validation & quota must be done in the handler before the query.

### `server/utils/llm.ts` — LLM client (Hermes-combo)

| Function                                      | Input                                      | Output                                  |
| --------------------------------------------- | ------------------------------------------ | --------------------------------------- |
| `callLLM(system, user)`                       | 2 prompt strings                           | string (raw JSON from the LLM)          |
| `generatePlace(input: QuizPlaceInput)`        | place quiz answers                         | `PlaceRecommendation[]` (5 items)       |
| `rankTenants(input, candidates: TenantRow[])` | preferences + ≤30 candidates from Supabase | `RankResult[]` (5 items: name + reason) |

Cost-saving principle: **filter in Supabase first (free) → the LLM only ranks + writes 1 sentence of reasoning**.
The system prompt forces the LLM to reply with **valid JSON only** (no disclaimer) so it can be `JSON.parse`d directly.
Timeout 15 seconds, `max_tokens: 2000`, model `hermes-combo`.

### `POST /api/place/recommend` — Generate places

File: `server/api/place/recommend.post.ts`

1. Read the body + set up a `session_id` (30-day cookie).
2. Check the anonymous quota: cookie `quota_used === '1'` → 403 `LOGIN_REQUIRED`.
3. `generatePlace(body)` → save to the `generations` table (`quiz_input.type: 'place'`) → set `quota_used=1`.
4. Reply `{ recommendations, quota_remaining: 0 }`.

### `POST /api/food/recommend` — Generate tenants

File: `server/api/food/recommend.post.ts`

1. Read the body (`QuizFoodInput`) + check cookie `food_quota_used >= 2` → 403 `FOOD_QUOTA_EXCEEDED`.
2. Find `mall_id` from `mall_slug` → query `tenants` (`is_open=true` + filter by budget/halal/kids, limit 30).
3. Empty → 404 ("Tidak ada tenant cocok. Coba ubah filter.").
4. `rankTenants(body, candidates)` → merge tenant data + the LLM `reason` + `maps_url` Google Maps → save to `generations` (`type: 'food'`) → quota +1.
5. Reply `{ recommendations, quota_remaining }`.

### `GET /api/malls` — List malls

File: `server/api/malls/index.get.ts`. Returns all active malls (`is_active=true`, sorted by name). No login/quota/LLM.

### `GET /api/malls/:slug/tenants` — List tenants of 1 mall + filter

File: `server/api/malls/[slug]/tenants.get.ts`.
Query params: `?halal=true` `?budget=budget|mid|splurge` `?kids=true` `?search=kopi` `?mission=long_hangout`.
Column filters run in Supabase SQL; the `mission` filter (array) runs in memory after the fetch. No login/quota/LLM.

---

## 8. Types (Data Contracts)

File: `common/types/api.ts` (+ `common/types/quota.ts` etc.; UI types in `features/<x>/@types/`) — **the source of truth for data shapes**. If you add a field, change it here first, then in the feature/server that uses it.

| Interface              | Used in                                  | Contents                                                                                                      |
| ---------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `QuizPlaceInput`       | `quiz.vue` → `POST /api/place/recommend` | mood, companion, budget, location, time?                                                                      |
| `QuizFoodInput`        | `food.vue` → `POST /api/food/recommend`  | mall_slug, mission, budget_tier, companion, halal_only?, kids_friendly?                                       |
| `PlaceRecommendation`  | `result.vue`                             | name, category, reason, estimated_cost, location_area, best_time, confidence                                  |
| `TenantRecommendation` | `result-food.vue`                        | name, category, floor, halal, budget_tier, price_min, price_max, kids_friendly, hype_tiktok, reason, maps_url |
| `TenantRow`            | server food/malls                        | Raw shape of 1 `tenants` table row (+ mission?, mall_id?, is_open?)                                           |
| `RankResult`           | `rankTenants()`                          | name + reason (LLM ranking output)                                                                            |
| `LLMChatResponse`      | `callLLM()`                              | choices[0].message.content                                                                                    |

---

## 9. Styling (Tailwind)

- Provider: `@nuxtjs/tailwindcss` (registered in `modules` in `nuxt.config.ts`).
- Brand tokens in `tailwind.config.ts`: `primary` cyan `#0891b2`, `accent` orange `#f97316`.
- Patterns used: utility classes directly in the template (`bg-orange-500`, `rounded-2xl`, `max-w-2xl`), hero gradient (`bg-gradient-to-br from-cyan-600`), badge (`rounded-full`), card (`bg-white rounded-2xl shadow-sm border p-5`).
- For beginners: no need to write a CSS file — just combine utility classes. If you need a new color/size, add it to `tailwind.config.ts` first to stay consistent.

---

## 10. Lint, Format & Type-check

- **ESLint** (`eslint.config.mjs`): the `@nuxt/eslint` preset + **Prettier** + size limits (`complexity ≤ 10`, `max-lines-per-function ≤ 50`,
  `max-params ≤ 3`, `max-lines ≤ 500`, etc.) + module boundaries (cross-feature imports banned, client→`server/` banned) + security
  (`v-html`, `process.env` in the client, `console.log` banned).
- **Prettier** (`.prettierrc`): semicolons, double quotes, width 80. Don't argue about format — `pnpm lint:fix`.
- **Type-check**: `pnpm type-check` (`nuxt typecheck` / vue-tsc, TS strict).
- **Husky**: `pnpm install` installs the hooks automatically. A commit runs lint-staged → type-check → related tests;
  the commit message must follow _Conventional Commits_ (`feat(scope): ...`). No `--no-verify`.

```bash
pnpm lint         # ESLint (0 warnings) + prettier --check (used in CI)
pnpm lint:fix     # prettier --write + eslint --fix
pnpm type-check   # vue-tsc
```

---

## 11. NPM Commands

| Command              | Function                               | When to use                                                    |
| -------------------- | -------------------------------------- | -------------------------------------------------------------- |
| `pnpm install`       | Install dependencies                   | Once at the start / after any pull that changes `package.json` |
| `pnpm dev`           | Dev server + hot reload                | Daily work → `http://localhost:3000`                           |
| `pnpm build`         | Production build                       | Before deploy / to verify there are no errors                  |
| `pnpm preview`       | Run the local build                    | Check the `build` output exactly as on the server              |
| `pnpm generate`      | Static pre-render                      | If you need static output (rarely used in this MVP)            |
| `pnpm lint`          | ESLint + Prettier check                | Before commit (the hook runs it too)                           |
| `pnpm lint:fix`      | Auto-format + auto-fix lint            | When `lint` is red and the issues are auto-fixable             |
| `pnpm type-check`    | `nuxt typecheck` (vue-tsc)             | **Must exit 0** before you call it done                        |
| `pnpm test`          | Run all unit tests (Vitest)            | **Must be green** before you call it done                      |
| `pnpm test:related`  | Test only files that changed           | Used by the pre-commit hook                                    |
| `pnpm test:watch`    | Test watch mode (re-runs on each save) | When writing code + tests together                             |
| `npx nuxi --version` | Check the Nuxt version                 | Diagnostics (`nuxi` = the official Nuxt CLI)                   |

---

## 12. End-to-End Data Flow

**Plan mode (place):**

```text
[quiz.vue] answer 5Q (browser only)
   │  router.push /result?mood=..&companion=..&...
   ▼
[result.vue] useFetch POST /api/place/recommend (body = query)
   │  ┌─ check cookie quota_used → 403 if exhausted
   │  ├─ generatePlace() → callLLM(hermes-combo) → 5 places
   │  └─ INSERT generations {type:'place'} + set cookie
   ▼
render 5 place cards
```

**Mall mode (food):**

```text
[food.vue] answer 4Q + halal/kids toggles (browser only)
   │  router.push /result-food?mall_slug=..&mission=..&...
   ▼
[result-food.vue] useFetch POST /api/food/recommend
   │  ┌─ check cookie food_quota_used → 403 if exhausted
   │  ├─ Supabase: mall_slug → mall_id → filter tenants (FREE, limit 30)
   │  ├─ rankTenants() → callLLM rank Top 5 + reason
   │  └─ merge tenant data + maps_url → INSERT generations {type:'food'}
   ▼
render 5 tenant cards + Maps button
```

**Directory (no LLM):**

```text
[mall/[slug].vue] → GET /api/malls/:slug/tenants?halal&budget&...
   └─ Supabase directly → tenant list → client-side search
```

---

## 13. Quota & Limits

| Rule                   | Current implementation                         | Production target (see `docs/04-Database-Schema.md`)    |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| Place 2x/day           | Cookie `quota_used` (anonymous 1x → login)     | `user_quota` table, reset 00:00 WIB, enforced in the DB |
| Food 5x/day (separate) | Cookie `food_quota_used` (max 2 for anonymous) | `mall_search_quota` table, reset 00:00 WIB              |
| Results never mixed    | Fully separate pages & endpoints               | Same — the contract doesn't change                      |
| LLM timeout            | 15 seconds (`server/utils/llm.ts`)             | Same                                                    |

> Cookies = a temporary solution for the MVP. Before launch, move to DB quota so it can't be bypassed by deleting cookies.

---

## 14. Deploying to Vercel

1. Push this folder to GitHub (or set root directory = `app/` if it's a monorepo).
2. In Vercel: **New Project → import repo → Framework: Nuxt.js** (auto-detect).
3. Fill in the **Environment Variables** (see Section 5 — PROD values, not local).
4. Deploy. Every push to `main` = an automatic deploy + a preview URL per PR.
5. Check: `/` → `/quiz` → `/result`, `/food` → `/result-food`, `/mall/grand-indonesia`.

---

## 15. Troubleshooting (Common Issues)

| Symptom                                                 | Most likely cause                                                                                         | How to check / fix                                                           |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `pnpm dev` errors with `ECONNREFUSED` / result page 500 | Wrong `HERMES_API_URL` / 9Router not running                                                              | `curl http://127.0.0.1:20128/v1/models` — it should return JSON, not refused |
| Result 403 `LOGIN_REQUIRED` / `FOOD_QUOTA_EXCEEDED`     | Quota cookie exhausted (normal, not a bug)                                                                | Open incognito / delete the cookie / log in for more allowance               |
| Directory `/mall/...` is empty                          | The `malls`/`tenants` tables in Supabase haven't been seeded                                              | Import `data/tenants-seed.csv` (200 rows) into Supabase                      |
| `useFetch` 404 at `/mall/:slug`                         | Wrong slug (check: `grand-indonesia`, `central-park`, `kota-kasablanka`, `pondok-indah-mall`, `aeon-bsd`) | Match it with the `slug` column in the `malls` table                         |
| `pnpm lint` red `no-explicit-any`                       | There's an `any` type in new code                                                                         | Replace it with an interface from `types/index.ts`                           |
| Build passes but the page is blank                      | `NUXT_PUBLIC_*` not filled in `.env` / Vercel env                                                         | Check `runtimeConfig.public` in `nuxt.config.ts` against the env you have    |
| `nuxt prepare` / TS errors after a pull                 | Stale `node_modules`                                                                                      | `rm -rf node_modules .nuxt && pnpm install`                                  |

---

## 16. FAQ

**Q: Where is the Nuxt project?**
A: In `wikendo-web-app/app/`. The repo root (`docs/`, `data/`, `design/`) is intentionally outside so docs, seed CSVs, and the prototype don't get mixed with code.

**Q: Why no separate backend (e.g. Express/FastAPI)?**
A: A deliberate decision (ADR): Supabase is already the backend (DB+Auth), and the Nuxt server is just a thin layer (secrets, quota, LLM). Building our own backend repo = +8–12 hours with no user value. We'd only split on a trigger: a 2nd non-web client, >10k req/day, or a team >3 people.

**Q: Why are the place quiz and food quiz separate?**
A: Different moments of need (planning at home vs hungry at the mall), different quotas, and the results must never be mixed (owner's decision, Addendum v1.1 LOCKED). One mixed quiz causes confusion + the decision fatigue comes right back.

**Q: What is the LLM used for? How do we keep it cheap?**
A: Only 2 things: generating 5 places + ranking 5 tenants. The candidate list always comes from Supabase first (free); the LLM never browses/lists from scratch.

**Q: I want to add a 6th mall — what are the steps?**
A: (1) Add a row to the `malls` table; (2) add tenants to `tenants-seed.csv` + import; (3) add 1 option to `questions[0]` in `pages/food.vue`; (4) add 1 entry to `mallName` in `pages/mall/[slug].vue`. No new endpoint needed.

**Q: I want to add a new page?**
A: Create 1 file at `pages/nama.vue` → it automatically becomes the route `/nama`. If it's dynamic: `pages/x/[id].vue` → `/x/apapun`.

**Q: I want to add a new API endpoint?**
A: Create a file in `server/api/...` following the naming pattern (`*.get.ts` / `*.post.ts`), use `supabaseAdmin()` from `server/utils/db.ts` for the DB and `defineEventHandler` + `createError` for the handler.

---

_Last verified: Nuxt 4.6.0 · ESLint 10 · pnpm 9.15.4 · `pnpm lint` clean · `pnpm build` EXIT:0. If something doesn't match the code, the code wins — then update this document._
