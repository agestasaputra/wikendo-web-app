# 21-PRD-Addendum-Google-Auth-Single-Sign-In — Neutral Label + Same Redirect + Checkbox Lock

- Status: APPROVED (Agesta: "Gas fix!" — "Go, final!", 11 Oct 2026). Continues `docs/20-PRD-Addendum-Option-A-Google-Button.md` (Option A Google button).
- Scope: `app/pages/register.vue` + `app/pages/login.vue` ONLY. The Final PRD is not touched.

## Why (WHY)
- The `signInWithOAuth({ provider: 'google' })` call on login & register is EXACTLY the same — Supabase
  decides automatically: Google email not yet known → a new user is created (register), already known →
  signed straight in (login). Different "login vs register" labels are merely cosmetic and against best
  practice (Baymard/Google finding: users forget which method they signed up with → "which one was I?" =
  micro-friction on the main acquisition path; social login lowers abandonment by up to 45%, 2–3x conversion vs forms).
- Different redirects: login honors `?redirect=` (returns to the quiz that hit the wall), register hardcodes `/` →
  a user at the quota wall who taps Daftar loses the quiz context.
- The "Setuju Syarat & Privasi" checkbox is mandatory on the email form but register's `handleGoogle()` does not
  check `agree` → legal bypass: with it unchecked you can still sign up via Google.

## What (WHAT — one door)
1. The SAME neutral label on both pages: **"Lanjutkan dengan Google"** (following Google/Supabase/Stripe —
   users don't need to remember which method they signed up with). Idle 1:1, `Menghubungkan…` spinner unchanged.
2. The SAME redirect: register reads `route.query.redirect` (SSR-safe `useRoute`, same pattern as login)
   + `redirectTo: origin + redirect` (fallback `/`). The login footer `Daftar` preserves `?redirect=`
   to `/register` so the chain isn't broken.
3. Checkbox lock: register's `handleGoogle()` checks `!agree.value` → inline error
   "Centang dulu Setuju Syarat & Privasi biar bisa lanjut." + return before OAuth.
4. Email stays different (correctly so): signUp → `/check-email` vs signIn → redirect — those are two different
   endpoints, not cosmetic.

## Verification
- TDD: NEW `google-auth-best-practice.test.ts` with 8 asserts → RED 6 failing by design → GREEN 8/8.
- Aligned: `login-revamp` (label + footer preservation) + `register-revamp` + `button-loading` label.
- Full: 200/200 (20 files) + lint 0 errors + build ~9.35s + SCAN-CLEAN + prod `/ /register /login` 200.
