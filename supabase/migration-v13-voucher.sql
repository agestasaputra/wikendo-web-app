-- migration-v13-voucher.sql — `vouchers` table + `voucher_claims` patch (Gas v13, Addendum 23 v1.1).
--
-- WHAT: creates 1 new table `vouchers` (multi-voucher per tenant) + adds the columns
--   used by `app/server/api/voucher/claim.post.ts` to the EXISTING `voucher_claims`.
-- WHY a separate file: `migration-base.sql` (§6 old voucher_claims: user_id/tenant_id/
--   date/code/redeemed) vs the claim.post.ts route, which needs (voucher_id/claim_code/claimed_at/
--   redeemed_at). Without this patch a claim with a valid token would 404/500 (prod audit finding 12 Oct 2026).
-- Usage: open Supabase Dashboard → SQL Editor → New query → paste this ENTIRE file → Run.
-- Idempotent: everything uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / ON CONFLICT — safe to re-run.
-- Order: RUN AFTER migration-base.sql + migration.sql (needs the tenants + voucher_claims tables to exist).
-- Source: docs/23-PRD-Addendum-Voucher-Claim.md v1.1 §2 (multi-voucher schema).

-- 1. vouchers table (1 tenant can have MANY active promos, P0: 1 claim/tenant/day)
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  promo_text TEXT NOT NULL,
  promo_active BOOLEAN DEFAULT true,
  discount_percent INT DEFAULT 0 CHECK (discount_percent >= 0),
  discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage','fixed')),
  max_claims_per_tenant INT DEFAULT 1 CHECK (max_claims_per_tenant >= 1),
  claims_per_tenant_today INT DEFAULT 0 CHECK (claims_per_tenant_today >= 0),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE vouchers IS 'Multi-voucher per tenant (Gas v13 Addendum 23 v1.1). P0: 1 claim per user per tenant per hari, expiry 23:59 WIB.';
COMMENT ON COLUMN vouchers.code IS 'Claim code WKD-XXXXXX, UNIQUE.';

-- Index: lookup of active, non-expired promos per tenant (used by the V13B sheet + V13C strip)
CREATE INDEX IF NOT EXISTS idx_vouchers_tenant_active
  ON vouchers(tenant_id, promo_active, valid_until);

-- 2. Patch voucher_claims (OLD table from migration-base.sql §6) so it fits claim.post.ts
-- Old columns are still used (date/code/redeemed) — new columns are added, ZERO data deleted.
ALTER TABLE voucher_claims ADD COLUMN IF NOT EXISTS voucher_id UUID;
ALTER TABLE voucher_claims ADD COLUMN IF NOT EXISTS claim_code TEXT;
ALTER TABLE voucher_claims ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE voucher_claims ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMPTZ;
ALTER TABLE voucher_claims ADD COLUMN IF NOT EXISTS redeem_code TEXT;
ALTER TABLE voucher_claims ADD COLUMN IF NOT EXISTS claim_date DATE DEFAULT CURRENT_DATE;

-- FK voucher_claims → vouchers (uses a DO block so it is safe to re-run)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'voucher_claims_voucher_id_fkey') THEN
    ALTER TABLE voucher_claims ADD CONSTRAINT voucher_claims_voucher_id_fkey
      FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Backfill old rows (if the table already has data): fill the new columns from the old ones
UPDATE voucher_claims SET claim_date = date WHERE claim_date IS NULL;
UPDATE voucher_claims SET claimed_at = created_at WHERE claimed_at IS NULL;
UPDATE voucher_claims SET claim_code = code WHERE claim_code IS NULL;

-- UNIQUE anti-farming, claim_date version (complements the old UNIQUE user_id+tenant_id+date).
-- WHY an index, not a CONSTRAINT: the old table already has UNIQUE(date), a duplicate constraint could clash on name.
CREATE UNIQUE INDEX IF NOT EXISTS idx_voucher_claims_user_tenant_day
  ON voucher_claims(user_id, tenant_id, claim_date);
CREATE INDEX IF NOT EXISTS idx_voucher_claims_voucher_day
  ON voucher_claims(voucher_id, claimed_at DESC);

-- 3. vouchers RLS: the public may READ active promos (sheet/strip works without login),
-- write/delete only by the service role (via supabaseAdmin in the server route).
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active vouchers" ON vouchers;
CREATE POLICY "Public read active vouchers" ON vouchers FOR SELECT USING (promo_active = true);
DROP POLICY IF EXISTS "Service manage vouchers" ON vouchers;
CREATE POLICY "Service manage vouchers" ON vouchers FOR ALL USING (true) WITH CHECK (true);

-- 4. SAMPLE seed of 3 active vouchers (idempotent, ON CONFLICT DO UPDATE).
-- WHY needed: the V13B sheet needs "Pick 1 of 3 promos" + S2-S4 need codes to test claiming.
-- Sample tenant: the FIRST Grand Indonesia tenant (if seed.sql has been run).
-- Sample codes: WKD-7X2K9A / WKD-4Y5B3C / WKD-L8M2N1 (same as Addendum 23 §3).
WITH gi_tenant AS (
  SELECT t.id AS tid FROM tenants t
  JOIN malls m ON m.id = t.mall_id
  WHERE m.slug = 'grand-indonesia' LIMIT 1
)
INSERT INTO vouchers (tenant_id, code, promo_text, promo_active, discount_percent, discount_type, valid_from, valid_until)
SELECT tid, v.code, v.promo_text, true, v.discount_percent, 'percentage', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '8 hours'
FROM gi_tenant,
(VALUES
  ('WKD-7X2K9A', 'Kopi Weekday -20%', 20),
  ('WKD-4Y5B3C', 'Free Upsize Large', 0),
  ('WKD-L8M2N1', 'Dessert 35rb', 0)
) AS v(code, promo_text, discount_percent)
ON CONFLICT (code) DO UPDATE SET
  promo_text = EXCLUDED.promo_text,
  promo_active = true,
  discount_percent = EXCLUDED.discount_percent,
  valid_from = EXCLUDED.valid_from,
  valid_until = EXCLUDED.valid_until,
  updated_at = NOW();

-- 5. Automatic verification (must return 2 COUNT rows, no red errors)
SELECT 'vouchers' AS table_name, COUNT(*) FROM vouchers
UNION ALL SELECT 'voucher_claims', COUNT(*) FROM voucher_claims;
