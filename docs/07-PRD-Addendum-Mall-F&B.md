# PRD Addendum — Mall F&B Directory (Split Quiz)

**Version:** 1.2 Amended (6 Oct 2026 evening — synced with the NULL tri-state patch)
**Date:** 6 Oct 2026
**Status:** Approved by Agesta (6 Oct 2026) — LOCKED, downstream patch ✅, UI ✅
**References:** `docs/01-PRD.md v2.0 Final` + `docs/02-ADR.md v2.1 Amended`
**Owner:** Agesta
**Changes vs v1.1:** Section 5 synced with the real schema: metadata columns `data_source`/`verified_at`/`needs_survey` + staging table `raw_scrape` + NULL tri-state rule (6 Oct patch, already live in migration + seed + API + UI).

---

## 0. What is a PRD Addendum? (30-second explanation)

Your `01-PRD.md v2.0` is already Final & Approved — don't touch it anymore.

**Addendum = an official extension to the existing PRD, without changing its content.**

- PRD v2.0 still applies (30-second place quiz → 5 place recommendations, quota 2/day).
- This file only adds new scope: **a standalone quiz + F&B tenant directory per mall**.
- In your company workflow (PRD → RFC → ADR), this file = a mini RFC. Once approved → patch ADR + Schema + API → Jira.

---

## 1. Additional Problem

PRD v2.0 solves **weekend decision fatigue in general** ("where to go this weekend?").

A derived, single-topic problem:
> "I'm already at Grand Indonesia, what should I eat? Halal, budget <100k, somewhere I can hang out for a long time."

New decision per your input: **don't mix them**. Why the CTO agrees:
- Different expectations: finding a place = 2-3 minutes of planning (save/share), finding food = hungry in <10 seconds.
- Different cards: a place needs area + best time, a tenant needs `floor` + halal + budget + mission.
- If mixed 3+2, users get confused ("am I being invited out, or invited to eat?") → click-rate drops.

---

## 2. Revised Vision: Two Entry, Two Quiz, One Data

```
[Entry 1: Cari Tempat] 30-second quiz → 5 PLACE recommendations (pure PRD v2.0)
[Entry 2: Cari Makan] 20-second quiz → 5 TENANT recommendations (Supabase data, this file)
```

One foundation dataset (`malls → tenants`, 200 rows already prepared in `data/tenants-seed.csv`), two separate quizzes, two separate result pages.

Landing `/` has 2 big CTAs:
- 🗺️ "Cari Tempat Weekend" → `/quiz` (existing)
- 🍜 "Cari Makan di Mall" → `/food` (new)

---

## 3. Scope V1 — Place Quiz (UNCHANGED, pure PRD v2.0)

No Q6 mall. No tenants in the place result. 100% per PRD v2.0:

Q1 mood → Q2 companion → Q3 budget → Q4 location → Q5 time → `/result` 5 tempat (implemented in `features/place/constants/questions.ts`; the conditional child-age question from PRD v2.0 was not built in V1).

---

## 4. Scope V1 — Food Quiz (new, executed together with Plan Mode)

### 4.1 Entry
- CTA on the landing page + `[Makan]` navbar item + the `/mall/:slug` directory page has a "Cariin yang cocok" button.

### 4.2 Quiz `/food` (4 questions, ~20 seconds, 1 question per screen)

1. **"Mau makan di mall mana?"** → [GI] / [Central Park] / [Kokas] / [PIM] / [Aeon BSD] (must pick 1, no free option — so the result is purely tenants)
2. **"Misi makan kali ini?"** → Makan Cepat / Nongkrong Lama / Keluarga / Healing
3. **"Budget per orang?"** → Hemat (<50k) / Menengah (50-150k) / Leluasa (>150k) — same as the place quiz for consistency
4. **"Rombongan + pantangan?"** → Sendiri / Berdua / Rame-rame + toggle Halal only + toggle Kids-friendly

### 4.3 Result `/result-food` (5 TENANTS only, no general places)

Tenant-specific card:
```
┌────────────────────────────────────────┐
│ 🍜 HokBen                              │
│ [Japanese • GI Lt.3A] [✅ Halal]       │
│ Kenapa cocok: "Cepat, halal, budget   │
│ hemat, cocok buat rame-rame."          │
│ 💰 30-80rb • 👨‍👩‍👧 Kids • 🔥 Hype TikTok │
│ [📍 Maps] [💾 Simpan] [Lapor tutup]    │
└────────────────────────────────────────┘
```

Actions: Maps (deep link with tenant name + mall), Simpan (login wall, same as place), Lapor tutup/buka (no login), Vote/share.

### 4.4 SEO Directory `/mall/:slug` (stays, no LLM, free)
List of 40 searchable tenants + filters halal/budget/floor/kids/mission/search. The "Cariin yang cocok →" button goes to `/food?mall=grand-indonesia` (Q1 pre-filled).

---

## 5. Data — Tenant List Per Mall

Schema unchanged from v1.0 (already correct for the split):

```sql
CREATE TABLE malls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Jakarta',
  area TEXT,
  maps_url TEXT,
  total_tenant INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id UUID NOT NULL REFERENCES malls(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  floor TEXT NOT NULL,
  halal BOOLEAN DEFAULT NULL,          -- NULL = not surveyed yet (tri-state, 6 Oct patch)
  budget_tier TEXT NOT NULL,
  price_min INT,  -- integer rupiah (UI formats "Rp 30-80rb")
  price_max INT,
  kids_friendly BOOLEAN DEFAULT NULL,  -- NULL = not surveyed yet
  mission TEXT[] DEFAULT '{}',
  hype_tiktok BOOLEAN DEFAULT NULL,    -- NULL = not surveyed yet
  is_open BOOLEAN DEFAULT true,
  maps_url TEXT,
  -- Data quality metadata (6 Oct 2026 patch, mandatory):
  data_source TEXT DEFAULT 'curated',  -- 'curated' | 'scrape' | 'survey'
  verified_at TIMESTAMPTZ DEFAULT NULL,
  needs_survey BOOLEAN DEFAULT false,  -- TRUE if halal/kids/hype are still NULL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tenants_mall ON tenants(mall_id);
CREATE INDEX idx_tenants_filter ON tenants(mall_id, budget_tier, halal) WHERE is_open = true;
ALTER TABLE malls ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read malls" ON malls FOR SELECT USING (true);
CREATE POLICY "Public read tenants" ON tenants FOR SELECT USING (true);
```

**Scrape staging (6 Oct 2026 patch):** scraper output does NOT go straight into `tenants`.
It must go through `raw_scrape` (RLS closed, no public-read) + a 2-layer Jabodetabek gate
(target allowlist + city column rejecting non-Jabodetabek) + a per-mall parser.
A mall without tenants = `is_active=false`, automatically hidden.

**NULL tri-state rule (6 Oct 2026 patch, mandatory):** a field not yet researched = `NULL`,
not `FALSE`/`""`. Safety filter: `.eq('halal', true)` automatically excludes NULL when halal-only.
Third UI badge: ❓ Belum terverifikasi + 📋 Perlu survey. Audit: `supabase/AUDIT.md`
(halal 194/200 is implausible, is_open 200/200 is implausible — an on-site survey is mandatory, P1).

The 200-row CSV `data/tenants-seed.csv` is still used (5 malls x 40). No change needed.

### Where the tenant list is placed (split revision):
1. **Food Result:** 5 pure tenants (not mixed).
2. **Directory `/mall/:slug`:** list + filters (SEO).
3. **History/Favorites:** JSONB snapshot + `type: 'place' | 'food'` so they don't get mixed up in the UI.

---

## 6. API (split revision, does not change the 9 place endpoints)

Place (existing, unchanged):
```
POST /api/generate → place quiz body → 5 places
```

Food (new):
```
GET  /api/malls → list of 5 malls
GET  /api/malls/:slug → detail + stats
GET  /api/malls/:slug/tenants?halal=true&budget=budget&mission=long_hangout&search=kopi
POST /api/food/recommend → body {mall_slug, mission, budget_tier, companion, halal_only, kids_friendly} → Top 5 tenants
POST /api/vote → {generation_id, tenant_id} no login, IP rate-limit
POST /api/report-tenant → {tenant_id, issue}
```

Type:
```typescript
export interface MakanQuizInput {
  mall_slug: string;
  mission: 'quick_bite'|'long_hangout'|'family'|'healing';
  budget_tier: 'budget'|'mid'|'splurge';
  companion: 'solo'|'couple'|'group';
  halal_only?: boolean;
  kids_friendly?: boolean;
}
```

---

## 7. Quota & Cost (split revision)

CTO recommendation (decisive):
- Place quota: 2/day (unchanged, PRD v2.0).
- Food quota: 5/day, separate (does not consume the place quota).
- Rationale: different behaviour (people eat 2-3x a day: lunch/dinner), cost stays $0 (Supabase filtering is free, the CF LLM only ranks, ~400 tokens).
- Implementation: add a `quota_type` column to `user_quota` or a new table `mall_search_quota(user_id, date, used)`. Anonymous: separate cookie `food_quota_used`.

---

## 8. Revised Effort

| Item | Estimate |
|---|---|
| Schema malls/tenants + seed 200 rows (CSV already prepared) | 1 hour import + verification |
| GET malls + tenants list + `/mall/:slug` page | 5 hours (reuse card) |
| Quiz `/food` (4 Q) + result-food (tenant card) | 5 hours (copy-paste the place quiz, swap Q + card) |
| POST /api/food/recommend (DB filter + LLM ranking) | 2 hours |
| **Total additional V1** | **~13 hours** (+2 hours vs mixed, but clean UX, worth it) |

Removed from scope: the mixed 3+2 logic (dropped).

---

## 9. Metrics

- Food quiz completion >75% (shorter than the place quiz)
- Food result → Maps click >40%
- Lapor tutup/buka reports per week (freshness)
- Hallucinated-tenant complaints = 0 (everything comes from the DB)

---

## 10. Next Step

1. You approve this v1.1 → I patch ADR + Schema + API + update the quiz/food prototype.
2. Coding Phase 1 keeps going (place first, food in parallel).

**Written by:** Hermes (CTO+CEO mode)
**Reviewed by:** Agesta — type "approve" to go, or "revisi: ..." to request changes.
