# 24-PRD-Addendum-BottomNav-E1 — Home-Mall-Quiz+-Riwayat-Akun

**Status:** PUBLISHED 13 Oct 2026 — TDD execution + slicing + prod deploy.
**Basis:** Agesta's GATE `Gas e1` ("Go e1"; board v15 U1 vs E1 vs E2, E1 ⭐ 80% of the full idea with ZERO dead tabs, effort 3-4h).
**Previous gate:** v14 board BN1-BN20 GATE ⏳ (recommended BN1) → v15 evaluation of Agesta's idea → E1 LOCKED.
**The Final PRD is not touched.** All new scope lives in this addendum.

---

## 1. E1 Summary

Mobile-app-style 5-tab bottom-nav, 100% within the `max-w-md` thumb-zone:

- **Home** (`/`) — active by default, ZERO change to home content.
- **Mall** (`/mall`) — hub for the 5-mall directory, ZERO content change.
- **Quiz+** (center, NOT a route) — tap → bottom-sheet with 2 explicit intents with different quotas.
- **Riwayat** (`/history` NEW) — localStorage list "Terakhir dilihat", ZERO backend.
- **Akun** (`/account` NEW) — 2-state hub mirroring the AS6 header, ZERO new heavy page.

**Total effort:** ~3-4h P0. Token lock: paper #F5F5F4 + ink #0C0A09 + lime #A3E635 + ember #EA580C + rose #E11D48.
**Accepted cost:** Quiz+ = 2 taps (tap + → tap Tempat/Makan) vs 1 tap with 2 tabs. Reason: a single button can't carry 2 different quota intents (2/day vs 5/day) without lying.

---

## 2. WHY (why E1, not raw U1)

- Agesta's idea `home-history-add quiz-notification-account` = 70% right (5-tab mobile pattern, Add→Quiz place/food, Account→login/wishlist/contact/about).
- 30% expert adaptation (LOCKED):
  - Notif → Mall in P0. ZERO notif backend + ZERO table + login-only header Bell = a Notif tab is a dead tab for 100% of anon users. Mall already exists (`/mall` 5 malls 200 tenants) → a live tab on day 1.
  - History → `/history` reads localStorage `wikendo_history` ("Terakhir dilihat"). Without a backend, honestly empty (`Belum ada riwayat — mulai quiz pertamamu →`).
  - The center Add does NOT navigate directly → a bottom-sheet with 2 explicit cards. The Tempat vs Makan split must be explicit (different quotas, results not mixed).
  - Account → `/account` hub without a heavy new page (no full /profile, no Google photo, no session-aware server quota — follows the Addendum 22 guard).
- U1 effort 6-10h + 2 empty tabs (notif/history dead). E1 effort 3-4h with ZERO dead tabs. E2 = full P1 + backend later (BACKLOG).

---

## 3. WHAT — Add click and Account click (LOCKED interaction contract)

### 3.1 Clicking Quiz+ (center)

- Tap → a bottom-sheet slides up from the bottom + dark backdrop. ZERO page navigation. ZERO new API calls (quota uses the existing `GET /api/quota` if needed, anon fallback `1•2`).
- The sheet holds 2 cards:
  - `🗺️ Cari Tempat (2/hari) → /quiz` — honest quota: anon remaining `1/1`, real login `x/2`. Exhausted → disabled `Besok lagi 00.00`.
  - `🍜 Cari Makan (5/hari) → /food` — honest quota: anon remaining `2/2`, real login `x/5`. Exhausted → disabled `Besok lagi 00.00`.
- Close: tap backdrop / swipe down / X button. Light focus trap, `aria-label` on the sheet + close button.
- Tokens: white rounded-2xl sheet, handle bar `#d6d3d1`, card border `#e7e5e4`, ink CTA `#0C0A09`, 4px ink top-border (consistent with the V13B sheet).

### 3.2 Clicking Account (hub `/account`)

- NEW route `/account` (file `app/pages/account.vue`). NOT a modal. Mirrors the AS6 2-state header:
  - Anon: CTA `Login → /login` + `Daftar → /register` + note `Login gratis → buka 2 tempat + 5 makan/hari`.
  - Logged in: avatar initial + name (`displayName`) + grey email + red `Keluar` button (SVG spinner `animate-spin` + `:disabled` + early-return guard → `signOut()` → back to `/` as anon).
- Hub list (LOCKED order):
  1. `🕒 Riwayat` → `/history` (deliberately redundant with the Riwayat tab — real localStorage).
  2. `❤️ Wishlist` → honestly disabled `Segera` (follows the AS6 header, wall moment #3a stays `isWishlistLoginWall`).
  3. `💬 Hubungi kami` → direct link `https://wa.me/` (no intermediate page).
  4. `ℹ️ Tentang` → footer anchor `#tentang` (the `app.vue` footer adds `id="tentang"` + Wikendo MVP text).
- Notif stays the login-only header Bell (SOP §8). ZERO Notif tab in the bottom-nav. ZERO dead ends: every row has an action.

### 3.3 Riwayat tab (`/history` NEW)

- NEW route `/history` (file `app/pages/history.vue`). Reads `localStorage key wikendo_history` (JSON array `{ kind, title, sub, at }`, max 20, newest-first).
- Empty → `Belum ada riwayat — mulai quiz pertamamu →` (1:1 with the home text `Terakhir dilihat`).
- `result.vue` + `result-food.vue` write 1 entry to `wikendo_history` when data succeeds (`typeof window` guard, JSON try/catch, dedupe by title, cap 20). ZERO API, ZERO quota deducted.
- Home `Terakhir dilihat` stays (deliberately redundant, same real data).

---

## 4. Scope guard (do NOT build in this slice)

- Notif tab / notif table / push → BACKLOG (E2).
- Full `/profile` (edit name/photo/change password) → BACKLOG (follows Addendum 22).
- Google avatar photo → just the initial (saves bandwidth).
- Session-aware `GET /api/quota` (reads access_token, real login 2+5) → next slice, do NOT mix it in.
- Real wishlist / history backend → BACKLOG. Wishlist stays honestly disabled `Segera`.
- Idle 1:1: home/mall/quiz/food/result renders MUST be exactly the same as now (except padding-bottom + nav).

---

## 5. DONE criteria

- [ ] NEW `app/components/BottomNav.vue`: 5 tabs Home/Mall/Quiz+/Riwayat/Akun, `max-w-md`, fixed bottom, active lime+dot, center Quiz+ opens the sheet (not a route).
- [ ] Quiz+ sheet with 2 cards Tempat→`/quiz` + Makan→`/food`, honest quota, exhausted = disabled `Besok lagi 00.00`, close via backdrop/X, `aria-label`.
- [ ] NEW `app/pages/account.vue`: 2-state anon/login mirroring AS6 + 4 hub rows (Riwayat/Wishlist Segera/WA/Tentang) + Keluar with spinner+guard → `/`.
- [ ] NEW `app/pages/history.vue`: reads `wikendo_history`, honestly empty, newest-first list.
- [ ] `result.vue` + `result-food.vue` write `wikendo_history` (window guard, cap 20, dedupe).
- [ ] `app.vue` mounts `<BottomNav/>` + `pb-24` so nothing is covered + footer `id="tentang"`.
- [ ] Test `bottom-nav-e1.test.ts` GREEN → full suite green → lint 0 → build succeeds → synced push → prod `/ /mall /account /history` 200.

## 6. Verification (TDD)

- NEW test `app/tests/bottom-nav-e1.test.ts` (~18 asserts): 5-tab component + 2-intent sheet + quota/disabled + 2-state account + 4-row hub + riwayat localStorage + result writes history + app.vue wiring.
- Status when the Addendum was written: RED by design (`BottomNav.vue`/`account.vue`/`history.vue` don't exist yet) → GREEN at slice time. The full suite stays green.
