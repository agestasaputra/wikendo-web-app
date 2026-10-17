-- supabase/migration-v15-english-values.sql — Translate stored domain values to English.
-- WHAT: map quiz/filter enum values (mood, companion, budget/tier, location, time, mission)
--   from Indonesian to English in tenants.mission, tenants.budget_tier, tenants.category
--   (kopi/indonesia/minuman → coffee/indonesian/drinks) and generations.quiz_input.
--   Also swaps the tenants.budget_tier CHECK constraint to the English values.
-- WHY: the app now emits English values (see mapping below); old rows are aligned so
--   directory filters and per-mode analytics stay correct.
-- Idempotent: only old values are rewritten; already-English values are left untouched.
-- Run: Supabase SQL Editor, or `psql "$DATABASE_URL" -f migration-v15-english-values.sql`.

CREATE OR REPLACE FUNCTION flow_value_en(v text) RETURNS text AS $$
  SELECT CASE v
    -- mood
    WHEN 'santai' THEN 'relax'
    WHEN 'seru' THEN 'fun'
    WHEN 'kuliner' THEN 'foodie'
    WHEN 'alam' THEN 'nature'
    -- companion
    WHEN 'sendiri' THEN 'solo'
    WHEN 'berdua' THEN 'couple'
    WHEN 'rame' THEN 'group'
    WHEN 'keluarga' THEN 'family'
    -- budget / budget_tier
    WHEN 'hemat' THEN 'budget'
    WHEN 'menengah' THEN 'mid'
    WHEN 'leluasa' THEN 'splurge'
    -- location
    WHEN 'jaksel' THEN 'south-jakarta'
    WHEN 'jakpus' THEN 'central-jakarta'
    WHEN 'jakbar' THEN 'west-jakarta'
    WHEN 'bebas' THEN 'anywhere'
    -- time
    WHEN 'siang' THEN 'day'
    WHEN 'malam' THEN 'night'
    WHEN 'fleksibel' THEN 'flexible'
    -- mission (food)
    WHEN 'makan_cepat' THEN 'quick_bite'
    WHEN 'nongkrong_lama' THEN 'long_hangout'
    ELSE v
  END
$$ LANGUAGE sql IMMUTABLE;

-- tenants.budget_tier has a CHECK constraint (see migration.sql). Databases created before
-- v15 enforce the OLD values, so the UPDATE below would be rejected. Drop whichever CHECK
-- mentions budget_tier (name-agnostic), rewrite the data, then re-add it on the new values.
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'tenants'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%budget_tier%'
  LOOP
    EXECUTE format('ALTER TABLE tenants DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

-- tenants: budget_tier (scalar) + mission (text[]).
UPDATE tenants SET budget_tier = flow_value_en(budget_tier)
WHERE budget_tier IN ('hemat', 'menengah', 'leluasa');

ALTER TABLE tenants ADD CONSTRAINT tenants_budget_tier_check
  CHECK (budget_tier IN ('budget', 'mid', 'splurge'));

UPDATE tenants SET mission = (
  SELECT array_agg(flow_value_en(m) ORDER BY ord)
  FROM unnest(mission) WITH ORDINALITY AS u(m, ord)
)
WHERE mission IS NOT NULL AND mission <> '{}';

-- tenants.category: 3 Indonesian category values → English (the rest were already English).
-- Kept as its own UPDATE (not in flow_value_en) so it cannot touch quiz_input strings.
UPDATE tenants SET category = CASE category
    WHEN 'kopi' THEN 'coffee'
    WHEN 'indonesia' THEN 'indonesian'
    WHEN 'minuman' THEN 'drinks'
  END
WHERE category IN ('kopi', 'indonesia', 'minuman');

-- generations.quiz_input: rewrite every top-level string value.
UPDATE generations SET quiz_input = (
  SELECT jsonb_object_agg(
    k,
    CASE WHEN jsonb_typeof(v) = 'string'
      THEN to_jsonb(flow_value_en(v #>> '{}'))
      ELSE v
    END
  )
  FROM jsonb_each(quiz_input) AS e(k, v)
)
WHERE jsonb_typeof(quiz_input) = 'object' AND quiz_input <> '{}'::jsonb;

DROP FUNCTION flow_value_en(text);
