# 23-PRD-Addendum-Voucher-Claim — Integrasi Klaim Voucher Offline (Show-to-Cashier)

**Version:** 1.0 (11 Okt 2026)
**Status:** PROPOSED — nunggu "gas" Agesta (solo founder: gas = LOCKED langsung eksekusi)
**Owner:** Agesta (Solo Founder)
**Trigger:** request Agesta 11 Okt malam — "best practice klaim voucher" + "buatkan backlog/todolist eksekusi"

> **APA:** ubah tombol Buka (sekarang cuma wall login) jadi klaim beneran: klik → kode unik → tunjukin ke kasir → kasir validasi.
> **KENAPA:** voucher = duit tenant. Tanpa kode unik + expiry + 1x pakai, voucher bocor via screenshot/WA dalam sehari. Pola ini yang dipakai Klook/Chope/resto-week buat offline — bukan auto-discount kayak GrabFood (butuh integrasi POS, mahal, jangan sekarang).
> **Contoh:** hero Kopi Kekinian GI L2 → Buka → `WKD-7X2K9A` berlaku s/d 23:59 WIB → kasir input di `/t/kopi-kekinian` + PIN → `redeemed`.

---

## 1. Keputusan kunci (LOCK kalau gas)

1. **Pola = kode unik per klaim (show-to-cashier).** Bukan auto-discount, bukan kode statis per tenant.
2. **Klaim WAJIB login** (dipertahankan). Tambah: email verified + rate limit, bukan KTP/CAPTCHA (bunuh conversion).
3. **Kebenaran di DB server-side,** bukan cookie. Cookie gampang dihapus (bukti: trik testing kemarin).
4. **Expiry pendek:** hari itu 23:59 WIB. Alasan bisnis: dorong kunjungan hari ini + batasi exposure.
5. **P0 tanpa app kasir.** Validasi P0 = trust-based (kasir cocokkan kode + nama akun). App validasi PIN baru P1 (begitu ada 1 tenant aktif/bayar).
6. **Data test wajib flag `test:true`** — jangan campur traction (nyambung concern testing kemarin).

---

## 2. Status sekarang (gap jujur)

- `app/pages/result-makan.vue:107-109` — `claim()` cuma set `claimNote` ("Login 10 detik..."). NOL fetch, NOL kode, NOL redirect.
- `isLoggedIn` masih hardcode false → user login pun tetap kena wall. **Ini blocker semua slice di bawah (S1).**
- `voucher_claims` SUDAH ada spek (Schema v1.1 + API v1.1 + Checklist 8.1/8.2/8.3) tapi tabel BELUM dibuat, API BELUM ada, UI kode BELUM ada.

---

## 3. Backlog eksekusi (urut — jangan loncat)

### S1 — Auth session server-side (BLOCKER, wajib pertama) — *~2 jam*
- [ ] S1.1 `useAuth.ts` sudah ada (AS6) → tambah `getSession()` SSR-safe + `isLoggedIn` real ganti hardcode false.
- [ ] S1.2 Server helper `requireUser(event)` — baca JWT dari cookie Supabase → verify → return `user_id` / throw 401.
- [ ] S1.3 `claim()` di `result-makan.vue` baca session: anon → note login (tetap), login → lanjut S3.
- **Accept:** user login tap Buka → NOL wall, masuk ke API (atau 404 API belum ada = proof wiring jalan).
- **Test:** `auth-session.test.ts` — anon 401, login 200 (mock JWT).
- **File:** `app/composables/useAuth.ts`, `app/server/utils/auth.ts`, `app/pages/result-makan.vue`.

### S2 — Tabel `voucher_claims` + RLS — *~30 mnt*
- [ ] S2.1 Migration SQL (ikut spek Schema v1.1 — JANGAN ubah tanpa Addendum):
```sql
CREATE TABLE voucher_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  code TEXT NOT NULL UNIQUE,
  redeemed BOOLEAN DEFAULT false,
  test BOOLEAN DEFAULT false,           -- BARU v23: flag testing, exclude traction
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,      -- BARU v23: hari itu 23:59 WIB
  redeemed_at TIMESTAMPTZ,
  UNIQUE (user_id, tenant_id, date)
);
CREATE INDEX idx_voucher_user ON voucher_claims(user_id, date DESC);
CREATE INDEX idx_voucher_tenant ON voucher_claims(tenant_id, date DESC);
CREATE INDEX idx_voucher_code ON voucher_claims(code);
ALTER TABLE voucher_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own claims" ON voucher_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service manage claims" ON voucher_claims FOR ALL USING (true);
```
- [ ] S2.2 Run di Supabase + verify `select * from voucher_claims limit 1` jalan.
- [ ] S2.3 Tambah kolom `pin TEXT` di `tenants` (buat P1, nullable sekarang — biar migration sekali jalan).
- **Accept:** insert manual 1 row sukses, double (user+tenant+date) ditolak UNIQUE, anon SELECT cuma lihat miliknya.
- **File:** `supabase/migration-voucher.sql`, `docs/04-Database-Schema.md` (patch §10).

### S3 — `POST /api/voucher/claim` (P0 inti) — *~1.5 jam*
- [ ] S3.1 Contract (ikut API v1.1 + tambah):
  - Req: `{ tenant_id }` (+ `test:true` kalau dari fixture testing).
  - Auth: anon → `401 { code:'LOGIN_REQUIRED' }`.
  - Flow: requireUser → cek tenant ada + promo aktif → cek belum klaim hari ini (user+tenant+today) → generate `WKD-XXXXXX` (6 char A-Z0-9 tanpa 0/O/1/I biar gampang dibaca kasir) → insert (expires = hari ini 23:59 WIB) → return `{ success, code, tenant_name, expires_at, cara_pakai:'Tunjukin ke kasir' }`.
  - Double → `409 { code:'ALREADY_CLAIMED', existing_code }`.
  - Rate limit: max 3 klaim/hari/user → `429 { code:'RATE_LIMITED' }`.
- [ ] S3.2 Generate kode server-side ONLY (jangan di frontend — bisa di-fork).
- [ ] S3.3 Analytics `voucher_claimed { tenant_id, mall_slug }`.
- **Accept:** login klaim → 200 + kode; anon → 401; klaim kedua hari sama → 409 + kode SAMA dikembalikan (bukan kode baru); klaim ke-4 hari itu → 429.
- **Test (TDD):** `voucher-claim.test.ts` — RED: 401/200/409/429 + format kode + expiry WIB.
- **File:** `app/server/api/voucher/claim.post.ts`, `app/server/utils/voucher.ts` (generate + expiry), `app/tests/voucher-claim.test.ts`.

### S4 — UI gift → bottom-sheet kode (P0) — *~1.5 jam*
- [ ] S4.1 `claim()` rewrite: idle → spinner (`animate-spin` + `:disabled` + early-return, SOP UX) → POST claim → sukses: kartu expand (kode GEDE 28px + countdown "berlaku s/d 23:59" + tenant + tombol "Tunjukin ke kasir" + note "1 kode = 1 transaksi, screenshot tetap 1x pakai") → gagal: 401 → note login (tetap), 409 → tampilkan kode lama + "Lu udah klaim hari ini", 429 → "Besok lagi ya".
- [ ] S4.2 State `claimed` diisi kode real (sekarang string kosong) + `claimNote` buat error/wall.
- [ ] S4.3 Token ikut F1b/gift lock (paper/ink/lime/rose) — NOL warna baru.
- **Accept:** E2E HP: tap Buka → spinner → kode muncul → refresh halaman → kode SAMA (dari API, bukan random baru).
- **Test (TDD):** extend `result-makan-voucher.test.ts` — assert ada slot kode + state 401/409/429.
- **File:** `app/pages/result-makan.vue`, `app/tests/result-makan-voucher.test.ts`.

### S5 — Validasi kasir + PIN (P1 — jalanin pas ada 1 tenant aktif) — *~3 jam*
- [ ] S5.1 `GET/POST /t/:slug` halaman kasir: input kode → cek `issued` + belum expired → tombol "Tukarkan" + PIN 4-digit → status `redeemed` + `redeemed_at`.
- [ ] S5.2 Kode yang sama diklaim kedua → "Sudah dipakai" (screenshot-sharing mati).
- [ ] S5.3 PIN per tenant: generate saat onboarding, kirim via WA ke owner, simpan hash (jangan plaintext).
- [ ] S5.4 Expired job: cron harian tandai `expired` yang lewat 23:59 (atau computed saat baca — pilih computed dulu, $0).
- **Accept:** kasir tukar kode → `redeemed` true; foto kode ke HP kedua → ditolak.
- **File:** `app/pages/t/[slug].vue`, `app/server/api/voucher/redeem.post.ts`.

### S6 — Dashboard mini tenant (P2 — baru kalau revenue) — *~4 jam*
- [ ] S6.1 Owner lihat: diklaim vs ditebus per hari, jam rame, cabang mana.
- [ ] S6.2 Bahan jualan: "Bayar Rp X/bln → Y pengunjung terukur".
- **JANGAN sekarang.** Catat aja biar nggak scope-creep.

---

## 4. Aturan anti-farming (proporsional)

**Wajib P0:** login + 1 tenant 1x/hari (UNIQUE) + max 3 klaim/hari + expiry 23:59 + kode server-side + log `user_id`.
**P1:** PIN kasir + status `redeemed` + flag `test`.
**JANGAN dulu:** KTP, fingerprint, CAPTCHA, deteksi emulator.

---

## 5. Analitik (wajib tiap klaim)

- `voucher_claimed { tenant_id, mall_slug }` — ukur sinyal monetisasi.
- `login_prompted { reason:'claim_voucher' }` — ukur wall conversion.
- `voucher_redeemed { tenant_id }` (P1) — ukur redeem beneran buat bahan jualan ke tenant.

---

## 6. Testing plan (nyambung opsi testing kemarin)

- Unit: format kode (tanpa 0/O/1/I), expiry = 23:59 WIB, UNIQUE, RLS.
- API: matrix 401/200/409/429 + `test:true` exclude dari count traction.
- E2E manual (pakai Opsi A incognito — NOL coding): anon wall → login → klaim → double 409 → besok reset.
- Kasir P1: 2 HP (1 klaim, 1 tukar, 1 replay screenshot → tolak).

---

## 7. Estimasi total

| Slice | Waktu |
|---|---|
| S1 auth session (blocker) | ~2 jam |
| S2 tabel + RLS | ~30 mnt |
| S3 API claim | ~1.5 jam |
| S4 UI kode | ~1.5 jam |
| **Total P0 (siap klaim beneran)** | **~5.5 jam** |
| S5 kasir PIN (P1) | ~3 jam |
| S6 dashboard (P2) | ~4 jam (nanti) |

---

## 8. Next action

Agesta balas **"gas voucher S1"** → saya eksekusi S1 (auth session) dulu via TDD sampai deploy verified, baru lanjut S2→S4 berurutan. Jangan loncat ke S3 sebelum S1 hijau (nanti 401 nggak bisa dites beneran).

---

**Dokumen terkait:** `04-Database-Schema.md` §10 `voucher_claims` · `05-API-Specification.md` §16 `POST /api/voucher/claim` · `06-MVP-Checklist.md` Phase 8.1/8.2/8.3 (3 item ⏳ NEXT) · `08-PROGRESS.md` board.
**ADDED 11 Okt 2026 (vs spek lama):** kolom `test`, `expires_at`, `redeemed_at`, idx `code`, kolom `pin` di tenants, error `429 RATE_LIMITED`, kembalikan `existing_code` saat 409.
