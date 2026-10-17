# 23-PRD-Addendum-Voucher-Claim v1.1 — Multi-Voucher + Sheet + Strip

**Status:** PUBLISHED 11 Oct 2026 — multi-voucher schema + best-1 sheet + promo strip on the mall page.  
**Basis:** Expert recommendation V13: package A+B+C ~2.5h P0 $0 ZERO new routes on top of the VC5 lock.  
**Gate:** `Gas v13` — user agreed to proceed with execution.

---

## 1. V13 Feature Summary

This feature adds voucher options beyond the default `-20% buat lu + Buka` gift in the result-food.vue hero, with an end-to-end multi-voucher pattern:

- **V13A:** Hero best-1 + `+2 promo lain` link — signals that options exist without bombarding the user.
- **V13B:** Sheet above the result — `Pilih promo 1 dari 3` in tenant context (Maps stays, anti-stacking `1 transaksi 1 kode`), claim countdown per row, unique code `WKD-XXXXXX` expiring at 23:59.
- **V13C:** Promo strip on the mall page — 1 section on the mall page, click jumps to the tenant, $0 cost, discovery without a new page.

**Total effort:** ~2.5h P0. Token lock: paper #F5F5F4 + ink #0C0A09 + lime/rose/mint. `app/` UNTOUCHED.

---

## 2. Database Schema — Multi-Voucher P0/P1

New `vouchers` table (additional migration on top of v1.0):

| Column | Type | Constraint | Notes |
|-------|------|------------|------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants | Each tenant has its own voucher |
| `code` | TEXT | UNIQUE + NOT NULL | Claim code `WKD-XXXXXX` |
| `promo_text` | TEXT | NOT NULL | Example: `-20% Weekday` |
| `promo_active` | BOOLEAN | DEFAULT true | Active/Inactive |
| `discount_percent` | INTEGER | DEFAULT 0 | Discount (%) |
| `discount_type` | TEXT | `percentage` | `percentage` or `fixed` |
| `max_claims_per_tenant` | INTEGER | DEFAULT 1 | P0: 1 active per tenant/day |
| `claims_per_tenant_today` | INTEGER | DEFAULT 0 | Today's counter (RBAC) |
| `valid_from` | TIMESTAMP | NOT NULL | Valid from |
| `valid_until` | TIMESTAMP | NOT NULL | Expires 23:59 today |
| `created_at` | TIMESTAMP | DEFAULT now() | |
| `updated_at` | TIMESTAMP | DEFAULT now() | |

**Crucial P0 constraints:**
- `UNIQUE(user_id, tenant_id, claim_date)` — only 1 claim per user per tenant per day.
- `CHECK (max_claims_per_tenant >= 1)` — P0 equivalent to 1 transaction 1 code.
- `valid_until` always expires at 23:59 WIB today (never in the past).

**`voucher_claims` table (P1, optional):**
| Column | Type | Constraint |
|-------|------|------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → auth.users |
| `voucher_id` | UUID | FK → vouchers |
| `claim_code` | TEXT | `WKD-XXXXXX` |
| `claimed_at` | TIMESTAMP | DEFAULT now() |
| `redeemed_at` | TIMESTAMP | NULL → not yet redeemed |
| `redeem_code` | TEXT | NULL → not yet redeemed, or `PIN-XXXXXX` |

**Index:**
- `idx_vouchers_tenant_active` ON (`tenant_id`, `promo_active`, `valid_until`)
- `idx_voucher_claims_user_tenant_day` ON (`user_id`, `tenant_id`, `claim_date`)

---

## 3. End-to-End Flow (Kopi GI Example)

1. User sees result-food.vue → V13A hero: `-20% Weekday` + `+2 promo lain` (lime link).
2. User clicks `+2 promo lain` → V13B sheet appears above the result, 3 rows:
   - Row 1: Kopi Weekday -20% — 7/20 left — **Klaim** → code `WKD-7X2K9A` appears → 23:59 countdown.
   - Row 2: Free Large — 12/20 left — **Klaim** → code `WKD-4Y5B3C` appears → 23:59 countdown.
   - Row 3: Dessert 35rb — 3/10 left — **Klaim** → code `WKD-L8M2N1` appears → 23:59 countdown.
3. User clicks **Klaim** on row 1 → code `WKD-7X2K9A` appears + countdown + **Tukar di Kasir** button.
4. User opens the cashier `/t/:slug` → title + terms + `Tukar` field + PIN field.
5. User enters code `WKD-7X2K9A` + PIN → server validation → `voucher_claims` created → status `redeemed`.
6. Other vouchers in rows 2+3 are locked for the same tenant until tomorrow (anti-stacking).

**Alias `/voucher/:code` P1:** Along with PIN on the cashier page (not P0).

---

## 4. V13C Flow — Strip on the Mall Page

1. User opens `mall/[slug].vue` → scrolls to the **"Promo hari ini di GI"** section.
2. The section shows a 1-line strip: `Promo hari ini di GI (7)` — 7 active vouchers today.
3. User clicks the strip → **jumps** to result-food.vue with the selected voucher (single tenant).
4. **ZERO new routes** — the strip only swaps the URL param `?from_mall=true`, it does not create a new route.

**Strip visual on the mall page:**
```
--------------------------------------------------
| Promo hari ini di GI (7)                       |
|  • -20% Weekday (sisa 7/20)                  |
|  • Free Large (sisa 12/20)                   |
|  • Dessert 35rb (sisa 3/10)                  |
| [Buka → result-food.vue]                      |
--------------------------------------------------
```

---

## 5. V13 Claim Flow — Technical Detail

### 5.1 `POST /api/voucher/claim` (S3)

**Request (requires login):**
```json
{
  "voucher_code": "WKD-7X2K9A"
}
```

**Success response:**
```json
{
  "status": "ok",
  "claim_code": "WKD-7X2K9A",
  "expires_at": "2026-10-12T16:59:00.000Z",
  "voucher": {
    "name": "Kopi Weekday -20%",
    "discount_percent": 20
  },
  "time_remaining": { "hours": 5, "minutes": 30, "expired": false }
}
```

**Error response 401:** Not logged in → back to the login wall.
**Error response 409:** User+tenant already claimed today → `Anda sudah mengklaim voucher tenant ini hari ini. Kembali besok.`
**Error response 429:** more than 3 claims per user per day (all tenants combined) → `Batas maksimal 3 voucher per hari. Balik besok ya.`

### 5.2 `GET /api/voucher/:code` (P1, optional)

**Request:** `GET /api/voucher/WKD-7X2K9A`
**Response:** `{ code: "WKD-7X2K9A", status: "active", voucher_name: "Kopi Weekday -20%", discount: 20, expired_at: "2026-10-12T23:59:00.000Z" }`

---

## 6. V13 Cashier Flow — `/t/:slug` (P1, optional)

1. User opens `/t/:slug` → title: `Tukar Voucher` + terms.
2. Field: `Kode Voucher` (text input) + `PIN` (text input, optional for P0).
3. **Tukar** button → POST `/api/voucher/claim` with code + PIN if present.
4. If successful → confirmation page: `Voucher berhasil ditukar!` + `Kode: WKD-7X2K9A` + `Diskon: 20%` + `Kadaluarsa: 23:59 WIB`.
5. If it fails → inline error + countdown resets.

---

## 7. Anti-Farming & Anti-Stacking Rules (P0 Lock)

- **1 user + 1 tenant + 1 day = only 1 claim.** `UNIQUE(user_id, tenant_id, claim_date)` in the DB.
- **Max 3 claims per user per day, across all tenants** (hard limit at API 429).
- **No voucher stacking** in the same transaction. Each claim generates a unique single-use code.
- **23:59 WIB countdown** — after 00:00 the next day the claim is void (it can be claimed again from scratch).
- **Anti-leak:** Every `WKD-XXXXXX` code is generated deterministically from `user_id + tenant_id + claim_date + counter`. It cannot be guessed.

---

## 8. P0 Verification Checklist (DONE when all are met)

- [x] `docs/23-PRD-Addendum-Voucher-Claim.md` → v1.1 multi+sheet+strip.
- [x] Supabase migration: `vouchers` + `voucher_claims` tables with the constraints above.
- [x] `useVoucher()` helper in `app/composables/` — `claimVoucher(code)`, `getVoucherStatus(code)`.
- [x] `POST /api/voucher/claim` API — 401/409/429 handling + spinner + :disabled.
- [x] V13A hero best-1 + `+2 promo lain` in result-food.vue — 1:1 with the revamp-options-v13.html design.
- [x] V13B 3-row sheet above the result — `Pilih promo 1 dari 3` + remaining cap per row + Klaim per row.
- [x] V13C strip on the mall page — 1 `"Promo hari ini di GI (7)"` section without a new route.
- [x] TDD tests: S1 auth `requireUser` 401, S2 `voucher_claims` UNIQUE, S3 `POST /api/voucher/claim` 401/409/429, S4 best-1+sheet+BIG code+countdown+spinner.
- [x] `docs/08-PROGRESS.md` NOW+LOG updated + commit + push + Vercel redeploy + prod 200 verification.
- [x] `design/revamp-options-v13-compare.png` QA PASS (3 distinct panels, ZERO tofu/overlap).
- [x] `app/` UNTOUCHED for the design mock — everything lives in `design/`.

---

## 9. Checklist 8.x Sync (Auto-Patched)

See `docs/06-MVP-Checklist.md` areas 8.1-8.4 for the latest progress. Every entry in the CHECKLIST must stay in sync with this file: WHY in the ADDENDUM, WHAT in the CHECKLIST, WHEN in the PROGRESS.md LOG.

*End of Addendum 23 v1.1*
