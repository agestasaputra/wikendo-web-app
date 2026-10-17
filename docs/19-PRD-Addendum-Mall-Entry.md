# PRD Addendum — Mall Entrypoint on Home (M1+M3)

**Version:** 1.0 (9 Oct 2026)
**Status:** Approved by Agesta (9 Oct 2026) — LOCKED (`Gua suka M1+M3`, i.e. "I like M1+M3")
**References:** `docs/01-PRD.md v2.0 Final` + `docs/09-PRD-Addendum-Revamp-Combo-Auth.md v1.3 LOCKED` + board `design/revamp-options-v8.html`
**Owner:** Agesta
**WHAT is this?** The Final PRD must not be touched. This file = a mini RFC: it locks the entry point into /mall from Home so execution doesn't make things up.
**WHY is it needed?** /mall is an orphan — 5 malls • 200 tenants, no login/quota (lowest friction), yet zero entries from Home. The 4 quick icons are dead (spans without links), and the 2 CTAs are only Tempat + Makan.

---

## 1. Decision — M1+M3 Package LOCKED

- **M1 (P0, ~1 hour):** the dead Event icon (🎡, span) → a **Mall 🏬** icon linking to `/mall`. Above the fold, zero layout shift, quiz CTR is safe.
- **M3 (P1, ~3 hours, 1 commit together with M1):** a **Mall Terdekat** card below Rekomendasi: `🏬 Mall Terdekat / 5 mall • 200 tenant → tanpa login`, links to `/mall`. Pull pattern, informative (real count from the static copy already shown on /mall: "5 mall").
- **M2 REJECTED:** a third CTA alongside the quiz cannibalizes the landing→quiz >40% target (PRD §4).

## 2. Execution rules

- Dual Entry Split stays: the Mall entry is only a door to `/mall`, it does not prefill any quiz.
- The M3 count "5 mall • 200 tenant" = static copy consistent with /mall ("5 mall" + 5×40 seed tenants); if the seed changes, update the copy together.
- Tokens follow the old lock: paper #F5F5F4, ink #0C0A09, lime #A3E635, ember #EA580C, rose #E11D48.

## 3. Verification DONE

- TDD `app/tests/mall-entry.test.ts`: M1 (link+🏬, no Event/🎡), M3 (title+count+no login), ≥2 doors to /mall.
- Full suite + lint + build green, prod `/` 200 + markers (🏬, Mall Terdekat, 2× /mall links).
