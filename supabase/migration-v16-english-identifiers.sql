-- supabase/migration-v16-english-identifiers.sql — Rename Indonesian identifiers to English.
-- WHAT: tenants.lantai → tenants.floor, raw_scrape.lantai → raw_scrape.floor, and the two
--   mall_search_quota RLS policies "... makan quota" → "... food quota".
-- WHY: project rule — DB/data identifiers and values are English, only UI copy is Indonesian.
--   The app and seed now read/write `floor`; existing databases must be renamed to match.
-- Idempotent: each rename only runs if the old name still exists; policies are dropped then recreated.
-- ORDER: run this BEFORE re-running seed.sql, and deploy the new app code in the same window
--   (old code selects `lantai`, new code selects `floor`).
-- Run: Supabase SQL Editor, or `psql "$DATABASE_URL" -f migration-v16-english-identifiers.sql`.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'lantai'
  ) THEN
    ALTER TABLE tenants RENAME COLUMN lantai TO floor;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'raw_scrape' AND column_name = 'lantai'
  ) THEN
    ALTER TABLE raw_scrape RENAME COLUMN lantai TO floor;
  END IF;
END $$;

-- RLS policies on mall_search_quota (same rules, English names).
DROP POLICY IF EXISTS "Users view own makan quota" ON mall_search_quota;
DROP POLICY IF EXISTS "Users view own food quota" ON mall_search_quota;
CREATE POLICY "Users view own food quota" ON mall_search_quota
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service manage makan quota" ON mall_search_quota;
DROP POLICY IF EXISTS "Service manage food quota" ON mall_search_quota;
CREATE POLICY "Service manage food quota" ON mall_search_quota
  FOR ALL USING (true) WITH CHECK (true);

-- Make PostgREST (Supabase API) pick up the renamed column immediately.
NOTIFY pgrst, 'reload schema';
