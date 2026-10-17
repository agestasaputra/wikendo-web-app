# 20-PRD-Addendum-Option-A-Google-Button — Outline + "ATAU" Divider + Official G Logo

- Status: APPROVED (Agesta replied "A", 11 Oct 2026). Board: `design/revamp-options-v10.html` opt-A.
- Scope: `app/pages/register.vue` + `app/pages/login.vue` ONLY (aligned as one auth family). The Final PRD is not touched.

## Why (WHY)
- The Google button is token-identical to the form pills (white + rounded-full + shadow) → users read it as the first field, not an action → the social-login lift (−45% abandonment, 2–3x conversion) is lost.
- The imitation blue circular "G" logo violates Google's branding guidelines (the 4-color G on white is mandatory).
- Without a divider, the social group and the form blur into one (Gestalt proximity).

## What (WHAT — Option A)
1. Google button: `border:1.5px solid #DADCE0` (Google's official outline theme) + 4-color G SVG logo (`#EA4335/#4285F4/#FBBC05/#34A853`) + shadow removed. Rounded + padding + label unchanged (idle 1:1).
2. An `ATAU` ("OR") divider (line `#D6D3D1` + text `#A8A29E` 10px tracking-widest, `aria-hidden`) between Google and the form.
3. The black `#0C0A09` CTA stays the only solid element → hierarchy "Google = shortcut, Daftar/Masuk = primary action".
4. Wiring intact: OAuth + `googleLoading` spinner + `Menghubungkan…` + guard + `:disabled` unchanged.

## Verification
- TDD: NEW `google-button-a.test.ts` with 9 asserts → RED 6 failing by design → GREEN 9/9.
- Full: 192/192 (19 files) + lint 0 errors + build ~9.4s + SCAN-CLEAN + prod `/ /register /login` 200.
