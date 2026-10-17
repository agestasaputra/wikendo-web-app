# Folder `supabase/` — Mall F&B Database (Phase 8.1)

A **beginner** guide: which files live here, the order to run them, and how to use them.
Written step by step. New engineers read this first before touching the DB.

> **For AI assistants:** the ground rules live in `app/AGENTS.md`. This file is only a human guide.

## Folder contents

| File | WHAT | When to use |
|---|---|---|
| `migration.sql` | Creates the STRUCTURE: 4 tables (`malls`, `tenants`, `mall_search_quota`, `raw_scrape` staging) + indexes + RLS | Once (safe to re-run, idempotent) |
| `migration-v14-rename-flows.sql` | Renames the old flow values in `generations.quiz_input.type` ('tempat'/'makan' → 'place'/'food') | Once after the rename deploy (idempotent) |
| `migration-v15-english-values.sql` | Translates stored domain values to English (`tenants.mission`, `tenants.budget_tier`, `tenants.category`, `generations.quiz_input`) and swaps the `budget_tier` CHECK constraint | Once, on databases created before the English-values change (idempotent; fresh installs don't need it) |
| `migration-v16-english-identifiers.sql` | Renames `tenants.lantai`/`raw_scrape.lantai` → `floor` and the two `mall_search_quota` "makan quota" policies → "food quota" | Once, on existing databases, BEFORE re-running `seed.sql` and in the same window as the app deploy (idempotent; fresh installs don't need it) |
| `migration-v17-price-columns.sql` | Replaces `tenants.price_range` (text like `Rp 30-80rb`) with integer `price_min`/`price_max` (rupiah), backfilled by parsing the old text. The old column is kept until you drop it | Once, on existing databases, right after v16 and in the same window as the app deploy (idempotent; fresh installs don't need it) |
| `seed.sql` | Fills the DATA: 5 malls + 200 tenants (40/mall) | After the migration; safe to re-run (upsert + delete-insert) |
| `generate_seed.py` | Script that BUILDS `seed.sql` from `../data/tenants-seed.csv` | When the CSV changes (new mall/tenant) → regenerate |
| `tests/test_generate_seed.py` | Generator unit tests (15 tests: mission, escape quote, bool, NULL tri-state, price parsing, mall meta) | Every time the generator/CSV changes → must be green |
| `AUDIT.md` | Valid-vs-survey audit: which fields are trusted, which are queued for survey + workflow queries | Before claiming data is verified; before every field survey |

## How to use (order is REQUIRED)

### 1. Run the migration in Supabase

1. Open your Supabase Dashboard project → **SQL Editor** → **New query**
2. Copy-paste the **entire** contents of `migration.sql` → **Run**
3. Success means no red errors. The `malls`, `tenants`, `mall_search_quota` tables are created.

### 2. Run the seed in Supabase

1. In the SQL Editor → **New query** again
2. Copy-paste the **entire** contents of `seed.sql` → **Run**
3. Verify — you should get:

| slug | total_tenant | aktual |
|---|---|---|
| aeon-bsd | 40 | 40 |
| central-park | 40 | 40 |
| grand-indonesia | 40 | 40 |
| kota-kasablanka | 40 | 40 |
| pondok-indah-mall | 40 | 40 |

If any row is not 40 → the seed failed, do not continue. Report to Agesta.

### 3. When the CSV changes (new mall/tenant)

DO NOT edit `seed.sql` by hand — it is auto-generated. Instead:

```bash
cd supabase
python3 generate_seed.py   # rewrites seed.sql from the CSV
python3 -m pytest tests/ -q  # must show 15 passed
```

Then re-run `seed.sql` in the SQL Editor like step 2.

## Why a script instead of hand-written SQL?

The CSV has 3 traps that make the whole seed fail if even one slips through:

1. **Apostrophes in names** — `McDonald's`, `D'Crepes`, `Roti'O`. In SQL, `'` must be written as `''`.
   One miss = one failing statement.
2. **Pipe-separated mission** — `quick_bite|family` must become `ARRAY['quick_bite','family']`
   (a `TEXT[]` column, not a plain string).
3. **Text bools** — `true`/`false` in the CSV must become SQL `TRUE`/`FALSE`.

The script + 15 unit tests guard all of these. Red test = do not run the seed.

## NULL rule + scrape staging (patch 6 Oct 2026)

1. **Not researched yet = `NULL`, not `FALSE`/empty string.** Empty `halal`/`kids_friendly`/`hype_tiktok`
   → `NULL` + `needs_survey=TRUE` (queued for survey). The halal-only/kids filters
   use `.eq(true)` → `NULL` is excluded automatically. The UI shows ❓ Belum terverifikasi.
2. **Scrapes do NOT go straight into `tenants`.** They land in `raw_scrape` first → city gate
   (non-Jabodetabek = `rejected`) → per-mall parser → clean `tenants`.
3. **Data audit:** `AUDIT.md` — which fields are valid, which are queued for survey (P1/P2/P3).

## FAQ

**Q: Does running the migration/seed twice create duplicates?**
A: No. The migration uses `IF NOT EXISTS`. Seed: malls use `ON CONFLICT DO UPDATE`,
tenants are `DELETE`d per mall first, then `INSERT`ed fresh.

**Q: Where is the `generations` table? Why does the recommend API insert into it?**
A: It belongs to the base schema (place quiz, docs/04 section 4) — not part of Phase 8.1.
If the Supabase project is still empty, run the base schema first, then this `migration.sql`.

**Q: Why is the `mall_search_quota` table empty after the seed?**
A: That's normal. The table fills automatically when a logged-in user uses the food quiz (5/day).
Anon users use a browser cookie (`food_quota_used`, max 2) — it never touches this table.

**Q: Want to add a 6th mall?**
A: Add 40 rows to the CSV (new `mall_slug`) + add 1 entry to `MALL_META`
(`generate_seed.py`) + regenerate + run the seed. The API + pages follow automatically
(the `GET /api/malls` list is dynamic, the quiz reads from it).
