-- migration.sql — Mall F&B tables (Phase 8.1, Addendum 07 v1.1).
--
-- WHAT: creates 4 tables (malls, tenants, mall_search_quota, raw_scrape) + indexes + RLS (public-read for the directory).
-- WHY a separate file from seed.sql: structure (once) vs data (may be regenerated).
--   Run migration.sql FIRST, then seed.sql.
-- Usage: paste this ENTIRE file into Supabase Dashboard → SQL Editor → Run.
-- Idempotent: everything uses IF NOT EXISTS / DROP POLICY IF EXISTS — safe to re-run.
-- Source: docs/04-Database-Schema.md section "Addendum 07 v1.1".
--
-- NOTE: the `generations` table (used by the recommend API to store results) is not part
-- of this file — it comes from the base schema (migration-base.sql). If the Supabase
-- project is still empty, run the base schema first, then this file.
-- Existing databases that still hold the old Indonesian enum values (hemat/menengah/leluasa)
-- must also run migration-v15-english-values.sql (it swaps the budget_tier CHECK too)
-- and migration-v16-english-identifiers.sql (lantai → floor, policy names)
-- and migration-v17-price-columns.sql (price_range text → price_min/price_max integers).

-- 1. malls table (5 rows in V1: GI, Central Park, Kokas, PIM, Aeon BSD)
CREATE TABLE IF NOT EXISTS malls (
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
COMMENT ON TABLE malls IS 'V1 mall list (directory + food quiz)';

-- 2. tenants table (200 rows in V1, 40 per mall — see seed.sql)
-- NULL RULE (approved 6 Oct 2026): halal/kids_friendly/hype_tiktok NULL = not researched yet,
-- NOT false. Do not store empty strings — use NULL + needs_survey=TRUE.
-- Column `floor` was named `lantai` before v16 (see migration-v16-english-identifiers.sql).
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id UUID NOT NULL REFERENCES malls(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  floor TEXT NOT NULL,
  halal BOOLEAN DEFAULT true,
  budget_tier TEXT NOT NULL CHECK (budget_tier IN ('budget','mid','splurge')),
  price_min INT CHECK (price_min IS NULL OR price_min >= 0),
  price_max INT CHECK (price_max IS NULL OR price_max >= 0),
  kids_friendly BOOLEAN DEFAULT false,
  mission TEXT[] DEFAULT '{}',
  hype_tiktok BOOLEAN DEFAULT false,
  is_open BOOLEAN DEFAULT true,
  maps_url TEXT,
  data_source TEXT NOT NULL DEFAULT 'curated'
    CHECK (data_source IN ('curated','scrape','deep_research','manual')),
  verified_at TIMESTAMPTZ,
  needs_survey BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- New columns for DBs that ALREADY ran the old migration (idempotent, safe to re-run):
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS data_source TEXT NOT NULL DEFAULT 'curated';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS needs_survey BOOLEAN NOT NULL DEFAULT false;
COMMENT ON TABLE tenants IS 'F&B tenants per mall (source for the food quiz ranking + directory)';
COMMENT ON COLUMN tenants.mission IS 'Matching missions: quick_bite, long_hangout, family, healing (can be >1)';
COMMENT ON COLUMN tenants.price_min IS 'Lower price bound per person, integer rupiah (NULL = unknown). The UI formats it, e.g. 30000 → "30rb".';
COMMENT ON COLUMN tenants.price_max IS 'Upper price bound per person, integer rupiah (NULL = unknown).';
COMMENT ON COLUMN tenants.halal IS 'NULL = not researched yet (not non-halal). Halal-only filter excludes NULL.';
COMMENT ON COLUMN tenants.kids_friendly IS 'NULL = not researched yet (not "not kid-friendly").';
COMMENT ON COLUMN tenants.hype_tiktok IS 'NULL = not researched yet (not "not hyped"). Time-bound, expires after 90 days.';
COMMENT ON COLUMN tenants.data_source IS 'curated=initial V1 scrape | scrape=raw list | deep_research=brand research | manual=field survey';
COMMENT ON COLUMN tenants.verified_at IS 'NULL = not verified in the field. Set when the manual survey is done.';
COMMENT ON COLUMN tenants.needs_survey IS 'TRUE = has a NULL field, queued for the manual survey.';

-- 2b. Scrape staging table (dirty data allowed in, city is REQUIRED for the Jabodetabek gate).
-- WHAT: raw holding area BEFORE rows reach the clean tenants table. WHY separate: each
-- mall website has a different format, don't pollute the production table. Flow: scrape →
-- raw_scrape → region GATE (city must be Jabodetabek, anything else is REJECTED) →
-- normalize with 1 parser per mall → INSERT tenants (halal/kids/hype = NULL + needs_survey=TRUE).
-- Scope LOCK: Jabodetabek = Jakarta, Bogor, Depok, Tangerang, Bekasi (+ variants
-- Selatan/Utara/Timur/Barat/Pusat). Outside that = reject, even if the data is good.
CREATE TABLE IF NOT EXISTS raw_scrape (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_name TEXT NOT NULL,
  city TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  floor TEXT,
  category TEXT,
  source_url TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected'))
);
COMMENT ON TABLE raw_scrape IS 'Raw scrape staging. Gate: city MUST be Jabodetabek, else status=rejected.';
COMMENT ON COLUMN raw_scrape.city IS 'Mall city. Non-Jabodetabek → auto-REJECT, do not normalize.';

-- Index: tenant lookup per mall + quiz filter (mall + budget + halal, open tenants only)
CREATE INDEX IF NOT EXISTS idx_tenants_mall ON tenants(mall_id);
CREATE INDEX IF NOT EXISTS idx_tenants_filter
  ON tenants(mall_id, budget_tier, halal) WHERE is_open = true;

-- 3. Food quota table for logged-in users (anon uses a cookie, not this table)
CREATE TABLE IF NOT EXISTS mall_search_quota (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  used INT DEFAULT 0 CHECK (used >= 0),
  PRIMARY KEY (user_id, date)
);
COMMENT ON TABLE mall_search_quota IS 'Food quiz quota for logged-in users: 5/day (anon: cookie food_quota_used, max 2)';

-- 4. RLS: the directory is publicly readable (no login) — matches the free /mall/:slug design
ALTER TABLE malls ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE mall_search_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_scrape ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read malls" ON malls;
CREATE POLICY "Public read malls" ON malls FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read tenants" ON tenants;
CREATE POLICY "Public read tenants" ON tenants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users view own food quota" ON mall_search_quota;
CREATE POLICY "Users view own food quota" ON mall_search_quota
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service manage food quota" ON mall_search_quota;
CREATE POLICY "Service manage food quota" ON mall_search_quota
  FOR ALL USING (true) WITH CHECK (true);

-- raw_scrape: NOT public-read (dirty staging data). Only the service role (bypasses RLS
-- via supabaseAdmin) reads/writes. This policy explicitly blocks anon:
DROP POLICY IF EXISTS "No public access raw_scrape" ON raw_scrape;
CREATE POLICY "No public access raw_scrape" ON raw_scrape FOR SELECT USING (false);

DROP POLICY IF EXISTS "Service manage raw_scrape" ON raw_scrape;
CREATE POLICY "Service manage raw_scrape" ON raw_scrape
  FOR ALL USING (true) WITH CHECK (true);

-- Survey queue index: the query "which rows have needs_survey=TRUE" must be fast
CREATE INDEX IF NOT EXISTS idx_tenants_needs_survey ON tenants(mall_id) WHERE needs_survey = true;
CREATE INDEX IF NOT EXISTS idx_raw_scrape_city_status ON raw_scrape(city, status);
