# MVP Feature Checklist - Weekend Planner

**Version:** 1.2 (Oct 7, 2026 — Addendum 09 v1.3 patch: progressive auth + voucher + split quota)
**Date:** October 6, 2026 (original) + Oct 7, 2026 patch
**Status:** In Development — Phase 8.1 ✅ done, 8.2/8.3 code-complete (not E2E yet), Phases 1–3 partial, Phases 4–7 not started; v1.3 scope (progressive auth + voucher + 2-state wallet) LOCKED, TDD execution next
**Owner:** Agesta (Solo Founder)

> **Oct 6, 2026 sync:** this checklist had fallen behind the code (8.1 done but unrecorded, 8.2/8.3 code existed but not checked off).
> Starting v1.1, this file + `docs/08-PROGRESS.md` are the single source of status. Every dev session must update both.

---

## Overview

This checklist breaks down Weekend Planner MVP into actionable tasks with priority levels and time estimates. Use this as your development roadmap.

**Priority Levels:**
- **P0:** Must-have for launch (blocking)
- **P1:** Should-have (important but can defer)
- **P2:** Nice-to-have (post-launch)

**Time Estimates:** Based on solo dev with AI assistance

---

## Phase 1: Project Setup & Foundation

**Goal:** Initialize project, configure tools, set up infrastructure

### 1.1 Project Initialization
- [ ] **P0** Create GitHub repository + push + GitHub Projects board - *15 min* ⏳ NEXT (local git initialized Oct 6, not pushed yet)
- [x] **P0** Initialize Nuxt project (`app/`, Nuxt 4.5.2 + Vue 3 + TS) - *10 min* ✅ DONE Oct 6, 2026 (upgrade 3.17→4.5.2, build green)
- [x] **P0** Install dependencies: TypeScript, Tailwind CSS, ESLint - *20 min* ✅ DONE (Prettier NOT used — decision: ESLint only, keep it to 1 tool)
- [x] **P0** Configure `nuxt.config.ts` (modules, runtimeConfig hermesApiUrl/Key, supabaseUrl/anonKey) - *15 min* ✅ DONE
- [x] **P0** Set up directory structure: `pages/`, `server/`, `types/`, `utils/` - *10 min* ✅ PARTIALLY DONE (`components/`, `composables/`, `layouts/` NOT there yet — created when needed, not upfront)
- [x] **P0** Create `.env.example` file with all required env vars - *10 min* ✅ DONE (`app/.env.example`)

**Subtotal:** ~1.5 hours

---

### 1.2 Supabase Setup
- [ ] **P0** Create Supabase project - *5 min*
- [ ] **P0** Run database schema SQL (from `04-Database-Schema.md`) - *15 min*
- [ ] **P0** Enable Row-Level Security policies - *10 min*
- [ ] **P0** Create database functions (initialize_new_user, check_quota, etc.) - *20 min*
- [ ] **P0** Configure Google OAuth in Supabase Auth settings - *10 min*
- [ ] **P0** Test database connection from local - *10 min*
- [ ] **P0** Schedule pg_cron job for daily quota reset - *10 min*

**Subtotal:** ~1.5 hours

---

### 1.3 Hermes-combo / 9router Integration
- [x] **P0** Verify 9router API endpoint is accessible - *5 min* ✅ DONE (config `hermesApiUrl` + key in runtimeConfig)
- [ ] **P0** Test LLM generation with sample prompt (live call) - *15 min* ⏳ NOT YET (code done, real API not hit yet)
- [x] **P0** Create LLM client utility (`server/utils/llm.ts`) - *30 min* ✅ DONE (`callLLM` + `generatePlace` + `rankTenants`, 15s timeout, JSON-only prompt)
- [x] **P0** Create system prompt template - *20 min* ✅ DONE (`PLACE_SYSTEM` + `FOOD_SYSTEM` in `llm.ts`)
- [ ] **P0** Test full quiz → LLM → parse JSON flow - *20 min* ⏳ NOT YET (waiting for seed to be run into Supabase → merged into 8.4)

**Subtotal:** ~1.5 hours

---

### 1.4 Deployment Setup
- [ ] **P0** Connect GitHub repo to Vercel - *5 min*
- [ ] **P0** Configure Vercel environment variables - *10 min*
- [ ] **P0** Set up staging environment (separate branch) - *10 min*
- [ ] **P0** Test auto-deploy on push - *5 min*
- [ ] **P1** Set up custom domain (optional) - *30 min*

**Subtotal:** ~1 hour

---

**Phase 1 Total:** ~5.5 hours

---

## Phase 2: Core Features - Backend API

**Goal:** Build all server routes and business logic

### 2.1 Authentication Endpoints (Addendum 09 v1.3 patch — progressive, phone optional, Google 1-tap primary)
- [ ] **P0** `POST /api/auth/register` - Email/password signup - *1 hour*
  - Validate email + password REQUIRED; phone OPTIONAL (+62 ONLY if filled in, NULL = valid)
  - Call Supabase Auth signup
  - Initialize user profile (phone NULL if skipped) + place quota 2 + food quota 5 for today via `initialize_new_user`
  - Set session cookie
  - Error handling (duplicate email, weak password)

- [ ] **P0** `POST /api/auth/login` - Email/password login - *45 min*
  - Validate credentials
  - Call Supabase Auth login
  - Set session cookie
  - Error handling (invalid credentials)

- [ ] **P0** `POST /api/auth/logout` - End session - *15 min*
  - Clear session cookie
  - Call Supabase signOut

- [ ] **P0** `GET /api/auth/callback` - OAuth callback handler - *45 min*
  - Handle Google OAuth redirect (primary, 1-tap, zero friction)
  - Profile auto-created phone=NULL via trigger — WITHOUT a "Masukkan nomor HP" modal (removed in v1.3)
  - Initialize place quota 2 + food quota 5 for today

- [ ] **P0** Auth middleware (`server/middleware/auth.ts`) - *30 min*
  - Extract JWT from cookie
  - Verify with Supabase
  - Attach user to request context

- [ ] **P0** Login wall 4 moments + 2-state wallet (NEW v1.3) - *1.5 hours*
  - Generate 2nd place / 3rd food → 403 `LOGIN_REQUIRED` + copy "Login 10 detik → quota reset tiap hari, gratis"
  - Tap Simpan/Klaim voucher (anonymous) → login bottom sheet
  - Open Wishlist/Riwayat (anonymous) → login prompt
  - Voucher claim REQUIRES login (`POST /api/voucher/claim` anonymous → 401): check active promo → check `voucher_claims` (user_id, tenant_id, today) → code `WKD-XXXXXX` → double-claim 409
  - Home wallet: anonymous "🎁 1 tempat • 1 makan free" vs registered countdown 00.00
  - Analytics: `login_prompted{reason}` 5 values + `anon_quota_exhausted{type}` + `voucher_claimed`

**Subtotal:** ~5 hours (was ~3.5)

---

### 2.2 Quota System (Addendum 09 v1.3 patch — split place 2 + food 5, dual cookies)
- [ ] **P0** `GET /api/quota` - Check SPLIT quota status - *45 min*
  - Anonymous: dual cookies (`quota_used` place 1x + `food_quota_used` food 2x) + `login_cta`
  - Registered: `user_quota` (place 2) + `mall_search_quota` today (food 5, SEPARATE, never consumes place quota)
  - Calculate hours until reset 00:00 WIB
  - Return `{place:{used,limit,remaining}, food:{...}, is_logged_in, reset_at, login_cta?}`

- [ ] **P0** Quota check utility (`server/utils/quota.ts`) - *1.5 hours*
  - `checkQuota(userId, sessionId)` + `checkMakanQuota(userId)`, kept separate
  - Handle anonymous vs registered logic
  - Auto-reset if >24h since last reset
  - Return {allowed, remaining, resetAt, reason} + 403 `LOGIN_REQUIRED` at the wall moment (generate 2nd place / 3rd food)
  - LLM fail → quota NOT deducted

- [ ] **P0** Increment quota utility - *30 min*
  - For registered: call `check_and_increment_quota()` DB function (place) + insert `mall_search_quota` (food)
  - For anonymous: set cookie (`quota_used` / `food_quota_used`)
  - Clear-storage abuse accepted at soft launch (growth > strict; fingerprint/IP if there's a spike)

**Subtotal:** ~2.5 hours

---

### 2.3 Generation Endpoint
- [~] **P0** `POST /api/place/recommend` + `POST /api/food/recommend` (replaces `/api/generate` split version, Addendum 07) - *2.5 hours* ✅ CODE-COMPLETE Oct 6, 2026 (check quota → filter/call LLM → save `generations`; not live-tested yet → merged into 8.4)
  - Validate quiz input with Zod
  - Check quota (fail early if exhausted)
  - Generate session_id for anonymous
  - Call LLM API with timeout (15s)
  - Parse JSON response
  - Validate 5 recommendations returned
  - Save to `generations` table
  - Increment quota
  - Log analytics event
  - Error handling (LLM timeout, parse failure, quota exceeded)

- [~] **P0** LLM generation utility improvements - *1 hour* ⏳ PARTIAL (15s timeout + JSON-only prompt ✅; 1x retry + token counting + cost tracking ⏳ NOT YET)
  - Retry logic (1 retry on timeout)
  - Better error messages
  - Token counting estimation
  - Cost tracking

**Subtotal:** ~3.5 hours

---

### 2.4 History & Favorites (Addendum 09 v1.3 patch — anonymous LOCKED, split place|food)
- [ ] **P1** `GET /api/history` - Fetch generation history - *1 hour*
  - Require auth (anonymous open → login prompt, wall moment #3)
  - Paginated results (limit, offset)
  - Return quiz_input + recommendations + created_at + `type: 'place'|'food'` (tab split, never mixed)

- [ ] **P1** `POST /api/favorites` - Save favorite - *1 hour*
  - Require auth (anonymous tap Simpan → login bottom sheet, wall moment #2)
  - Validate generation_id and index
  - Insert into favorites table
  - Handle duplicate (409 Conflict)

- [ ] **P1** `GET /api/favorites` - Fetch favorites (Wishlist) - *45 min*
  - Require auth (anonymous open → login prompt, wall moment #3)
  - Paginated results
  - Return recommendation data + notes

- [ ] **P1** `DELETE /api/favorites/:id` - Remove favorite - *30 min*

**Subtotal:** ~3 hours

---

### 2.5 Utility Endpoints
- [ ] **P0** `GET /api/health` - Health check - *15 min* ⏳ NOT YET (file doesn't exist yet)
  - Check database connection
  - Check LLM endpoint
  - Return service status

- [ ] **P0** Rate limiting middleware - *45 min*
  - Install `rate-limiter-flexible`
  - 60 req/min per IP
  - Return 429 on limit

**Subtotal:** ~1 hour

---

**Phase 2 Total:** ~15 hours (was ~13.5 + v1.3 login wall 1.5h)

---

## Phase 3: Core Features - Frontend UI

**Goal:** Build all user-facing pages and components

### 3.1 Design System & Components
- [x] **P0** Tailwind config (colors, fonts, breakpoints) - *30 min* ✅ DONE (`app/tailwind.config.ts` + `@nuxtjs/tailwindcss`)
- [ ] **P0** Create base components - *2 hours* ⏳ NOT YET (`app/components/` doesn't exist yet — UI currently inline in pages)
  - Button (primary, secondary, ghost variants)
  - Input (text, password, with validation states)
  - Card
  - Modal/Dialog
  - Loading spinner
  - Toast notification

- [ ] **P0** Create layout component (`layouts/default.vue`) - *45 min* ⏳ NOT YET (`app/layouts/` doesn't exist yet)
  - Navbar (logo, login/register, user menu)
  - Footer (links, copyright)
  - Mobile responsive

**Subtotal:** ~3 hours

---

### 3.2 Landing Page
- [x] **P0** `pages/index.vue` - Landing page - *2 hours* ✅ CODE-COMPLETE (hero + dual CTA 🗺️/quiz + 🍜/food; value-prop/how-it-works/SEO ⏳ to follow)
  - Hero section with headline + CTA
  - Value proposition (3 benefits)
  - How it works (3 steps)
  - Social proof section (optional)
  - Footer
  - Mobile responsive
  - SEO meta tags

**Subtotal:** ~2 hours

---

### 3.3 Quiz Flow
- [x] **P0** `pages/quiz.vue` - Quiz page - *3 hours* ✅ CODE-COMPLETE Oct 6 (5Q place, 1 question per screen + progress + Kembali; localStorage resume ⏳ NOT YET — built during 8.4)
  - Multi-step form (1 question per screen)
  - Progress indicator
  - Question components:
    - Mood selector (radio buttons with icons)
    - Companion selector
    - Budget selector
    - Location selector (with conditional text input)
    - Time selector (optional)
    - Child age (conditional)
  - Form validation
  - "Lanjut" / "Kembali" navigation
  - Submit → Call `/api/generate`
  - Loading state during generation
  - Error handling (show retry)

- [~] **P0** Quiz state management (composable) - *1 hour* ⏳ PARTIAL (pure logic `utils/quiz-logic.ts` + 12 unit tests ✅; `composables/useQuiz()` + localStorage ⏳ NOT YET)
  - `useQuiz()` composable
  - Store answers in reactive state
  - Persist to localStorage (resume if refresh)
  - Validation logic

**Subtotal:** ~4 hours

---

### 3.4 Result Page
- [x] **P0** `pages/result.vue` - Result display - *3 hours* ✅ CODE-COMPLETE Oct 6 (5 place cards + loading + error; Simpan button/login-wall ⏳ needs auth Phase 2.1)
- [ ] **P0** Recommendation card component - *1 hour* ⏳ NOT YET (still inline in result.vue/result-food.vue — extract when 3.1 components are built)
  - Header with quota indicator
  - 5 recommendation cards:
    - Name + category badge
    - Reason (personalized)
    - Cost estimate
    - Location area
    - Best time
    - "Lihat di Maps" button (external link)
    - "Simpan" button (login wall for anonymous)
  - "Generate Lagi" sticky bottom button
  - "Ubah Jawaban" link
  - Mobile: cards stack vertically
  - Tablet/Desktop: 2-column grid

- [ ] **P0** Recommendation card component - *1 hour*
  - Reusable card component
  - Category badge styling
  - Icon integration
  - Responsive layout

**Subtotal:** ~4 hours

---

**Status Oct 6, 2026: NOT IMPLEMENTED AT ALL** — `pages/login.vue`, `register.vue`, `auth/callback.vue`, `server/middleware/auth.ts` not created yet. Quota is currently cookie-only (anonymous). Auth = blocker for login quota + Simpan + history. Priority after 8.4.
### 3.5 Auth Pages (Addendum 09 v1.3 patch — Google primary, phone optional)
- [ ] **P0** `pages/login.vue` - Login page - *1.5 hours*
  - Email + password form
  - "Remember me" checkbox
  - "Lupa password?" link (stub for now)
  - "Login dengan Google" button (PRIMARY — 1-tap)
  - Link to register page
  - Form validation
  - Error display (invalid credentials)
  - Redirect after success
  - Copy for the wall moment: "Login 10 detik → quota reset tiap hari, gratis"

- [ ] **P0** `pages/register.vue` - Register page - *1.5 hours*
  - Email, password, confirm password REQUIRED; phone collapsible OPTIONAL (+62 only if filled in)
  - Password strength indicator
  - Terms checkbox
  - "Daftar dengan Google" button
  - Form validation
  - Error display (email exists, weak password)
  - Redirect after success

- [ ] **P0** `pages/auth/callback.vue` - OAuth callback - *1 hour*
  - Handle OAuth redirect
  - WITHOUT a phone modal (removed in v1.3 — phone=NULL via trigger)
  - Loading state
  - Redirect to previous page or quiz

**Subtotal:** ~4 hours

---

### 3.6 User Features (Post-MVP P1)
- [ ] **P1** `pages/history.vue` - Generation history - *2 hours*
  - List past generations
  - Show quiz input summary
  - "Lihat Lagi" button to view results
  - Pagination
  - Empty state

- [ ] **P1** `pages/favorites.vue` - Saved favorites - *2 hours*
  - Grid of favorite cards
  - Notes display
  - "Hapus" button
  - Empty state

- [ ] **P1** `pages/profile.vue` - User profile - *1.5 hours*
  - Display email, phone
  - Edit profile (phone only)
  - Logout button

**Subtotal (P1):** ~5.5 hours

---

### 3.7 Error & Edge Case Pages (Addendum 09 v1.3 patch — 2-state wallet + voucher gate)
- [ ] **P0** `pages/quota-exhausted.vue` - Quota modal/page SPLIT place|food - *1 hour*
  - Countdown to reset 00:00 WIB (separate place 2 vs food 5)
  - 2-state wallet: anonymous shows "1 tempat • 1 makan free" + 1-tap login CTA vs registered shows remaining + countdown
  - Copy: "Login 10 detik → quota reset tiap hari, gratis"
  - Alternative actions (history login, share read-only)
  - CTA to return tomorrow
  - Voucher gate: claim REQUIRES login — anonymous tap → login bottom sheet, not an error

- [ ] **P0** Error components - *1 hour*
  - 404 page
  - 500 error page
  - Network error modal
  - LLM generation failed modal

**Subtotal:** ~2 hours

---

|**Phase 3 Total (P0 only):** ~19.5 hours  
|**Phase 3 Total (with P1):** ~25 hours

---

## Phase 8: Mall F&B Split Quiz (Addendum 07 v1.1 Approved Oct 6, 2026 + patch 09 v1.3 Oct 7, 2026)

**Goal:** Food quiz + tenant directory fully separate from the place quiz. Results are never mixed. Anonymous food 2x with cookie `food_quota_used`, registered 5x with `mall_search_quota`; voucher REQUIRES login (`voucher_claims` UNIQUE user+tenant+day).

### 8.1 Backend Mall (DB + Seed) (Addendum 09 v1.3 patch — adds `voucher_claims`; execution follows Addendum 23 v1.0)
- [x] **P0** Create tables `malls`, `tenants`, `mall_search_quota` + `raw_scrape` staging + RLS (public read, staging closed) - *30 min* ✅ DONE Oct 6, 2026 (`supabase/migration.sql`: 4 tables + `idx_tenants_needs_survey` + `idx_raw_scrape_city_status`)
- [ ] **P0** Create table `voucher_claims` (user_id NOT NULL, tenant_id, date, code WKD-XXXXXX, redeemed, UNIQUE user+tenant+day) + RLS own-claims - *30 min* ⏳ NEXT → becomes **S2 in `docs/23-PRD-Addendum-Voucher-Claim.md`** (+ `test`/`expires_at` 23:59 WIB/`redeemed_at` columns + code idx + `pin` column in tenants for P1)
- [x] **P0** Import `data/tenants-seed.csv` 200 rows (5 malls x 40) + verification - *30 min* ✅ DONE (`generate_seed.py` + `seed.sql` 205 INSERTs, pytest 10/10)
- [x] **P0** Patch NULL tri-state: empty → `NULL` + `data_source`/`verified_at`/`needs_survey`, filter `.eq(true)` excludes NULL, ❓ badge - *1 hour* ✅ DONE Oct 6, 2026 (generator + migration + `types/` + `recommend.post.ts` + `tenants.get.ts` + `result-food.vue` + `mall/[slug].vue` + `AUDIT.md`)

**Subtotal:** ~1 hour

---

### 8.2 Food API (Addendum 09 v1.3 patch — voucher claim REQUIRES login; execution follows Addendum 23 v1.0)
- [x] **P0** `GET /api/malls` + `GET /api/malls/:slug` - *45 min* ✅ CODE-COMPLETE (`index.get.ts` exists; `:slug` detail via tenants.get — reads mall inline)
- [x] **P0** `GET /api/malls/:slug/tenants` (filter halal/budget/mission/kids/search, no LLM) - *1 hour* ✅ CODE-COMPLETE + NULL `.eq(true)` rule + tri-state JSDoc
- [x] **P0** `POST /api/food/recommend` (check food quota → filter Supabase → LLM ranks Top 5 + 1-sentence reason → save `generations {type:'food'}`) - *2 hours* ✅ CODE-COMPLETE + passthrough `data_source`/`needs_survey`
- [ ] **P0** `POST /api/voucher/claim` (REQUIRES login: anonymous 401 → bottom sheet; check active promo → check `voucher_claims` → code WKD-XXXXXX → double 409) - *1.5 hours* ⏳ NEXT → becomes **S3 in `docs/23-PRD-Addendum-Voucher-Claim.md`** (+ 429 rate limit 3/day + `existing_code` on 409 + `test` flag)
- [ ] **P1** `POST /api/vote` (no login, IP rate limit) + `POST /api/report-tenant` - *1.5 hours* ⏳ NOT YET — NEXT after 8.4 (closes the `is_open`/`needs_survey` loop from AUDIT.md)

**Subtotal (P0):** ~3.75 hours

---

### 8.3 Food Frontend + Directory (Addendum 09 v1.3 patch — voucher gate + wallet; execution follows Addendum 23 v1.0)
- [x] **P0** `pages/food.vue` - Quiz 4Q (mall required 1 → mission → budget → group size + halal/kids toggle), reuses 80% of the place quiz - *2.5 hours* ✅ CODE-COMPLETE (+ pre-fill `?mall=` skips Q1 via `getFoodStartStep`, tested)
- [x] **P0** `pages/result-food.vue` - 5 pure TENANT cards (name + category•mall•floor + halal + hype + reason + price range (from price_min/price_max) + big Maps + Simpan + Lapor tutup) - *2.5 hours* ✅ CODE-COMPLETE (+ ❓/📋 tri-state badge; Simpan/Lapor buttons ⏳ need auth/vote API)
- [ ] **P0** "Klaim Voucher" button in `result-food.vue` (anonymous tap → login bottom sheet; logged in → `POST /api/voucher/claim` → code WKD-XXXXXX + "Tunjukin ke kasir") - *1.5 hours* ⏳ NEXT → becomes **S4 in `docs/23-PRD-Addendum-Voucher-Claim.md`** (wall moment #4, tenant monetization signal; spinner + :disabled + on 409 show the old code)
- [x] **P0** `pages/mall/[slug].vue` - SEO Directory (list 40 + filter + search + banner "Cariin yang cocok → /food?mall=") - *2.5 hours* ✅ CODE-COMPLETE (+ ❓/📋 badge; SEO meta ⏳ to follow)
- [x] **P0** Update landing dual CTA (🗺️ Cari Tempat big + 🍜 Cari Makan secondary) + navbar [Makan] - *45 min* ✅ PARTIAL (dual CTA in `index.vue` ✅; navbar [Makan] ⏳ NOT YET — `layouts/` doesn't exist yet)
- [ ] **P1** History/Favorites tab Place | Food (`type` field) - *1.5 hours*

**Subtotal (P0):** ~8.25 hours

---

### 8.4 Food Testing (Addendum 09 v1.3 patch — split + wall + voucher; execution follows Addendum 23 §6)
- [ ] **P0** Test food flow (landing → /food 2x anonymous → /result-food → 3rd = wall → login → claim voucher WKD-XXXXXX) - *30 min*
- [ ] **P0** Test split quota (place 2/day vs food 5/day, they don't consume each other; anonymous dual cookies) - *20 min*
- [ ] **P0** Test directory filter + SEO meta `/mall/:slug` - *20 min*

**Subtotal:** ~1.2 hours

---

**Phase 8 Total (P0):** ~13-14 hours + v1.3 (voucher_claims 0.5h + claim API 1h + claim button 1h) = **~15.5-16.5h**
**Grand Total P0:** 64h + 13h + 2.5h (v1.3) = **~79.5h** (Solo founder 4-5h/day → 16-20 days)

---

## Phase 4: State Management & Data Flow

**Goal:** Connect frontend to backend, handle auth state

### 4.1 Composables
- [ ] **P0** `composables/useAuth.ts` - Auth state - *2 hours*
  - `user` reactive ref
  - `login()`, `logout()`, `register()` functions
  - Auto-refresh token
  - Persist state across page loads

- [ ] **P0** `composables/useQuota.ts` - Quota state - *1 hour*
  - `quotaStatus` reactive ref
  - `fetchQuota()` function
  - Auto-update after generation
  - Countdown timer to reset

- [ ] **P0** `composables/useGenerate.ts` - Generation flow - *1.5 hours*
  - `generate(quizInput)` function
  - Loading state
  - Error handling
  - Store result in state

**Subtotal:** ~4.5 hours

---

### 4.2 API Client
- [ ] **P0** `utils/api.ts` - API client wrapper - *1.5 hours*
  - Fetch wrapper with auth header injection
  - Error parsing
  - TypeScript types
  - Retry logic (optional)

**Subtotal:** ~1.5 hours

---

**Phase 4 Total:** ~6 hours

---

## Phase 5: Analytics & Monitoring

**Goal:** Track user behavior and system health

### 5.1 Google Analytics Setup
- [ ] **P0** Install `@nuxtjs/google-analytics` or manual gtag - *15 min*
- [ ] **P0** Configure GA4 property - *15 min*
- [ ] **P0** Add gtag to `app.vue` - *15 min*
- [ ] **P0** Implement event tracking - *2 hours*
  - Page views (automatic)
  - quiz_started
  - quiz_completed
  - recommendation_generated
  - recommendation_clicked
  - login_prompted{reason: quota_limit|save_favorite|claim_voucher|open_wishlist|open_history} (v1.3 patch)
  - anon_quota_exhausted{type: tempat|makan} (NEW v1.3)
  - voucher_claimed{tenant_id, mall_slug} (NEW v1.3)
  - user_registered
  - quota_exhausted
  - generation_failed

**Subtotal:** ~3 hours

---

### 5.2 Server-Side Logging
- [ ] **P0** Log LLM requests to `analytics_events` - *30 min*
- [ ] **P0** Log errors to `analytics_events` - *30 min*
- [ ] **P1** Create internal dashboard page (view logs) - *2 hours*

**Subtotal (P0):** ~1 hour  
**Subtotal (with P1):** ~3 hours

---

**Phase 5 Total (P0):** ~4 hours

---

## Phase 6: Testing & Quality Assurance

**Goal:** Ensure everything works before launch

### 6.1 Manual Testing (Addendum 09 v1.3 patch — split + wall + voucher)
- [ ] **P0** Test full anonymous flow (landing → place quiz 1x → result → 2nd generate = LOGIN_REQUIRED wall) - *30 min*
- [ ] **P0** Test full anonymous food flow (landing → /food 2x → result-food → 3rd = wall; Simpan/Klaim = login bottom sheet; Wishlist/Riwayat = prompt) - *30 min*
- [ ] **P0** Test full registered flow (register phone skip=NULL → place quiz × 2 + food × 5, they don't consume each other) - *30 min*
- [ ] **P0** Test voucher claim gate (anonymous 401 → login → claim WKD-XXXXXX → double-claim 409; 1 tenant 1x/day) - *20 min*
- [ ] **P0** Test quota exhaustion scenarios (anonymous vs registered wallet, countdown 00:00 WIB) - *30 min*
- [ ] **P0** Test error scenarios (LLM timeout → quota NOT deducted, invalid input) - *30 min*
- [ ] **P0** Test OAuth flow (Google login WITHOUT phone modal) - *15 min*
- [ ] **P0** Test mobile responsive (iPhone, Android) - *30 min*
- [ ] **P0** Test on multiple browsers (Chrome, Safari, Firefox) - *30 min*

**Subtotal:** ~3 hours

---

### 6.2 Automated Testing (Optional P1)
- [ ] **P1** Set up Vitest for unit tests - *1 hour*
- [ ] **P1** Write tests for utility functions (quota check, LLM client) - *2 hours*
- [ ] **P1** Set up Playwright for E2E tests - *1 hour*
- [ ] **P1** Write E2E test for happy path - *2 hours*

**Subtotal (P1):** ~6 hours

---

### 6.3 Bug Fixes & Polish
- [ ] **P0** Fix bugs found during testing - *4 hours (estimate)*
- [ ] **P0** Polish UI/UX rough edges - *2 hours*
- [ ] **P0** Optimize performance (lazy loading, code splitting) - *2 hours*

**Subtotal:** ~8 hours

---

**Phase 6 Total (P0):** ~11 hours

---

## Phase 7: Pre-Launch Preparation

**Goal:** Final checks and launch readiness

### 7.1 Content & Copy
- [ ] **P0** Write all UI copy (headlines, CTAs, error messages) - *1.5 hours*
- [ ] **P0** Review Indonesian language consistency - *30 min*
- [ ] **P0** Create social share OG image - *1 hour*

**Subtotal:** ~3 hours

---

### 7.2 SEO & Meta Tags
- [ ] **P0** Set up SEO meta tags (title, description) - *30 min*
- [ ] **P0** Add Open Graph tags - *30 min*
- [ ] **P0** Create `robots.txt` - *10 min*
- [ ] **P0** Create `sitemap.xml` - *20 min*

**Subtotal:** ~1.5 hours

---

### 7.3 Legal & Compliance
- [ ] **P1** Create Terms of Service page (simple version) - *1 hour*
- [ ] **P1** Create Privacy Policy page (simple version) - *1 hour*
- [ ] **P1** Add cookie notice (optional for MVP) - *30 min*

**Subtotal (P1):** ~2.5 hours

---

### 7.4 Launch Checklist
- [ ] **P0** Set up production environment variables - *15 min*
- [ ] **P0** Test production build locally - *15 min*
- [ ] **P0** Deploy to production - *10 min*
- [ ] **P0** Smoke test in production - *30 min*
- [ ] **P0** Set up error monitoring (Sentry optional) - *1 hour*
- [ ] **P0** Prepare launch announcement (social media posts) - *1 hour*

**Subtotal:** ~3 hours

---

**Phase 7 Total (P0):** ~7.5 hours

---

## Time Summary

| Phase | P0 (Must-Have) | P1 (Should-Have) | Total |
|-------|----------------|------------------|-------|
| 1. Setup & Foundation | 5.5h | 0.5h | 6h |
| 2. Backend API | 12h (was 10.5 + v1.3 login wall 1.5h) | 3h | 15h |
| 3. Frontend UI | 19.5h | 5.5h | 25h |
| 4. State Management | 6h | 0h | 6h |
| 5. Analytics | 4h | 2h | 6h |
| 6. Testing & QA | 11h | 6h | 17h |
| 7. Pre-Launch | 7.5h | 2.5h | 10h |
| 8. Mall F&B Split + v1.3 | 15.5h (was 13 + voucher 2.5h) | 4.5h | 20h |
| **TOTAL** | **81h** | **24h** | **105h** |

---

## Development Timeline

### Aggressive (Focus Mode)
- **8 hours/day** → **8 days** (P0 only)
- **8 hours/day** → **10.5 days** (P0 + P1)

### Realistic (Solo Founder)
- **4-5 hours/day** → **13-16 days** (P0 only)
- **4-5 hours/day** → **17-21 days** (P0 + P1)

### Recommended Schedule
**Week 1:** Phase 1-2 (Setup + Backend)  
**Week 2:** Phase 3-4 (Frontend + State)  
**Week 3:** Phase 5-7 (Analytics + Testing + Launch)

---

## Risk Mitigation

### High-Risk Tasks (Likely to Take Longer)
1. **LLM Integration** (Phase 1.3 + 2.3)
   - Risk: API reliability, prompt tuning, JSON parsing failures
   - Mitigation: Budget 2x time, implement robust error handling

2. **Quiz UX** (Phase 3.3)
   - Risk: Form flow confusing, drop-off rate high
   - Mitigation: Test with 3-5 users early, iterate on flow

3. **OAuth Integration** (Phase 2.1 + 3.5)
   - Risk: Callback redirect issues (phone friction ALREADY removed in v1.3 — Google 1-tap signs straight in, phone=NULL)
   - Mitigation: Test thoroughly, email-only fallback ready

4. **Mobile Responsive** (All frontend)
   - Risk: Layout breaks on small screens
   - Mitigation: Mobile-first design from start, test on real devices

---

## Post-Launch Iterations

### Week 1 After Launch
- [ ] Monitor analytics daily
- [ ] Collect user feedback (survey or interviews)
- [ ] Fix critical bugs (P0)
- [ ] Iterate on LLM prompt based on quality feedback

### Week 2-4 After Launch
- [ ] Implement P1 features (history, favorites, profile)
- [ ] A/B test landing page copy
- [ ] Optimize conversion funnel (landing → quiz → result)
- [ ] Add missing features based on user requests

---

## Feature Toggles (Optional)

Consider feature flags for:
- [ ] Google OAuth (can disable if issues arise)
- [x] Phone number requirement → ALREADY permanently optional (v1.3, no longer a toggle)
- [ ] Quota limit (can increase from 2 to 3 if LLM cost allows)
- [ ] P1 features (can enable gradually)
- [ ] Voucher claim gate strictness (strict UNIQUE vs lenient if tenants complain that claims are low)

### SEO P0 share-ready (Addendum 25 — 17 Okt 2026)
- [x] robots.txt (allow publik + disallow rute personal + Sitemap absolut)
- [x] sitemap.xml dinamis (+ `/mall/:slug` dari DB, cache 1 jam)
- [x] og-image 1200×630 + global head og/twitter (nuxt.config)
- [x] canonical + og:url per-halaman (home/mall/detail) — TIDAK global
- [x] Footer publik + halaman `/privacy` `/terms` (gate Google OAuth)
- [x] GA4 plugin wiring (no-op; aktif saat `NUXT_PUBLIC_GA_ID` di-set)
- [ ] P1: set `NUXT_PUBLIC_GA_ID` di Vercel env → GA4 live + event quiz/claim
- [ ] P2: OG per-mall dinamis + compress brand assets + FAQ/Tentang content + preload font

---

## Success Criteria (2 Weeks Post-Launch) (Addendum 09 v1.3 patch — progressive funnel)

**Minimum Viable Success:**
- ✅ 50+ registered users
- ✅ 60%+ quiz completion rate
- ✅ 40%+ recommendation click-through rate
- ✅ 20%+ day-2 return rate
- ✅ <5% error rate
- ✅ anon→register >15% (NEW v1.3 — proof that progressive login works, not mandatory)
- ✅ voucher claim >20% of logged-in viewers of food results (NEW v1.3 — tenant monetization signal)

**Strong Success:**
- ✅ 100+ registered users
- ✅ 75%+ quiz completion rate
- ✅ 60%+ recommendation click-through rate
- ✅ 30%+ day-2 return rate
- ✅ Organic word-of-mouth (>0.2 viral coefficient)

---

**Document Status:** READY for execution + patch v1.3 downstream 5/5 LOCKED  
**Last Updated:** October 7, 2026 (Addendum 09 v1.3 patch: progressive auth + voucher + split quota + totals 81h P0)  
**Owner:** Agesta

**Next Action:** Execute Nuxt TDD (auth slice + 4-moment login wall + 2-state wallet + voucher gate) — specs complete across 5 docs, `app/` ready to change
