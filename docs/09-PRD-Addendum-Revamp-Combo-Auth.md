# PRD Addendum — Revamp Combo 5+10+15 + Progressive Auth

**Version:** 1.3 (7 Oct 2026)
**Date:** 7 Oct 2026
**Status:** Approved by Agesta (7 Oct 2026) — LOCKED
**References:** `docs/01-PRD.md v2.0 Final` + `docs/07-PRD-Addendum-Mall-F&B.md v1.2 LOCKED` + `docs/02-ADR.md v2.1` + visual `design/revamp-combo-5-10-15.html`
**Owner:** Agesta
**WHAT is this?** PRD v2.0 Final must not be touched. This file = a mini RFC: it locks the combo visuals + login/quota rules so execution doesn't make things up.
**WHY is it needed?** Two open questions (mandatory login? + chase as many users as possible?) were not yet locked in any document. Without this, the Nuxt implementation would interpret anon quota, voucher gate, and phone differently.

---

## 1. UI Decision — Combo 5+10+15 LOCKED (visual only)

**WHAT?** One complete flow, not 3 separate apps. Visual reference: `design/revamp-combo-5-10-15.html` (31KB, 8 phone mockups). That HTML file is NOT changed in v1.3 — it is sufficient as the visual spec.

- **A. Home Superapp (Option 10)** — `/`: 2 big CTAs (🗺️ Cari Tempat / 🍜 Cari Makan) + quota wallet (`2 tempat • 5 makan` for registered, `1 tempat • 1 makan free` for anon) + Event/Promo/Wishlist/Riwayat grid.
- **B-C. Swipe place quiz (Option 5)** — `/place`: 6Q (mood/companion/conditional child/budget/location/optional time), 1 question per screen, 56px thumb-zone buttons.
- **D. Result deck (Option 5)** — `/result-place`: hero #1 + Navigasi/save/share + mini deck ②③ tap "Lainnya". Best Match is purely score-based. Slot #1 may be sponsored BUT the "Sponsored" badge is mandatory.
- **E-F. Food quiz (5+15)** — `/food`: 4Q (mall required GI/CP/Kokas/PIM/Aeon + mission + budget + companions/Halal/Kids), ~20 seconds, pre-filled `?mall=` from the directory.
- **G. Food result + voucher (15)** — `/result-food`: 5 pure tenants + -20%/Halal badge + Klaim voucher button (login REQUIRED, see §2).
- **H. Directory (15)** — `/mall/:slug`: list of 40 tenants + no-LLM SSR SEO filters, organic funnel → `/food?mall=`.

**Unified tokens (WHY? for consistency, no mishmash):** base #fffdf9, place Orange #f97316, food Red #ee2c4b, Plus Jakarta Sans, 24px cards, 56px buttons.

**DEFERRED to Phase 2 (so the 2-3 week MVP is achievable):** Option 2 photos, Option 7 map as a toggle, Option 8 streak, 12 gacha. Not dropped, just queued.

---

## 2. Auth — Progressive, NOT Mandatory Login

**Decisive decisions (answering your 2 open questions):**
1. **Mandatory login? NO.** Anon can use the place quiz + the food quiz. Value first, login later.
2. **Chase as many users as possible? YES.** The scheme below is designed to convert as many non-registered users to registered as possible without killing conversion.

### 2.1 Anon vs registered allowance (split, not mixed)

| Track | Anon | Registered |
|---|---|---|
| 🗺️ Tempat (`/place→/result-place`) | **1x generate/day**, full 5-card result, Maps clickable | **2/2 full** |
| 🍜 Makan (`/food→/result-food`) | **2x generate/day**, full 5-tenant result, Maps clickable | **5/5 full** |
| 💾 Simpan / ❤️ Wishlist / 🕘 Riwayat | 🔒 locked → login prompt | ✅ works |
| 🎟️ Claim food voucher | 🔒 **login REQUIRED** (anti voucher farming) | ✅ works |
| 📣 Lapor tutup/buka + Vote/share | ✅ no login (data freshness) | ✅ works |
| 🔗 Share result link | read-only, anon recipients get the free allowance (viral loop) | same |

**WHY food 2x instead of 1x?** People eat 2-3x a day (lunch/dinner). Giving 2 makes the value felt, but the voucher is locked → bait to register + prevents mass-claiming vouchers with fresh anon identities.

### 2.2 4 login wall moments (all at high intent, WHY? to convert, not to drive users away)

1. 2nd place generate / 3rd food generate → *"Sisa anon habis. Login gratis → buka 2 tempat/hari + simpan + riwayat."*
2. Tap Simpan / Klaim voucher → login bottom sheet.
3. Open Wishlist/Riwayat → login prompt.
4. Quota exhausted → reset countdown 00.00 WIB + login button (not a dead end).

**Copy sells the benefit, doesn't block:** *"Login 10 detik (Google 1-tap) → quota reset tiap hari, gratis."*

### 2.3 Method + PRD open questions

- **Primary: Google OAuth 1-tap** (zero friction). Secondary: Email+password.
- **Email verification? OPTIONAL for now** (answers PRD open question §4.5). Don't block registration. Google OAuth is automatically verified.
- **Phone mandatory? DROP** (answers PRD §7 assumption "Phone doesn't hurt conversion" → turns out it does hurt, so drop it). WHY? Phone kills conversion + SMS cost. Keep it as optional for Phase 2 (promo broadcast). Implication: `user_profiles.phone` becomes NULL-able, +62 validation only when filled in. Google OAuth has NO "Masukkan nomor HP" modal anymore.
- **Home wallet 2 states:** anon (*"1 tempat • 1 makan free, login buat full"*) vs registered (*"2 • 5"*). Result: the Simpan/Klaim buttons get a small lock icon.

---

- Place 2/day + food 5/day, reset 00:00 WIB. Anon: localStorage UUID + cookies (`quota_used` place, `food_quota_used` food) + server-side IP rate-limit.

- Tempat 2/hari + makan 5/hari, reset 00:00 WIB. Anon: UUID localStorage + cookie (`quota_used` tempat, `food_quota_used` makan) + rate-limit IP di server.
- **LLM fail → quota is NOT deducted** (PRD §6 edge case still applies).
- Abuse (clear storage = reset) is ACCEPTED for now during the 30-50 user soft launch — growth > strict. Tighten only if there's a spike (fingerprint/IP tracking, per the PRD risk table).
- Cost is safe: food = free Supabase filtering, LLM only ranks ~400 tokens. Anon 1+2/day won't break the 500k/month budget. NFR target <2s on 3G + result load <1s still holds.

---

## 4. API & Schema Delta (executed AFTER approval, not now)

Non-breaking, downstream patch after v1.3 is APPROVED:
- `user_quota`: split `quota_type='place'|'food'` or table `mall_search_quota(user_id,date,used)` (already exists in 8.1, just use it).
- `user_profiles.phone`: NOT NULL → NULL-able (drop mandatory).
- `GET /api/quota`: anon response = `{place:{used,limit:1}, food:{used,limit:1}}`, registered = `{place:{limit:2}, food:{limit:5}}`.
- `POST /api/place/recommend` → anon 2nd = `403 LOGIN_REQUIRED`. `POST /api/food/recommend` → anon 3rd = `403 LOGIN_REQUIRED`. New voucher claim endpoint = `401` if anon.
- `POST /api/vote` + `POST /api/report-tenant`: stay login-free + IP rate-limit.
- Analytics: `login_prompted{reason}`, `user_registered{method}`, `voucher_claimed`, `anon_quota_exhausted{type}`.

---

## 5. Additional Metrics (besides the PRD North Star)

- Anon → registered conversion >15% (the main goal of this v1.3).
- Login wall conversion per moment (which converts best? → iterate copy).
- Voucher claim rate (food → claim).
- Unchanged: landing→quiz >40%, completion >70%, Maps CTR >50%, time >60s, share >5%, hallucinated tenant = 0.

---

## 6. Effort (rough, locked at Checklist)

- Downstream docs patch (ADR v2.2 + Schema + API + Journey + Checklist + PROGRESS): ~1 hour.
- Auth slice (login/register/callback/middleware — the old blocker): ~4 hours (already in Checklist 3.5).
- 2-state wallet + 4-moment login wall + Simpan/Klaim lock + countdown: ~3 hours.
- Voucher gate + phone NULL-able migration: ~1.5 hours.
- **Additional total for v1.3: ~5-6 hours**, on top of the auth backlog that genuinely hasn't been done yet.

---

## 7. Next Step

1. Agesta types **"approve"** → I patch ADR v2.2 + Schema + API + Journey + Checklist + PROGRESS (WHY+WHAT+WHEN).
2. Or types **"revisi: ..."** to request changes (e.g. anon food 1x instead of 2x, or phone stays mandatory).
3. Only after that, execute Nuxt via TDD (test→lint→build); still **0 changes to `app/` before approval** — the old lock still applies.

**Written by:** Hermes (CTO+CEO mode)
**Reviewed by:** Agesta — type "approve" to go, or "revisi: ..." to request changes.
