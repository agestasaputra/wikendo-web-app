# 23-PRD-Addendum-Voucher-Claim v1.1 — Multi-Voucher + Sheet + Strip

**Status:** DITERBITKAN 11 Okt 2026 — multi-voucher schema + best-1 sheet + strip promo di mall page.  
**Dasar:** Rekomendasi expert V13: paket A+B+C ~2.5h P0 $0 NOL route baru di atas VC5 lock.  
**Gate:** `Gas v13` — user setuju lanjut eksekusi.

---

## 1. Ringkasan Fitur V13

Fitur ini menambah pilihan voucher selain default gift `-20% buat lu + Buka` di hero result-makan.vue, dengan pola multi-voucher end-to-end:

- **V13A:** Hero best-1 + link `+2 promo lain` — sinyal ada pilihan tanpa bombardir user.
- **V13B:** Sheet di atas result — `Pilih promo 1 dari 3` di konteks tenant (Maps tetap, anti-stacking `1 transaksi 1 kode`), countdown klaim per row, kode unik `WKD-XXXXXX` expiry 23:59.
- **V13C:** Strip promo di mall page — 1 section di halaman mall, klik loncat tenant, $0 cost, discovery tanpa page baru.

**Total effort:** ~2.5h P0. Token lock: paper #F5F5F4 + ink #0C0A09 + lime/rose/mint. `app/` NOL sentuh.

---

## 2. Schema Database — Multi-Voucher P0/P1

Tabel `vouchers` baru (migrasi tambahan di atas v1.0):

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | UUID | PK | |
| `tenant_id` | UUID | FK → tenants | Setiap tenant punya voucher-nya |
| `code` | TEXT | UNIQUE + NOT NULL | Kode claim `WKD-XXXXXX` |
| `promo_text` | TEXT | NOT NULL | Contoh: `-20% Weekday` |
| `promo_active` | BOOLEAN | DEFAULT true | Aktif/Non-aktif |
| `discount_percent` | INTEGER | DEFAULT 0 | Diskon (%) |
| `discount_type` | TEXT | `percentage` | `percentage` atau `fixed` |
| `max_claims_per_tenant` | INTEGER | DEFAULT 1 | P0: 1-aktif per tenant/hari |
| `claims_per_tenant_today` | INTEGER | DEFAULT 0 | Counter hari ini (RBAC) |
| `valid_from` | TIMESTAMP | NOT NULL | Mulai valid |
| `valid_until` | TIMESTAMP | NOT NULL | Berakhir 23:59 hari ini |
| `created_at` | TIMESTAMP | DEFAULT now() | |
| `updated_at` | TIMESTAMP | DEFAULT now() | |

**Constraints krusial P0:**
- `UNIQUE(user_id, tenant_id, claim_date)` — hanya 1 claim per user per tenant per hari.
- `CHECK (max_claims_per_tenant >= 1)` — P0 setara 1 transaksi 1 kode.
- `valid_until` selalu habis 23:59 WIB hari ini (bukan masa lampau).

**Tabel `voucher_claims` (P1, opsional):**
| Kolom | Tipe | Constraint |
|-------|------|------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → auth.users |
| `voucher_id` | UUID | FK → vouchers |
| `claim_code` | TEXT | `WKD-XXXXXX` |
| `claimed_at` | TIMESTAMP | DEFAULT now() |
| `redeemed_at` | TIMESTAMP | NULL → belum tukar |
| `redeem_code` | TEXT | NULL → belum tukar, atau `PIN-XXXXXX` |

**Index:**
- `idx_vouchers_tenant_active` ON (`tenant_id`, `promo_active`, `valid_until`)
- `idx_voucher_claims_user_tenant_day` ON (`user_id`, `tenant_id`, `claim_date`)

---

## 3. Alur End-to-End End-To-End (Kopi GI Contoh)

1. User lihat result-makan.vue → hero V13A: `-20% Weekday` + `+2 promo lain` (lime link).
2. User klik `+2 promo lain` → sheet V13B muncul di atas result, 3 row:
   - Row 1: Kopi Weekday -20% — sisa 7/20 — **Klaim** → kode `WKD-7X2K9A` muncul → countdown 23:59.
   - Row 2: Free Large — sisa 12/20 — **Klaim** → kode `WKD-4Y5B3C` muncul → countdown 23:59.
   - Row 3: Dessert 35rb — sisa 3/10 — **Klaim** → kode `WKD-L8M2N1` muncul → countdown 23:59.
3. User klik **Klaim** row 1 → muncul kode `WKD-7X2K9A` + countdown + tombol **Tukar di Kasir**.
4. User buka kasir `/t/:slug` → judul + terms + field Tukar + field PIN.
5. User masukin kode `WKD-7X2K9A` + PIN → validasi server → `voucher_claims` dibuat → status `redeemed`.
6. Voucher lain di row 2+3 terkunci untuk tenant yang sama hingga besok (anti-stacking).

**Alias `/voucher/:code` P1:** Bareng PIN di halaman kasir (bukan P0).

---

## 4. Alur V13C — Strip di Mall Page

1. User buka `mall/[slug].vue` → scroll ke section **"Promo hari ini di GI"**.
2. Section menampilkan strip 1 baris: `Promo hari ini di GI (7)` — 7 voucher aktif hari ini.
3. User klik strip → **loncat** ke result-makan.vue dengan voucher yang dipilih (single tenant).
4. **NOL route baru** — strip hanya mengganti URL param `?from_mall=true`, tidak create route baru.

**Visual strip di mall page:**
```
--------------------------------------------------
| Promo hari ini di GI (7)                       |
|  • -20% Weekday (sisa 7/20)                  |
|  • Free Large (sisa 12/20)                   |
|  • Dessert 35rb (sisa 3/10)                  |
| [Buka → result-makan.vue]                      |
--------------------------------------------------
```

---

## 5. Alur Klaim V13 — Detail Teknis

### 5.1 `POST /api/voucher/claim` (S3)

**Request (mulai login):**
```json
{
  "voucher_code": "WKD-7X2K9A",
  "mall_slug": "gi",
  "from_mall_page": false
}
```

**Response sukses:**
```json
{
  "status": "ok",
  "claim_code": "WKD-7X2K9A",
  "expires_at": "23:59 WIB hari ini",
  "voucher": {
    "name": "Kopi Weekday -20%",
    "discount_percent": 20,
    "sisa_hari_ini": 7
  }
}
```

**Response error 401:** Belum login → balik ke login wall.
**Response error 409:** Sudah claim hari ini user+tenant → `Anda sudah mengklaim voucher ini hari ini. Kembali besok.`
**Response error 429:** >3 klaim/tenant/hari → `Batas maksimal 3 voucher per tenant per hari.`

### 5.2 `GET /api/voucher/:code` (P1, optional)

**Request:** `GET /api/voucher/WKD-7X2K9A`
**Response:** `{ code: "WKD-7X2K9A", status: "active", voucher_name: "Kopi Weekday -20%", discount: 20, expired_at: "2026-10-12T23:59:00.000Z" }`

---

## 6. Alur Kasir V13 — `/t/:slug` (P1, optional)

1. User buka `/t/:slug` → judul: `Tukar Voucher` + terms.
2. Field: `Kode Voucher` (input text) + `PIN` (input text, opsional untuk P0).
3. Tombol **Tukar** → POST `/api/voucher/claim` dengan kode + PIN jika ada.
4. Jika sukses → halaman konfirmasi: `Voucher berhasil ditukar!` + `Kode: WKD-7X2K9A` + `Diskon: 20%` + `Kadaluarsa: 23:59 WIB`.
5. Jika gagal → error inline + countdown ulang.

---

## 7. Anti-Farming & Anti-Stacking Rules (P0 Lock)

- **1 user + 1 tenant + 1 hari = 1 claim saja.** `UNIQUE(user_id, tenant_id, claim_date)` di DB.
- **Max 3 claim per tenant per hari** (hard limit di API 429).
- **Tidak ada stacking voucher** di transaksi sama. Setiap claim generate kode unik sekali pakai.
- **Countdown 23:59 WIB** — setelah 00:00 hari es claim batal (bisa diklaim lagi dari awal).
- **Anti-bocor:** Setiap kode `WKD-XXXXXX` tergenerasi deterministik dari `user_id + tenant_id + claim_date + counter`. Tidak bisa ditebak.

---

## 8. Checklist Verifikasi P0 (DONE jika semua terpenuhi)

- [x] `docs/23-PRD-Addendum-Voucher-Claim.md` → v1.1 multi+sheet+strip.
- [x] Migrasi Supabase: tabel `vouchers` + `voucher_claims` dengan constraints di atas.
- [x] Helper `useVoucher()` di `app/composables/` — `claimVoucher(code)`, `getVoucherStatus(code)`.
- [x] API `POST /api/voucher/claim` — 401/409/429 handling + spinner + :disabled.
- [x] V13A hero best-1 + `+2 promo lain` di result-makan.vue — 1:1 design revamp-options-v13.html.
- [x] V13B sheet 3 row di atas result — `Pilih promo 1 dari 3` + sisa cap per row + Klaim per row.
- [x] V13C strip di mall page — 1 section `"Promo hari ini di GI (7)"` tanpa route baru.
- [x] Test TDD: S1 auth `requireUser` 401, S2 `voucher_claims` UNIQUE, S3 `POST /api/voucher/claim` 401/409/429, S4 best-1+sheet+kode GEDE+countdown+spinner.
- [x] `docs/08-PROGRESS.md` NOW+LOG updated + commit + push + Vercel redeploy + prod 200 verifikasi.
- [x] `design/revamp-options-v13-compare.png` QA PASS (3 panel distinct NOL tofu/overlap).
- [x] `app/` NOL sentuh untuk mock desain — semua di `design/`.

---

## 9. Sinkron Checklist 8.x (Auto-Patched)

Lihat `docs/06-MVP-Checklist.md` area 8.1-8.4 untuk progress terbaru. Setiap entry di CHECKLIST harus sinkron dengan file ini: KENAPA di ADDENDUM, APA di CHECKLIST, KAPAN di PROGRESS.md LOG.

*End of Addendum 23 v1.1*