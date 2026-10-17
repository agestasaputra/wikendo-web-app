# Database Schema - Weekend Planner MVP

**Version:** 1.1 (7 Oct 2026 — patch Addendum 09 v1.3: phone optional + voucher_claims)
**Date:** October 5, 2026 (original) + patch 7 Oct 2026
**Database:** PostgreSQL (Supabase)  
**Status:** Ready for Implementation + patch v1.3 LOCKED

---

## Overview

This document defines the complete database schema for Weekend Planner MVP, including tables, relationships, indexes, Row-Level Security (RLS) policies, and utility functions.

---

## Entity Relationship Diagram (Text)

```
┌─────────────────┐
│  auth.users     │ (Supabase built-in)
│  - id (PK)      │
│  - email        │
│  - created_at   │
└────────┬────────┘
         │
         │ 1:1
         ├──────────────────────┐
         │                      │
         ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│ user_profiles   │    │  user_quota     │
│  - user_id (PK) │    │  - user_id (PK) │
│  - phone        │    │  - quota_used   │
│  - created_at   │    │  - quota_limit  │
└─────────────────┘    │  - last_reset   │
                       └────────┬────────┘
                                │
                                │ 1:N
                                ▼
                       ┌─────────────────┐
                       │  generations    │
                       │  - id (PK)      │
                       │  - user_id (FK) │
                       │  - session_id   │
                       │  - quiz_input   │
                       │  - recommendations│
                       │  - created_at   │
                       └─────────────────┘
```

---

## Table Definitions

### 1. `auth.users` (Supabase Built-in)

**Purpose:** Core user authentication table managed by Supabase Auth

**Schema:**
```sql
-- This table is auto-created by Supabase
-- We don't modify it directly, but reference it via foreign keys

-- Key fields we care about:
-- id: UUID (primary key)
-- email: TEXT
-- encrypted_password: TEXT (hashed)
-- email_confirmed_at: TIMESTAMPTZ
-- created_at: TIMESTAMPTZ
-- updated_at: TIMESTAMPTZ
-- last_sign_in_at: TIMESTAMPTZ

-- OAuth users also have:
-- app_metadata: JSONB (provider info)
-- user_metadata: JSONB (custom fields like phone)
```

---

### 2. `user_profiles`

**Purpose:** Extended user information beyond auth (phone optional Phase 2, preferences)

**Schema (patch Addendum 09 v1.3, 7 Oct 2026 — phone DROP mandatory):**
```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT DEFAULT NULL,              -- OPTIONAL (was NOT NULL). NULL = user skips, valid.
  phone_verified BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes (partial: only filled rows are indexed, NULL is skipped automatically)
CREATE INDEX idx_user_profiles_phone ON user_profiles(phone) WHERE phone IS NOT NULL;

-- Constraints: +62 format ONLY when filled (NULL passes, empty '' REJECTED)
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS phone_format_check;
ALTER TABLE user_profiles
  ADD CONSTRAINT phone_format_check
  CHECK (phone IS NULL OR phone ~ '^\+62[0-9]{9,13}$');

-- Comments
COMMENT ON TABLE user_profiles IS 'Extended user profile data';
COMMENT ON COLUMN user_profiles.phone IS 'OPTIONAL since Addendum 09 v1.3 (was mandatory). +62 format if filled, NULL if skipped. Phase 2: broadcast promo.';
COMMENT ON COLUMN user_profiles.preferences IS 'JSON: {favorite_locations: [], notification_enabled: bool}';
```

**Existing migration (if the old table already exists):**
```sql
ALTER TABLE user_profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS phone_format_check;
ALTER TABLE user_profiles ADD CONSTRAINT phone_format_check
  CHECK (phone IS NULL OR phone ~ '^\+62[0-9]{9,13}$');
DROP INDEX IF EXISTS idx_user_profiles_phone;
CREATE INDEX idx_user_profiles_phone ON user_profiles(phone) WHERE phone IS NOT NULL;
```

**Sample Data:**
```sql
INSERT INTO user_profiles (user_id, phone, preferences) VALUES
(
  '550e8400-e29b-41d4-a716-446655440000',
  '+628123456789',
  '{"favorite_locations": ["Jakarta Selatan", "Bogor"], "notification_enabled": true}'
);
```

---

### 3. `user_quota`

**Purpose:** Track daily generation quota per user

**Schema:**
```sql
CREATE TABLE user_quota (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  quota_used INT DEFAULT 0 CHECK (quota_used >= 0),
  quota_limit INT DEFAULT 2 CHECK (quota_limit > 0),
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_quota_last_reset ON user_quota(last_reset_at);

-- Comments
COMMENT ON TABLE user_quota IS 'Daily generation quota tracking';
COMMENT ON COLUMN user_quota.quota_used IS 'Number of generations used today (0-2)';
COMMENT ON COLUMN user_quota.quota_limit IS 'Max generations per day (default 2)';
COMMENT ON COLUMN user_quota.last_reset_at IS 'When quota was last reset to 0';
```

**Sample Data:**
```sql
INSERT INTO user_quota (user_id, quota_used, quota_limit, last_reset_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 1, 2, NOW()),
('650e8400-e29b-41d4-a716-446655440001', 2, 2, NOW() - INTERVAL '12 hours');
```

---

### 4. `generations`

**Purpose:** Store all recommendation generation history

**Schema:**
```sql
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  quiz_input JSONB NOT NULL,
  recommendations JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_session_id ON generations(session_id);
CREATE INDEX idx_generations_created_at ON generations(created_at DESC);

-- Composite index for user history queries
CREATE INDEX idx_generations_user_created ON generations(user_id, created_at DESC);

-- Comments
COMMENT ON TABLE generations IS 'All recommendation generation records';
COMMENT ON COLUMN generations.user_id IS 'NULL for anonymous users';
COMMENT ON COLUMN generations.session_id IS 'Anonymous tracking via cookie';
COMMENT ON COLUMN generations.quiz_input IS 'JSON: {mood, companion, budget, location, time} (food: QuizFoodInput) + type';
COMMENT ON COLUMN generations.recommendations IS 'JSON array: [{name, category, reason, cost, location, time, confidence}]';
```

**Sample Data:**
```sql
INSERT INTO generations (user_id, session_id, quiz_input, recommendations) VALUES
(
  '550e8400-e29b-41d4-a716-446655440000',
  NULL,
  '{
    "mood": "relax",
    "companion": "couple",
    "budget": "mid",
    "location": "south-jakarta",
    "time": "day",
    "type": "place"
  }'::jsonb,
  '[
    {
      "name": "Taman Menteng",
      "category": "outdoor",
      "reason": "Cocok untuk quality time berdua dengan suasana tenang di tengah kota",
      "estimated_cost": "Rp 50rb - 100rb",
      "location_area": "Menteng, Jakarta Pusat",
      "best_time": "Sabtu sore (16:00-18:00)",
      "confidence": "high"
    }
  ]'::jsonb
);
```

---

### 5. `favorites` (Post-MVP)

**Purpose:** Save favorite recommendations

**Schema:**
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
  recommendation_index INT NOT NULL,
  recommendation_data JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_created_at ON favorites(created_at DESC);

-- Prevent duplicate favorites
CREATE UNIQUE INDEX idx_favorites_unique ON favorites(user_id, generation_id, recommendation_index);

-- Comments
COMMENT ON TABLE favorites IS 'User-saved favorite recommendations';
COMMENT ON COLUMN favorites.recommendation_index IS 'Which of the 5 recommendations (0-4)';
COMMENT ON COLUMN favorites.recommendation_data IS 'Snapshot of recommendation at save time';
```

---

### 6. `analytics_events` (Internal Tracking)

**Purpose:** Server-side event logging for cost/usage analysis

**Schema:**
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);

-- Partition by month (optional, for large scale)
-- CREATE TABLE analytics_events_2026_10 PARTITION OF analytics_events
--   FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

-- Comments
COMMENT ON TABLE analytics_events IS 'Internal analytics and cost tracking';
COMMENT ON COLUMN analytics_events.event_type IS 'e.g., llm_generation, quota_exhausted, error';
COMMENT ON COLUMN analytics_events.metadata IS 'Event-specific data: {response_time_ms, cost_estimate, error_message}';
```

**Sample Data:**
```sql
INSERT INTO analytics_events (event_type, user_id, metadata) VALUES
(
  'llm_generation',
  '550e8400-e29b-41d4-a716-446655440000',
  '{
    "model": "hermes-combo",
    "response_time_ms": 2340,
    "prompt_tokens": 650,
    "completion_tokens": 450,
    "cost_estimate_usd": 0.0012,
    "success": true
  }'::jsonb
);
```

---

## Row-Level Security (RLS) Policies

### Enable RLS on All Tables

```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
```

---

### Policies for `user_profiles`

```sql
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can insert (during registration)
CREATE POLICY "Service role can insert profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (true); -- Will be called from server with service key
```

---

### Policies for `user_quota`

```sql
-- Users can view their own quota
CREATE POLICY "Users can view own quota"
  ON user_quota FOR SELECT
  USING (auth.uid() = user_id);

-- Server can manage quota (via service role)
CREATE POLICY "Service role can manage quota"
  ON user_quota FOR ALL
  USING (true);
```

---

### Policies for `generations`

```sql
-- Users can view their own generations
CREATE POLICY "Users can view own generations"
  ON generations FOR SELECT
  USING (auth.uid() = user_id);

-- Anonymous users can view their session generations
CREATE POLICY "Anonymous can view session generations"
  ON generations FOR SELECT
  USING (
    user_id IS NULL AND
    session_id = current_setting('app.session_id', true)
  );

-- Server can insert generations
CREATE POLICY "Service role can insert generations"
  ON generations FOR INSERT
  WITH CHECK (true);
```

---

### Policies for `favorites`

```sql
-- Users can manage their own favorites
CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  USING (auth.uid() = user_id);
```

---

### Policies for `analytics_events`

```sql
-- Only service role can access (internal use only)
CREATE POLICY "Service role only"
  ON analytics_events FOR ALL
  USING (true);
```

---

## Database Functions

### 1. Initialize New User

**Purpose:** Called after registration to set up profile + quota (patch Addendum 09 v1.3: phone optional)

```sql
CREATE OR REPLACE FUNCTION initialize_new_user(
  p_user_id UUID,
  p_phone TEXT DEFAULT NULL   -- OPTIONAL since Addendum 09 v1.3 (was mandatory)
)
RETURNS void AS $$
BEGIN
  -- Create profile (phone may be NULL = user skips)
  INSERT INTO user_profiles (user_id, phone)
  VALUES (p_user_id, NULLIF(TRIM(COALESCE(p_phone, '')), ''))
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Initialize place quota (2/day, PRD v2.0)
  INSERT INTO user_quota (user_id, quota_used, quota_limit, last_reset_at)
  VALUES (p_user_id, 0, 2, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  -- Initialize food quota for TODAY (5/day, Addendum 07 v1.1)
  INSERT INTO mall_search_quota (user_id, date, used)
  VALUES (p_user_id, CURRENT_DATE, 0)
  ON CONFLICT (user_id, date) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION initialize_new_user IS 'Set up new user profile and quota (place 2 + food 5). Phone optional since Addendum 09 v1.3';
```

**Usage:**
```sql
SELECT initialize_new_user('550e8400-e29b-41d4-a716-446655440000', NULL); -- Google OAuth without phone
SELECT initialize_new_user('550e8400-e29b-41d4-a716-446655440000', '+628123456789'); -- email + phone filled in
```

---

### 2. Check and Increment Quota

**Purpose:** Atomic check + increment in one transaction

```sql
CREATE OR REPLACE FUNCTION check_and_increment_quota(
  p_user_id UUID
)
RETURNS TABLE(allowed BOOLEAN, remaining INT, reset_at TIMESTAMPTZ) AS $$
DECLARE
  v_quota_used INT;
  v_quota_limit INT;
  v_last_reset TIMESTAMPTZ;
  v_hours_since_reset NUMERIC;
BEGIN
  -- Get current quota
  SELECT quota_used, quota_limit, last_reset_at
  INTO v_quota_used, v_quota_limit, v_last_reset
  FROM user_quota
  WHERE user_id = p_user_id
  FOR UPDATE; -- Lock row
  
  -- Check if needs reset (>24 hours since last reset)
  v_hours_since_reset := EXTRACT(EPOCH FROM (NOW() - v_last_reset)) / 3600;
  
  IF v_hours_since_reset >= 24 THEN
    -- Reset quota
    UPDATE user_quota
    SET quota_used = 0, last_reset_at = NOW()
    WHERE user_id = p_user_id;
    
    v_quota_used := 0;
    v_last_reset := NOW();
  END IF;
  
  -- Check if quota available
  IF v_quota_used >= v_quota_limit THEN
    -- Quota exhausted
    RETURN QUERY SELECT 
      FALSE, 
      0, 
      (v_last_reset + INTERVAL '24 hours')::TIMESTAMPTZ;
  ELSE
    -- Increment quota
    UPDATE user_quota
    SET quota_used = quota_used + 1
    WHERE user_id = p_user_id;
    
    RETURN QUERY SELECT 
      TRUE, 
      v_quota_limit - v_quota_used - 1, 
      (v_last_reset + INTERVAL '24 hours')::TIMESTAMPTZ;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_and_increment_quota IS 'Atomically check quota and increment if allowed';
```

**Usage:**
```sql
SELECT * FROM check_and_increment_quota('550e8400-e29b-41d4-a716-446655440000');
-- Returns: (allowed, remaining, reset_at)
-- Example: (true, 1, '2026-10-06 00:00:00+00')
```

---

### 3. Reset Daily Quotas (Cron Job)

**Purpose:** Scheduled daily reset at 00:00 WIB (UTC+7)

```sql
CREATE OR REPLACE FUNCTION reset_daily_quotas()
RETURNS void AS $$
BEGIN
  UPDATE user_quota
  SET quota_used = 0,
      last_reset_at = NOW()
  WHERE last_reset_at < NOW() - INTERVAL '24 hours';
  
  -- Log reset event
  INSERT INTO analytics_events (event_type, metadata)
  VALUES (
    'quota_reset',
    json_build_object(
      'affected_users', (SELECT COUNT(*) FROM user_quota WHERE quota_used > 0)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reset_daily_quotas IS 'Reset all user quotas (called by cron)';
```

**Schedule with pg_cron:**
```sql
-- Install pg_cron extension (Supabase has it)
-- Run at 00:00 UTC (17:00 WIB, adjust to 17:00 for 00:00 WIB next day)
SELECT cron.schedule(
  'reset-daily-quotas',
  '0 17 * * *', -- 00:00 WIB = 17:00 UTC
  $$SELECT reset_daily_quotas()$$
);
```

---

### 4. Get User Generation History

**Purpose:** Fetch paginated history for user

```sql
CREATE OR REPLACE FUNCTION get_user_history(
  p_user_id UUID,
  p_limit INT DEFAULT 10,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  quiz_input JSONB,
  recommendations JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT g.id, g.quiz_input, g.recommendations, g.created_at
  FROM generations g
  WHERE g.user_id = p_user_id
  ORDER BY g.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_history IS 'Get paginated generation history for user';
```

**Usage:**
```sql
SELECT * FROM get_user_history('550e8400-e29b-41d4-a716-446655440000', 5, 0);
```

---

## Utility Queries

### Check Quota Status
```sql
SELECT 
  u.email,
  q.quota_used,
  q.quota_limit,
  q.last_reset_at,
  (NOW() - q.last_reset_at) AS time_since_reset,
  CASE 
    WHEN q.quota_used >= q.quota_limit THEN 'EXHAUSTED'
    ELSE 'AVAILABLE'
  END AS status
FROM user_quota q
JOIN auth.users u ON u.id = q.user_id
ORDER BY q.last_reset_at DESC;
```

---

### Daily Generation Stats
```sql
SELECT 
  DATE(created_at) AS date,
  COUNT(*) AS total_generations,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(*) FILTER (WHERE user_id IS NULL) AS anonymous_gens,
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) AS registered_gens
FROM generations
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

### Top Users by Generation Count
```sql
SELECT 
  u.email,
  COUNT(g.id) AS total_generations,
  MAX(g.created_at) AS last_generation
FROM generations g
JOIN auth.users u ON u.id = g.user_id
WHERE g.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.email
ORDER BY total_generations DESC
LIMIT 10;
```

---

### LLM Cost Estimate (Last 30 Days)
```sql
SELECT 
  DATE(created_at) AS date,
  COUNT(*) AS generations,
  COUNT(*) * 0.001 AS estimated_cost_usd
FROM generations
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## Migrations

### Initial Setup Script

```sql
-- Run this in Supabase SQL Editor

-- 1. Create tables
CREATE TABLE user_profiles (...); -- See above
CREATE TABLE user_quota (...);
CREATE TABLE generations (...);
CREATE TABLE favorites (...);
CREATE TABLE analytics_events (...);

-- 2. Create indexes
CREATE INDEX idx_user_profiles_phone ON user_profiles(phone);
-- ... (all indexes from above)

-- 3. Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ... (all tables)

-- 4. Create policies
CREATE POLICY "Users can view own profile" ...;
-- ... (all policies)

-- 5. Create functions
CREATE OR REPLACE FUNCTION initialize_new_user(...) ...;
-- ... (all functions)

-- 6. Schedule cron job
SELECT cron.schedule('reset-daily-quotas', '0 17 * * *', ...);
```

---

### Rollback Script

```sql
-- Drop in reverse order
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS generations CASCADE;
DROP TABLE IF EXISTS user_quota CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

DROP FUNCTION IF EXISTS initialize_new_user CASCADE;
DROP FUNCTION IF EXISTS check_and_increment_quota CASCADE;
DROP FUNCTION IF EXISTS reset_daily_quotas CASCADE;
DROP FUNCTION IF EXISTS get_user_history CASCADE;

SELECT cron.unschedule('reset-daily-quotas');
```

---

## Backup & Maintenance

### Daily Backup (Supabase Automatic)
- Supabase provides automatic daily backups (free tier: 7 days retention)
- Manual backup: `pg_dump` from local machine

### Manual Backup
```bash
# Export schema + data
pg_dump -h db.xxx.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f wikendo-backup-$(date +%Y%m%d).dump

# Restore
pg_restore -h db.xxx.supabase.co \
  -U postgres \
  -d postgres \
  wikendo-backup-20261005.dump
```

### Vacuum & Analyze (Automatic)
```sql
-- Supabase runs auto-vacuum, but can manually trigger:
VACUUM ANALYZE generations;
VACUUM ANALYZE analytics_events;
```

---

## Performance Monitoring

### Slow Queries
```sql
-- Enable pg_stat_statements extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%generations%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Table Sizes
```sql
SELECT 
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS data_size,
  pg_size_pretty(pg_indexes_size(relid)) AS index_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

---

## Addendum 07 v1.1 (Approved 6 Oct 2026) — Mall F&B Tables

### 7. `malls`
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
```

### 8. `tenants`
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id UUID NOT NULL REFERENCES malls(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  floor TEXT NOT NULL,
  halal BOOLEAN DEFAULT true,
  budget_tier TEXT NOT NULL CHECK (budget_tier IN ('budget','mid','splurge')),
  price_min INT,  -- integer rupiah (UI formats "Rp 30-80rb")
  price_max INT,
  kids_friendly BOOLEAN DEFAULT false,
  mission TEXT[] DEFAULT '{}',
  hype_tiktok BOOLEAN DEFAULT false,
  is_open BOOLEAN DEFAULT true,
  maps_url TEXT,
  -- Data quality metadata columns (NULL patch, approved 6 Oct 2026):
  data_source TEXT NOT NULL DEFAULT 'curated'
    CHECK (data_source IN ('curated','scrape','deep_research','manual')),
  verified_at TIMESTAMPTZ,   -- NULL = not yet field-verified
  needs_survey BOOLEAN NOT NULL DEFAULT false,  -- TRUE = some field is NULL, queued for survey
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tenants_mall ON tenants(mall_id);
CREATE INDEX idx_tenants_filter ON tenants(mall_id, budget_tier, halal) WHERE is_open = true;
CREATE INDEX idx_tenants_needs_survey ON tenants(mall_id) WHERE needs_survey = true;
```

**NULL / tri-state RULE (approved 6 Oct 2026):** `halal` / `kids_friendly` / `hype_tiktok`
may be `NULL` = not yet researched (NOT `false`). The `halal_only` / `kids` filters use `.eq(true)`
→ `NULL` rows are automatically excluded (no overclaiming). The UI shows a third badge
❓ Not yet verified + 📋 Needs survey. Details of the valid-vs-survey audit: `supabase/AUDIT.md`.

### 8b. `raw_scrape` (staging scrape — patch approved 6 Oct 2026)
```sql
-- Raw holding area BEFORE entering tenants. Dirty data may come in, but city is REQUIRED
-- for the Jabodetabek gate. Flow: scrape → raw_scrape → city GATE → per-mall parser → tenants.
CREATE TABLE raw_scrape (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_name TEXT NOT NULL,
  city TEXT NOT NULL,   -- non-Jabodetabek → status='rejected', do not normalize
  tenant_name TEXT NOT NULL,
  floor TEXT,
  category TEXT,
  source_url TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected'))
);
-- LOCKED scope: Jakarta (+variants), Bogor, Depok, Tangerang (+Selatan), Bekasi.
-- NOT public-read (dirty staging data, service role only).
```

### 9. `mall_search_quota`
```sql
CREATE TABLE mall_search_quota (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  used INT DEFAULT 0 CHECK (used >= 0),
  PRIMARY KEY (user_id, date)
);
-- Anonymous: cookie food_quota_used (max 2). Login: 5/day.
```

### 10. `voucher_claims` (NEW — Addendum 09 v1.3, 7 Oct 2026: voucher claim REQUIRES login)

**Purpose:** 1 user = 1 claim per tenant per day (anti-farming of vouchers with fresh anonymous accounts).
WHY is it needed? A voucher = the tenant's money, 1 fake claim = a real loss. Small table, $0 cost.

```sql
CREATE TABLE voucher_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- login REQUIRED, no anon
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  code TEXT NOT NULL,                       -- code shown to the cashier, e.g. "WKD-7X2K9A"
  redeemed BOOLEAN DEFAULT false,           -- TRUE after the cashier validates (Phase 2)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, tenant_id, date)          -- prevents double-claiming on the same day
);

CREATE INDEX idx_voucher_claims_user ON voucher_claims(user_id, date DESC);
CREATE INDEX idx_voucher_claims_tenant ON voucher_claims(tenant_id, date DESC);
```

### Additional RLS
```sql
ALTER TABLE malls ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE mall_search_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_scrape ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read malls" ON malls FOR SELECT USING (true);
CREATE POLICY "Public read tenants" ON tenants FOR SELECT USING (true);
CREATE POLICY "Users view own food quota" ON mall_search_quota FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service manage food quota" ON mall_search_quota FOR ALL USING (true);
CREATE POLICY "Users view own claims" ON voucher_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service manage claims" ON voucher_claims FOR ALL USING (true);
-- raw_scrape: NOT public-read. Service role only (bypass RLS via supabaseAdmin).
CREATE POLICY "No public access raw_scrape" ON raw_scrape FOR SELECT USING (false);
CREATE POLICY "Service manage raw_scrape" ON raw_scrape FOR ALL USING (true);
```

### Seed
CSV `data/tenants-seed.csv` 200 rows (5 malls x 40). Generate via
`cd supabase && python3 generate_seed.py` → `seed.sql` (do not edit manually).
Valid-vs-survey audit: `supabase/AUDIT.md`.

---

**Document Status:** READY for implementation  
**Next Action:** Execute setup script in Supabase dashboard  
**Review Schedule:** After 1000 generations, review indexes and optimize
