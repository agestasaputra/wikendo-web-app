-- migration-base.sql — Wikendo BASE schema (DIRECT INTERPRETATION of docs/04-Database-Schema.md v1.1).
--
-- WHAT: creates the 6 base tables (user_profiles, user_quota, generations, favorites,
--   analytics_events, voucher_claims) + index + RLS + 4 functions.
-- WHY a separate file from migration.sql: base schema (place quiz + auth + voucher)
--   vs migration.sql (mall F&B Phase 8.1). Run THIS file FIRST, then migration.sql, then seed.sql.
-- Usage: paste this ENTIRE file into Supabase Dashboard → SQL Editor → New query → Run.
-- Idempotent: everything uses IF NOT EXISTS / DROP IF EXISTS / ON CONFLICT — safe to re-run.
-- Source: docs/04-Database-Schema.md (§ user_profiles, user_quota, generations,
--   favorites, analytics_events, functions, voucher_claims Addendum 09 v1.3).
-- Patch Addendum 09 v1.3 (7 Oct 2026): phone OPTIONAL (NULL = user skipped, valid).

-- 1. user_profiles (phone OPTIONAL since Addendum 09 v1.3)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT DEFAULT NULL,
  phone_verified BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
DROP INDEX IF EXISTS idx_user_profiles_phone;
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone) WHERE phone IS NOT NULL;
DO $$ BEGIN
  ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS phone_format_check;
  ALTER TABLE user_profiles ADD CONSTRAINT phone_format_check
    CHECK (phone IS NULL OR phone ~ '^\+62[0-9]{9,13}$');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
COMMENT ON TABLE user_profiles IS 'Extended user profile data';
COMMENT ON COLUMN user_profiles.phone IS 'OPTIONAL since Addendum 09 v1.3 (was mandatory). +62 format if filled, NULL if skipped. Phase 2: broadcast promo.';

-- 2. user_quota (PLACE quota for logged-in users: 2/day. Food uses mall_search_quota in migration.sql)
CREATE TABLE IF NOT EXISTS user_quota (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  quota_used INT DEFAULT 0 CHECK (quota_used >= 0),
  quota_limit INT DEFAULT 2 CHECK (quota_limit > 0),
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_quota_last_reset ON user_quota(last_reset_at);
COMMENT ON TABLE user_quota IS 'Daily generation quota tracking (PLACE 2/day)';
COMMENT ON COLUMN user_quota.quota_used IS 'Number of generations used today (0-2)';
COMMENT ON COLUMN user_quota.quota_limit IS 'Max generations per day (default 2)';

-- 3. generations (used by the place + food recommend APIs to store results)
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  quiz_input JSONB NOT NULL,
  recommendations JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_session_id ON generations(session_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_user_created ON generations(user_id, created_at DESC);
COMMENT ON TABLE generations IS 'All recommendation generation records';
COMMENT ON COLUMN generations.user_id IS 'NULL for anonymous users';
COMMENT ON COLUMN generations.session_id IS 'Anonymous tracking via cookie';
COMMENT ON COLUMN generations.quiz_input IS 'JSON: {mood, companion, budget, location, time} or QuizFoodInput + type';
COMMENT ON COLUMN generations.recommendations IS 'JSON array: [{name, category, reason, cost, location, time, confidence}]';

-- 4. favorites (Post-MVP, wishlist for logged-in users)
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
  recommendation_index INT NOT NULL,
  recommendation_data JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_unique ON favorites(user_id, generation_id, recommendation_index);
COMMENT ON TABLE favorites IS 'User-saved favorite recommendations';

-- 5. analytics_events (internal cost/usage tracking)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
COMMENT ON TABLE analytics_events IS 'Internal analytics and cost tracking';

-- 6. voucher_claims (NEW in Addendum 09 v1.3: claiming a voucher REQUIRES login, anti-farming)
-- ORDER NOTE: the FK to tenants is ADDED SEPARATELY (see §8b) because the tenants table
-- is created in migration.sql (Phase 8.1). This file can still be run FIRST without errors.
CREATE TABLE IF NOT EXISTS voucher_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  code TEXT NOT NULL,
  redeemed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, tenant_id, date)
);
CREATE INDEX IF NOT EXISTS idx_voucher_claims_user ON voucher_claims(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_voucher_claims_tenant ON voucher_claims(tenant_id, date DESC);
COMMENT ON TABLE voucher_claims IS 'Food voucher claims: 1 user = 1x per tenant per day (login REQUIRED, anti-farming)';

-- 7. RLS (Row-Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role can insert profiles" ON user_profiles;
CREATE POLICY "Service role can insert profiles" ON user_profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own quota" ON user_quota;
CREATE POLICY "Users can view own quota" ON user_quota FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role can manage quota" ON user_quota;
CREATE POLICY "Service role can manage quota" ON user_quota FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own generations" ON generations;
CREATE POLICY "Users can view own generations" ON generations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Anonymous can view session generations" ON generations;
CREATE POLICY "Anonymous can view session generations" ON generations FOR SELECT USING (user_id IS NULL AND session_id = current_setting('app.session_id', true));
DROP POLICY IF EXISTS "Service role can insert generations" ON generations;
CREATE POLICY "Service role can insert generations" ON generations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role only" ON analytics_events;
CREATE POLICY "Service role only" ON analytics_events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users view own claims" ON voucher_claims;
CREATE POLICY "Users view own claims" ON voucher_claims FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service manage claims" ON voucher_claims;
CREATE POLICY "Service manage claims" ON voucher_claims FOR ALL USING (true) WITH CHECK (true);

-- 8. Functions
CREATE OR REPLACE FUNCTION initialize_new_user(
  p_user_id UUID,
  p_phone TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_profiles (user_id, phone)
  VALUES (p_user_id, NULLIF(TRIM(COALESCE(p_phone, '')), ''))
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO user_quota (user_id, quota_used, quota_limit, last_reset_at)
  VALUES (p_user_id, 0, 2, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO mall_search_quota (user_id, date, used)
  VALUES (p_user_id, CURRENT_DATE, 0)
  ON CONFLICT (user_id, date) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION initialize_new_user IS 'Set up new user profile and quota (place 2 + food 5). Phone optional since Addendum 09 v1.3';

CREATE OR REPLACE FUNCTION check_and_increment_quota(p_user_id UUID)
RETURNS TABLE(allowed BOOLEAN, remaining INT, reset_at TIMESTAMPTZ) AS $$
DECLARE
  v_quota_used INT;
  v_quota_limit INT;
  v_last_reset TIMESTAMPTZ;
  v_hours_since_reset NUMERIC;
BEGIN
  SELECT quota_used, quota_limit, last_reset_at
  INTO v_quota_used, v_quota_limit, v_last_reset
  FROM user_quota WHERE user_id = p_user_id FOR UPDATE;

  v_hours_since_reset := EXTRACT(EPOCH FROM (NOW() - v_last_reset)) / 3600;

  IF v_hours_since_reset >= 24 THEN
    UPDATE user_quota SET quota_used = 0, last_reset_at = NOW() WHERE user_id = p_user_id;
    v_quota_used := 0;
    v_last_reset := NOW();
  END IF;

  IF v_quota_used >= v_quota_limit THEN
    RETURN QUERY SELECT FALSE, 0, (v_last_reset + INTERVAL '24 hours')::TIMESTAMPTZ;
  ELSE
    UPDATE user_quota SET quota_used = quota_used + 1 WHERE user_id = p_user_id;
    RETURN QUERY SELECT TRUE, v_quota_limit - v_quota_used - 1, (v_last_reset + INTERVAL '24 hours')::TIMESTAMPTZ;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION check_and_increment_quota IS 'Atomically check quota and increment if allowed';

CREATE OR REPLACE FUNCTION reset_daily_quotas()
RETURNS void AS $$
BEGIN
  UPDATE user_quota SET quota_used = 0, last_reset_at = NOW()
  WHERE last_reset_at < NOW() - INTERVAL '24 hours';
  INSERT INTO analytics_events (event_type, metadata)
  VALUES ('quota_reset', json_build_object('affected_users', (SELECT COUNT(*) FROM user_quota WHERE quota_used > 0)));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION reset_daily_quotas IS 'Reset all user quotas (called by cron)';

CREATE OR REPLACE FUNCTION get_user_history(p_user_id UUID, p_limit INT DEFAULT 10, p_offset INT DEFAULT 0)
RETURNS TABLE(id UUID, quiz_input JSONB, recommendations JSONB, created_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT g.id, g.quiz_input, g.recommendations, g.created_at
  FROM generations g WHERE g.user_id = p_user_id
  ORDER BY g.created_at DESC LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION get_user_history IS 'Get paginated generation history for user';

-- 8b. FK voucher_claims → tenants (ADDED AFTER migration.sql has been run).
-- WHY separate: the tenants table is created in migration.sql (Phase 8.1).
-- Once migration.sql has been run, run this block once (safe to re-run).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'voucher_claims_tenant_id_fkey') THEN
    ALTER TABLE voucher_claims ADD CONSTRAINT voucher_claims_tenant_id_fkey
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 9. Automatic verification (must return 6 COUNT rows, all numbers ≥ 0, no red errors)
SELECT 'user_profiles' AS table_name, COUNT(*) FROM user_profiles
UNION ALL SELECT 'user_quota', COUNT(*) FROM user_quota
UNION ALL SELECT 'generations', COUNT(*) FROM generations
UNION ALL SELECT 'favorites', COUNT(*) FROM favorites
UNION ALL SELECT 'analytics_events', COUNT(*) FROM analytics_events
UNION ALL SELECT 'voucher_claims', COUNT(*) FROM voucher_claims;
