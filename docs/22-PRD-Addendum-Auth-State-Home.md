# 22-PRD-Addendum-Auth-State-Home — Before/After Login Differentiation on Index (Greeting + Avatar + Logout)

- Status: APPROVED AS6 wallet-card (Agesta lock "Gua suka AS6" — "I like AS6", 11 Oct 2026) → AI slices through to deploy.
- Scope: `app/composables/useAuth.ts` (NEW) + `app/app.vue` + `app/pages/index.vue` ONLY. The Final PRD is not touched.
- Who EXECUTES the slicing: the AI (revised 11 Oct: "lu yang eksekusi" — "you do the execution"). Board `design/revamp-options-v11.html` + PNG AS1-AS20, recommended AS6 = final lock.

## Why (WHY)
- Login today = a technical success but zero feel. Users pay the effort (sign up + verify + click Google)
  but return to a home that looks exactly like anon → activation leaks at the most expensive point.
- 11 Oct audit evidence: `app.vue` uses `v-if="!isLoggedIn"` but there is ZERO script/composable (always undefined
  → the header always renders Login/Register even when logged in). `index.vue` greeting is hardcoded
  `Halo, teman Wikendo` + `GET /api/quota` hardcodes `isLoggedIn:false` (the wallet is never 2+5).
  ZERO `signOut`, ZERO avatar/dropdown, ZERO `onAuthStateChange` (reload = state lost).
- A visible name greeting + login quota = psychological reward → user takes a 2nd quiz → locks in
  the login-required voucher claim (anti-farming) + repeat quiz. Without this, retention doesn't work.

## What (WHAT — mini version, $0, no new infra)
1. **Session becomes the source of truth** — NEW `app/composables/useAuth.ts`:
   `getSession()` on load + `onAuthStateChange()` for updates. Exposes `isLoggedIn, email, displayName, signOut`.
   `displayName`: Google `user_metadata.full_name` > `name` > fallback to the email prefix
   (`budi@example.com` → `Budi`). The Name field is NOT brought back into the form (the 10 Oct takeout stays).
2. **Greeting on index** — anon stays `Halo, teman Wikendo`; logged in `Halo, {firstName}` (first name only,
   never the full email). The hero sub follows the state: anon `Gratis hari ini — login buka 2 + 5` → logged in
   `Sisa kamu: X tempat • Y makan` (numbers still from the `/api/quota` cookie for now; session-aware server quota = next slice).
3. **2-state header extended** (SOP §8: `isLoggedIn ? Bell : Login button`, `max-w-md` unchanged):
   after login the right side = **avatar initial (S) + Bell 🔔**. Click the avatar → mini dropdown: email (displayed grey),
   `Riwayat`, `Wishlist (Segera)`, red `Keluar`. Logout must NOT be a big button in the header (following Tokped/Shopee/Linear).
4. **Real logout** — `supabaseBrowser().auth.signOut()` → clear state → `router.push('/')`. No confirm modal (MVP).

## Scope guard (do NOT build in this slice)
- Full `/profile` page (edit name/photo/change password) → BACKLOG.
- Google avatar photo → just the initial for now (saves bandwidth + logic).
- Session-aware `GET /api/quota` (reads access_token) → next slice, do NOT mix it in so this slice stays small.
- Idle 1:1 stays (slicing §8): the anon render MUST be exactly the same as now.

## DONE criteria (checklist for Agesta during slicing)
- [ ] `useAuth.ts` exists + exposes `isLoggedIn/email/displayName/signOut` + auth listener.
- [ ] Anon header = Login/Register (same as now); logged in = avatar initial + Bell + dropdown (email/Riwayat/Wishlist/Keluar).
- [ ] Anon index = `Halo, teman Wikendo`; logged in = `Halo, {name}` + login-aware hero sub.
- [ ] Click Keluar → back to `/` as anon (header shows Login/Register again).
- [ ] Test `auth-state-home.test.ts` enabled (remove `.skip`) → all GREEN → full suite green → lint 0 errors → build succeeds → push + prod 200.

## Verification (TDD)
- NEW test `app/tests/auth-state-home.test.ts` with 11 asserts (composable 4 + header 4 + home 3).
- Status when the Addendum was written: RED by design (`useAuth.ts` doesn't exist yet + `app.vue`/`index.vue` not wired)
  → the file is committed as `describe.skip` so main stays green; Agesta removes `.skip` when slicing starts to see it RED.
