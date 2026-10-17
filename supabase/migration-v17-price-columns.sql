-- supabase/migration-v17-price-columns.sql — Replace tenants.price_range (text) with integer price columns.
-- WHAT: adds tenants.price_min / tenants.price_max (integer rupiah) and backfills them by parsing
--   the old text, e.g. 'Rp 30-80rb' → 30000 / 80000. The old price_range column is KEPT (not dropped).
-- WHY: the DB should hold values, not display strings. The UI now formats "Rp 30-80rb" itself
--   (app/utils/price.ts), which also keeps the door open for other currencies/locales later.
-- Idempotent: columns are added only if missing; only rows with price_min still NULL are backfilled.
-- ORDER: run AFTER migration-v16-english-identifiers.sql, in the same window as the app deploy
--   (new code reads price_min/price_max; old code reads price_range).
-- Run: Supabase SQL Editor, or `psql "$DATABASE_URL" -f migration-v17-price-columns.sql`.

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS price_min INT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS price_max INT;

-- Backfill from the legacy text. Only the exact 'Rp X-Yrb' shape is parsed (that is what the seed used);
-- anything else stays NULL and shows up in the verification query below.
-- Guard: price_range column exists only on databases created before this change.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'price_range'
  ) THEN
    UPDATE tenants SET
      price_min = (regexp_match(price_range, '^Rp\s*(\d+)\s*-\s*(\d+)\s*rb$'))[1]::int * 1000,
      price_max = (regexp_match(price_range, '^Rp\s*(\d+)\s*-\s*(\d+)\s*rb$'))[2]::int * 1000
    WHERE price_min IS NULL
      AND price_max IS NULL
      AND price_range ~ '^Rp\s*\d+\s*-\s*\d+\s*rb$';
  END IF;
END $$;

-- Constraints (re-created so the script can be re-run).
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_price_min_check;
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_price_max_check;
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_price_order_check;
ALTER TABLE tenants ADD CONSTRAINT tenants_price_min_check CHECK (price_min IS NULL OR price_min >= 0);
ALTER TABLE tenants ADD CONSTRAINT tenants_price_max_check CHECK (price_max IS NULL OR price_max >= 0);
ALTER TABLE tenants ADD CONSTRAINT tenants_price_order_check
  CHECK (price_min IS NULL OR price_max IS NULL OR price_min <= price_max);

COMMENT ON COLUMN tenants.price_min IS 'Lower price bound per person, integer rupiah (NULL = unknown). The UI formats it, e.g. 30000 → "30rb".';
COMMENT ON COLUMN tenants.price_max IS 'Upper price bound per person, integer rupiah (NULL = unknown).';

-- Make PostgREST (Supabase API) pick up the new columns immediately.
NOTIFY pgrst, 'reload schema';

-- VERIFY (run separately; should return 0 rows = everything was parsed):
--   SELECT id, name, price_range FROM tenants WHERE price_min IS NULL AND price_range IS NOT NULL;
-- LATER, once the new app has been live and verified, the legacy column can be dropped:
--   ALTER TABLE tenants DROP COLUMN price_range;
