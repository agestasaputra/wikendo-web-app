-- supabase/migration-v14-rename-flows.sql — Rename the flow values in generations.quiz_input.type.
-- WHAT: 'tempat' → 'place' and 'makan' → 'food' (codebase identifiers renamed to English, v14).
-- WHY: the recommend server now writes type 'place'/'food'; old rows are aligned so
--   per-mode filters/analytics stay consistent. Idempotent — safe to run repeatedly.
-- EXAMPLE: Supabase SQL editor, or `psql "$DATABASE_URL" -f migration-v14-rename-flows.sql`.

UPDATE generations
SET quiz_input = jsonb_set(quiz_input, '{type}', to_jsonb('place'::text))
WHERE quiz_input ->> 'type' = 'tempat';

UPDATE generations
SET quiz_input = jsonb_set(quiz_input, '{type}', to_jsonb('food'::text))
WHERE quiz_input ->> 'type' = 'makan';
