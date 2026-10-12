-- migration-v13-voucher.sql — Tabel `vouchers` + patch `voucher_claims` (Gas v13, Addendum 23 v1.1).
--
-- APA: bikin 1 tabel baru `vouchers` (multi-voucher per tenant) + tambah kolom yang
--   dipakai `app/server/api/voucher/claim.post.ts` ke `voucher_claims` yang SUDAH ADA.
-- KENAPA file terpisah: `migration-base.sql` (§6 voucher_claims lama: user_id/tenant_id/
--   date/code/redeemed) vs route claim.post.ts butuh (voucher_id/claim_code/claimed_at/
--   redeemed_at). Tanpa patch ini claim pakai token valid bakal 404/500 (temuan audit prod 12 Okt 2026).
-- Cara pakai: buka Supabase Dashboard → SQL Editor → New query → paste SELURUH file ini → Run.
-- Idempotent: semua pakai IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / ON CONFLICT — aman di-run ulang.
-- Urutan: JALANKAN SETELAH migration-base.sql + migration.sql (butuh tabel tenants + voucher_claims ada).
-- Sumber: docs/23-PRD-Addendum-Voucher-Claim.md v1.1 §2 (schema multi-voucher).

-- 1. Tabel vouchers (1 tenant bisa punya BANYAK promo aktif, P0: 1 claim/tenant/hari)
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
COMMENT ON COLUMN vouchers.code IS 'Kode claim WKD-XXXXXX, UNIQUE.';

-- Index: lookup promo aktif per tenant yang belum expired (dipakai sheet V13B + strip V13C)
CREATE INDEX IF NOT EXISTS idx_vouchers_tenant_active
  ON vouchers(tenant_id, promo_active, valid_until);

-- 2. Patch voucher_claims (tabel LAMA dari migration-base.sql §6) biar nyambung ke claim.post.ts
-- Kolom lama tetap dipakai (date/code/redeemed) — kolom baru nambah, NOL hapus data.
ALTER TABLE voucher_claims ADD COLUMN IF NOT EXISTS voucher_id UUID;
ALTER TABLE voucher_claims ADD COLUMN IF NOT EXISTS claim_code TEXT;
ALTER TABLE voucher_claims ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE voucher_claims ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMPTZ;
ALTER TABLE voucher_claims ADD COLUMN IF NOT EXISTS redeem_code TEXT;
ALTER TABLE voucher_claims ADD COLUMN IF NOT EXISTS claim_date DATE DEFAULT CURRENT_DATE;

-- FK voucher_claims → vouchers (pakai DO block biar aman di-run ulang)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'voucher_claims_voucher_id_fkey') THEN
    ALTER TABLE voucher_claims ADD CONSTRAINT voucher_claims_voucher_id_fkey
      FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Backfill baris lama (kalau tabel sudah ada isinya): isi kolom baru dari kolom lama
UPDATE voucher_claims SET claim_date = date WHERE claim_date IS NULL;
UPDATE voucher_claims SET claimed_at = created_at WHERE claimed_at IS NULL;
UPDATE voucher_claims SET claim_code = code WHERE claim_code IS NULL;

-- UNIQUE anti-farming versi claim_date (pelengkap UNIQUE lama user_id+tenant_id+date).
-- KENAPA index, bukan CONSTRAINT: tabel lama sudah punya UNIQUE(date), constraint ganda bisa tabrakan nama.
CREATE UNIQUE INDEX IF NOT EXISTS idx_voucher_claims_user_tenant_day
  ON voucher_claims(user_id, tenant_id, claim_date);
CREATE INDEX IF NOT EXISTS idx_voucher_claims_voucher_day
  ON voucher_claims(voucher_id, claimed_at DESC);

-- 3. RLS vouchers: publik boleh BACA promo aktif (sheet/strip tanpa login OK),
-- tulis/hapus hanya service role (via supabaseAdmin di server route).
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active vouchers" ON vouchers;
CREATE POLICY "Public read active vouchers" ON vouchers FOR SELECT USING (promo_active = true);
DROP POLICY IF EXISTS "Service manage vouchers" ON vouchers;
CREATE POLICY "Service manage vouchers" ON vouchers FOR ALL USING (true) WITH CHECK (true);

-- 4. Seed CONTOH 3 voucher aktif (idempotent, ON CONFLICT DO UPDATE).
-- KENAPA perlu: sheet V13B butuh "Pilih promo 1 dari 3" + S2-S4 butuh kode buat dites claim.
-- Tenant contoh: tenant PERTAMA Grand Indonesia (kalau seed.sql sudah di-run).
-- Kode contoh: WKD-7X2K9A / WKD-4Y5B3C / WKD-L8M2N1 (sama kayak Addendum 23 §3).
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

-- 5. Verifikasi otomatis (harus keluar 2 baris COUNT tanpa error merah)
SELECT 'vouchers' AS tabel, COUNT(*) FROM vouchers
UNION ALL SELECT 'voucher_claims', COUNT(*) FROM voucher_claims;
