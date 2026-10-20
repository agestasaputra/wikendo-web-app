# AGENTS.md — Wikendo

> Single source of truth for every AI agent (Claude, Cursor, Copilot, Windsurf, Hermes).
> Edit ONLY this file. The other agent config files (`CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`) just point here.
> Language: English, direct instructions. UI copy stays Indonesian (see [Language policy](#language-policy)).

---

## Before you start

1. **Load context.** Read [`docs/architecture/architecture.md`](docs/architecture/architecture.md), then 1 spoke at `docs/architecture/flows/<topic>/README.md` that covers the area you are changing.
2. **Green baseline.** Run `pnpm lint && pnpm type-check && pnpm test` (in `app/`) before touching any file. If it is already red, stop and report — don't fix unrelated things.
3. **Scope check.** Make sure the task stays within 1 feature slice. Cross-feature → go through `common/`. If the task bleeds across features, flag it before continuing.

---

## Definition of done

- [ ] `pnpm lint` exit 0 (ESLint 0 warnings + `prettier --check`)
- [ ] `pnpm type-check` exit 0
- [ ] `pnpm test` green (at minimum `pnpm test path/to/x.spec.ts` for the changed code)
- [ ] `pnpm build` exit 0 before a PR
- [ ] Every new pure function / composable / store / util has a sibling `__tests__/<name>.spec.ts` (TDD: watch it go RED first)
- [ ] Flow/store/composable/endpoint changed → the spoke in `docs/architecture/flows/` is updated, `status: ready`
- [ ] No `console.log`, `v-html`, `any`, or secrets in code/logs
- [ ] No cross-feature imports, and no `server/` imports from browser code
- [ ] Security review (OWASP) done — see the Security section

---

## Language policy

| Area | Language |
| ---- | -------- |
| UI copy (labels, buttons, toasts, error/API messages shown to users, quiz option labels, LLM prompts that shape user-facing text) | **Indonesian** — do not translate |
| Code comments, file headers, JSDoc, docs (`docs/`, READMEs, this file), commit messages, test names | **English** |
| Domain data values (enums stored in DB / sent over the API, e.g. `budget`/`mid`/`splurge`, `quick_bite`, `south-jakarta`, tenant `category`) | **English** |
| Proper names (malls, tenants, places), Rupiah formats (`Rp 30-80rb`) | As-is |

Identifiers (tables, columns, API/JSON fields, RLS policy names, cookie/storage keys) are English too. The former `lantai` column is now `floor` and the "makan quota" policies are now "food quota" (`supabase/migration-v16-english-identifiers.sql`). Prices are stored as integer rupiah (`price_min`/`price_max`, `supabase/migration-v17-price-columns.sql`); display text like "Rp 30-80rb" is built in the UI by `utils/price.ts`.

Stored old values are migrated by `supabase/migration-v15-english-values.sql` (mood, companion, budget, location, time, mission, tenant category + the `budget_tier` CHECK).

---

## Project overview

Nuxt 4 SSR app: quiz → Jabodetabek weekend recommendations. Stack: Vue 3 Composition API · TypeScript strict · Pinia (setup syntax) · Tailwind · Supabase · Vitest · ESLint 10 + Prettier. Deploy: Vercel (root directory = `app/`). Code lives in `app/`; the repo root also holds `docs/`, `design/`, `data/`, `supabase/` — **do not put Nuxt code there**.

**2 modes, FULLY SEPARATED (results are never mixed):**

| Mode (UI label) | Feature slice | Route | API | Anon quota (cookie) | Production target |
| --------------- | ------------- | ----- | --- | ------------------- | ----------------- |
| 🗺️ Place (Tempat) | `features/place` | `/place` → `/result-place` | `POST /api/place/recommend` | 1x/day | 2x/day logged in (`user_quota`) |
| 🍜 Food (Makan) | `features/food` | `/food` → `/result-food` | `POST /api/food/recommend` | 2x/day | 5x/day logged in (`mall_search_quota`) |
| 🏬 Directory | `features/mall` | `/mall`, `/mall/:slug` | `GET /api/malls`, `GET /api/malls/:slug/tenants` | no quota/login/LLM | same |

### Feature catalog

| Feature | Folder | Notes |
| ------- | ------ | ----- |
| Home | `features/home/` | Honest quota wallet + CTA + mall entrypoint |
| Place | `features/place/` | 5-question quiz + result (LLM) |
| Food | `features/food/` | 4-question quiz + tenant result + voucher gift/sheet |
| Mall | `features/mall/` | Directory + infinite scroll + filter + promo strip |
| Auth | `features/auth/` | Login, register, check-email, Google OAuth single entry |
| Account | `features/account/` | 2-state Account hub |
| History | `features/history/` | localStorage history |

### Runtime & environment

- Public env → `useRuntimeConfig().public.*`; secrets → `useRuntimeConfig()` in `server/` only. **Do not** read `process.env` in client code (lint error).
- Env: `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` (secret), `HERMES_API_URL`, `HERMES_API_KEY` (secret), `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (secret), `NUXT_PUBLIC_GA_ID`. Example: `app/.env.example`. Mapping in `app/nuxt.config.ts`.
- CI/CD: `.github/workflows/ci.yml` — security (gitleaks + audit) + verify (lint → type-check → test → build).

---

## Safe commands

> Run from `app/`. First time: `pnpm install` (installs Husky automatically via `prepare`).

```bash
pnpm dev               # http://localhost:3000
pnpm lint              # ESLint (0 warnings) + prettier --check — MUST exit 0
pnpm lint:fix          # prettier --write + eslint --fix
pnpm type-check        # nuxt typecheck (vue-tsc) — MUST exit 0
pnpm test              # vitest run (all)
pnpm test path/to/x.spec.ts   # 1 file
pnpm test:related      # only tests related to changed files
pnpm build             # production check — MUST exit 0 before a PR
```

---

## Pre-commit gate

Husky (`app/.husky/pre-commit`) runs 3 checks in order and stops at the first failure:

1. `pnpm lint-staged` — `eslint --fix` + `prettier --write` for staged files.
2. `pnpm type-check` — `vue-tsc` across the WHOLE project.
3. `vitest related --run` — only tests related to staged files.

`commit-msg` enforces **Conventional Commits**: `type(scope): subject` (types: feat fix docs design refactor test chore perf style ci build revert).

**DO NOT use `--no-verify` (or `-n`).** A failing hook = fix the root cause, then make a new commit (don't amend). CI runs the same gate.

---

## Naming conventions

| Artifact | Pattern | Example |
| -------- | ------- | ------- |
| Feature page | `PascalCase + Page.vue` at the feature root | `PlaceQuizPage.vue`, `MallListPage.vue` |
| Nuxt route | kebab-case, **thin** (renders 1 `XPage`) | `pages/result-food.vue` |
| Component | `PascalCase.vue` | `TenantCard.vue`, `AppSpinner.vue` |
| Composable (file + function) | `use` + PascalCase → `useCamelCase.ts` | `useInfiniteList.ts` → `useInfiniteList()` |
| Pinia store | file `XStore.ts`, function `useXStore()` | `AuthStore.ts` → `useAuthStore()` |
| Type / interface | PascalCase in `@types/` (feature) / `common/types/` | `TenantRow`, `QuotaStatus` |
| Constant | `SCREAMING_SNAKE_CASE` | `MALL_NAMES`, `HISTORY_MAX_ENTRIES` |
| Util (pure) | camelCase in `utils/` | `buildQuotaStatus()` |
| Server route | `name.method.ts` | `quota.get.ts`, `recommend.post.ts` |
| Test | `{name}.spec.ts` in a sibling `__tests__/` | `utils/__tests__/pagination.spec.ts` |
| API / DB JSON field | `snake_case` | `claim_code`, `mall_slug` |

---

## Code style & size limits

- **Prettier** (`app/.prettierrc`): `semi: true`, double quotes, `printWidth: 80`. Don't debate formatting — `pnpm lint:fix`.
- **Size limits (ESLint = error, same as hub-chat):** `complexity ≤ 10`, `max-depth ≤ 3`, `max-lines-per-function ≤ 50`, `max-params ≤ 3` (more → options object), `max-lines ≤ 500` per file, `max-classes-per-file 1`, `no-param-reassign`.
- **TypeScript strict**: `any` is forbidden (use `unknown` + narrowing), explicit return types for functions (`explicit-function-return-type`). `catch`/`useFetch` errors: `getErrorMessage()` / `getErrorStatus()` in `utils/error.ts`.
- **Vue**: `<script setup lang="ts">` only; block order `script → template → style`; macros `defineProps → defineEmits → defineSlots`.
- Tests may relax the size limits (long `describe`/fixtures). Otherwise **do not** add `eslint-disable` — split the function.
- **File header comment**: WHAT + WHY + EXAMPLE, short (3–5 lines), in English. Inline comments explain _why_, not _what_. Pure functions: 1-line JSDoc.

---

## Architecture

### Layers

| Layer | Folder | Responsibility | Hard constraint |
| ----- | ------ | -------------- | --------------- |
| Pages | `pages/` | Nuxt file-based routes | No business logic; render `features/<f>/XPage.vue` |
| Feature slice | `features/<f>/` | Vertical slice: `XPage.vue`, `components/`, `utils/`, `constants/`, `@types/`, `store/`, `__tests__/` | Must not import another slice (ESLint error) |
| Common | `common/` | Shared components, composables, store, utils, constants, types | Must not import `features/` |
| Utils | `utils/` | App-wide pure functions (error, pagination, url, boolean) | No side effects, no store |
| Server | `server/` | API + Supabase admin + LLM | Secrets only here |
| Plugins | `plugins/` | Boot wiring (`v-dompurify-html`) | No component state |

### Cross-feature communication

Features must not import each other. Use: `common/store/` (shared state), `common/components/` (shared UI), `common/utils/` (shared logic). The server may import `common/` and `utils/` through **relative** paths (`~/` doesn't always resolve in Nitro).

### API & data

| Context | Use |
| ------- | --- |
| GET data rendered by SSR | `useFetch<T>(url)` |
| Actions (POST claim, etc.) | `$fetch` inside a store/composable (e.g. `VoucherStore`) |
| Auth from the browser | `useSupabaseBrowser()` (anon key) |
| DB access on the server | `supabaseAdmin()` from `server/utils/db.ts` (service key) |
| Calling the LLM | `server/utils/llm.ts` — candidates from the DB first, the LLM only ranks |

### State management

Pinia setup store for state shared across files/features; local `ref` for 1 page; quiz = local state + query string. Details: `docs/architecture/flows/cross-cutting/state-management/README.md`. Always `storeToRefs()` when destructuring state.

### Docs hub

- Hub: `docs/architecture/architecture.md` · Terms: `GLOSSARY.md` · Format rules: `CONVENTIONS.md`
- Spokes: `docs/architecture/flows/<topic>/README.md` (home, quiz-place, quiz-food, mall-directory, auth, quota, voucher-claim, history, layout-navigation, llm, cross-cutting/\*)

---

## Doc updates are part of the task

Three questions before you finish:

1. **Did a flow change?** → update the related spoke + set `status: ready`.
2. **Did you add/rename something that is documented?** → extend/create a spoke; add the term to GLOSSARY **first**.
3. **Cosmetic only (rename/format)?** → no update needed.

| What changed | Action |
| ------------ | ------ |
| New endpoint / API contract changed | Update the spoke `code:` + sequence diagram |
| New shared store / composable / util | Extend `state-management` / `shared-ui`; term to GLOSSARY |
| Quota / wall change | `quota` |
| Voucher claim | `voucher-claim` |
| Lint / hook / CI rule | `testing-ci` + `security` |

Set `status: stale` if the code changed but you didn't get to update the docs. Integrity check: `python3 ~/.claude/skills/repo-docs/verify.py` from the repo root (if the skill is available).

---

## Testing

- Runner: **Vitest** + happy-dom. Config `app/vitest.config.ts` (`**/*.spec.ts`, alias `~` = `app/`).
- Co-locate: `__tests__/<file>.spec.ts` sibling to the source. No central test folder.
- Unit-tested modules import `vue`/`pinia` **explicitly** (no auto-import). Mock Supabase at the `useSupabaseBrowser` level with `vi.hoisted` + `vi.mock`; `$fetch` with `vi.stubGlobal`.
- **File-assert** tests (read `.vue`/`.ts` as text, `test/utils.ts → readSource`) lock down copy & UI tokens. `readSource` normalizes lowercase hex + whitespace (Prettier-proof). After a page is split, 1 assert may read several files.
- API routes don't have integration tests yet (they need a Nitro/Supabase mock) — don't claim full coverage. If you add some: mock at the `callLLM` level, not real HTTP.
- TDD: RED test → minimal GREEN code → refactor. One behavior per test.

---

## Things to watch out for

- ❌ Don't mix place recommendations + tenants in 1 page / 1 API response.
- ❌ Don't create a separate backend (Express etc.) — Nuxt + Supabase monolith (ADR `docs/02-ADR.md`).
- ❌ Don't turn the cookie quota into a DB quota without a `user_quota`/`mall_search_quota` migration (`docs/04-Database-Schema.md`).
- ❌ Don't rename mall slugs (`grand-indonesia`, `central-park`, `kota-kasablanka`, `pondok-indah-mall`, `aeon-bsd`) without updating `MALL_NAMES`, food quiz Q1, and the `malls` table together.
- ❌ Don't commit `.env` (only `.env.example`) and don't expose `SUPABASE_SERVICE_KEY` to the client.
- `halal` / `kids_friendly` / `hype_tiktok` are **tri-state** (NULL = not researched yet). Filter with `.eq(true)`; the UI shows ❓. Don't overclaim.
- `coerceBool`: the frontend sends `halal_only: "false"` (a string) via query — don't use truthiness.
- `?mall=` on `/food` only skips Q1 when the slug is valid (`FOOD_MALL_SLUGS`).
- Server routes use **relative imports** for files outside `server/`.
- Buttons that call an API MUST have a spinner + `:disabled` + an early-return guard (anti double-submit).
- Templates (`.vue`) in new folders outside the Nuxt defaults (`components`, `layouts`, `pages`, `plugins`, `composables`, `utils`) **MUST be registered** in `app/tailwind.config.ts → content`, otherwise Tailwind drops their classes (unstyled design). Guard test: `common/__tests__/tailwindContent.spec.ts`.
- Vercel prod can't reach `localhost:20128`: it needs `CLOUDFLARE_*` for the LLM to work.

---

## Security

Before marking a task done:

1. Check every changed file against the OWASP Top 10 (2021).
2. `v-html` is forbidden (`vue/no-v-html` = error). Need dynamic HTML → `v-dompurify-html` (`plugins/dompurify-html.ts`).
3. Tokens/secrets must not be logged or end up in error messages; secrets live only in `server/`.
4. External input is validated at the boundary (`parseVoucherCode`, `parsePaginationParams`, `coerceBool`, LLM result validation).
5. Report format: `No confirmed vulnerabilities found` OR findings → OWASP category + `file:line`.

Full controls + Known Debt: `docs/architecture/flows/cross-cutting/security/README.md`.

---

## How to add a feature

1. Check the shared code in `common/` and `utils/` first.
2. Create `features/<name>/` with `@types/`, `components/`, `utils/`, `constants/`, (`store/` if state is shared).
3. Create `features/<name>/<Name>Page.vue` (`<script setup lang="ts">`).
4. Create a thin `pages/<route>.vue`: import & render `<NamePage />` only.
5. New endpoint: `server/api/<x>.<method>.ts` — `defineEventHandler` + input validation + `supabaseAdmin()` + `createError`. Heavy logic → `server/utils/` (≤50 lines/function).
6. Write the test first (RED): `features/<name>/utils/__tests__/*.spec.ts`.
7. Types first: API contract in `common/types/api.ts`, UI types in `features/<name>/@types/`.
8. Update docs: new/extended spoke + GLOSSARY term.
9. `pnpm lint && pnpm type-check && pnpm test && pnpm build`.

**6th mall:** (1) a row in the `malls` table; (2) tenants into `data/tenants-seed.csv` + import; (3) 1 Q1 option in `features/food/constants/questions.ts`; (4) 1 entry in `MALL_NAMES` + `MALL_SHORT_LABELS` in `common/constants/malls.ts`. No new endpoint.

---

## Key file locations

| Purpose | Path |
| ------- | ---- |
| Nuxt config | `app/nuxt.config.ts` |
| Lint / format / tsconfig | `app/eslint.config.mjs`, `app/.prettierrc`, `app/tsconfig.json` |
| Git hooks | `app/.husky/` |
| CI | `.github/workflows/ci.yml` |
| API contract (types) | `app/common/types/api.ts` |
| Quota logic | `app/common/utils/quota.ts` |
| Auth store | `app/common/store/AuthStore.ts` |
| Server DB admin | `app/server/utils/db.ts` |
| LLM | `app/server/utils/llm.ts`, `llmParsing.ts` |
| Voucher claim | `app/server/utils/voucherClaim.ts` |
| Test helper | `app/test/utils.ts` |
| Env scaffold | `app/.env.example` |

---

## Quick troubleshooting

| Symptom | Check |
| ------- | ----- |
| Result 500 | LLM env present? Dev: `curl http://127.0.0.1:20128/v1/models`; prod: `CLOUDFLARE_*` |
| Result 403 `LOGIN_REQUIRED` / `FOOD_QUOTA_EXCEEDED` | Normal (quota used up) — incognito / clear cookies |
| `/mall/:slug` empty / 404 | `malls`/`tenants` tables not seeded (`data/tenants-seed.csv`); the slug must be one of the 5 |
| `pnpm lint` import failure | See the `no-restricted-imports` message (cross-feature / client→server) |
| Blank page after build | `NUXT_PUBLIC_*` not set in `.env` / Vercel env |
| Commit hook fails | Read its output; fix it (don't `--no-verify`) |

Human README (long setup): `app/README.md`. If code and docs disagree, **the code wins** — then update this document + the related spoke.

---

## Known debt

- `pnpm audit --prod` reports transitive findings (Nuxt devtools / tailwind-config-viewer); not blocking CI yet.
- Login quota (2+5) exists in `buildQuotaStatus` but the server always takes the anon path.
- A few `as` casts remain; replace them with types in `common/types` when you touch the file.
- API route & page tests are still file-assert (components are not mounted yet).
