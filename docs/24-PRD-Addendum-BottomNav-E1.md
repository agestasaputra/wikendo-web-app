# 24-PRD-Addendum-BottomNav-E1 — Home-Mall-Quiz+-Riwayat-Akun

**Status:** DITERBITKAN 13 Okt 2026 — eksekusi TDD + slicing + deploy prod.
**Dasar:** GATE Agesta `Gas e1` (board v15 U1 vs E1 vs E2, E1 ⭐ 80% ide utuh NOL tab mati, effort 3-4h).
**Gate sebelumnya:** v14 board BN1-BN20 GATE ⏳ (rekom BN1) → v15 evaluasi ide Agesta → E1 LOCKED.
**PRD Final tidak diutak-atik.** Semua scope baru di addendum ini.

---

## 1. Ringkasan E1

Bottom-nav 5 tab ala mobile app, 100% dalam `max-w-md` thumb-zone:

- **Home** (`/`) — aktif default, NOL ubah isi home.
- **Mall** (`/mall`) — hub direktori 5 mall, NOL ubah isi.
- **Quiz+** (center, BUKAN route) — tap → bottom-sheet 2 intent eksplisit quota beda.
- **Riwayat** (`/riwayat` BARU) — list localStorage "Terakhir dilihat", NOL backend.
- **Akun** (`/account` BARU) — hub 2-state cermin header AS6, NOL page berat baru.

**Total effort:** ~3-4h P0. Token lock: paper #F5F5F4 + ink #0C0A09 + lime #A3E635 + ember #EA580C + rose #E11D48.
**Cost diterima:** Quiz+ = 2-tap (tap + → tap Tempat/Makan) vs 1-tap 2-tab. Alasan: 1 tombol tidak bisa bawa 2 intent quota beda (2/hari vs 5/hari) tanpa bohong.

---

## 2. WHY (kenapa E1, bukan U1 mentah)

- Ide Agesta `home-history-add quiz-notification-account` = 70% tepat (5-tab mobile pattern, Add→Quiz tempat/makan, Account→login/wishlist/contact/about).
- 30% adaptasi expert (LOCKED):
  - Notif → Mall di P0. Backend notif NOL + tabel NOL + Bell header login-only = tab Notif = tab mati untuk 100% anon. Mall sudah ada (`/mall` 5 mall 200 tenant) → tab hidup hari-1.
  - History → `/riwayat` baca localStorage `wikendo_history` ("Terakhir dilihat"). Tanpa backend, jujur kosong (`Belum ada riwayat — mulai quiz pertamamu →`).
  - Add center TIDAK pindah page langsung → bottom-sheet 2 kartu eksplisit. Split Tempat vs Makan wajib eksplisit (quota beda, result tidak dicampur).
  - Account → hub `/account` tanpa page baru berat (tanpa /profile full, tanpa foto Google, tanpa quota-server session-aware — ikut guard Addendum 22).
- U1 effort 6-10h + 2 tab kosong (notif/history mati). E1 effort 3-4h NOL tab mati. E2 = full P1 + backend nanti (BACKLOG).

---

## 3. WHAT — klik Add dan klik Akun (kontrak interaksi LOCKED)

### 3.1 Klik Quiz+ (center)

- Tap → bottom-sheet muncul dari bawah + backdrop gelap. NOL pindah page. NOL API call baru (quota ikut `GET /api/quota` yang sudah ada bila perlu, fallback anon `1•2`).
- Sheet isi 2 kartu:
  - `🗺️ Cari Tempat (2/hari) → /quiz` — quota jujur: anon sisa `1/1`, login real `x/2`. Habis → disabled `Besok lagi 00.00`.
  - `🍜 Cari Makan (5/hari) → /makan` — quota jujur: anon sisa `2/2`, login real `x/5`. Habis → disabled `Besok lagi 00.00`.
- Tutup: tap backdrop / swipe down / tombol X. Focus trap ringan, `aria-label` sheet + tombol tutup.
- Token: sheet putih rounded-2xl, handle bar `#d6d3d1`, kartu border `#e7e5e4`, CTA ink `#0C0A09`, top-border 4px ink (konsisten sheet V13B).

### 3.2 Klik Akun (hub `/account`)

- Route BARU `/account` (file `app/pages/account.vue`). BUKAN modal. Cermin header AS6 2-state:
  - Anon: CTA `Login → /login` + `Daftar → /register` + note `Login gratis → buka 2 tempat + 5 makan/hari`.
  - Login: avatar initial + nama (`displayName`) + email grey + tombol `Keluar` merah (spinner SVG `animate-spin` + `:disabled` + early-return guard → `signOut()` → balik `/` anon).
- List hub (urutan LOCKED):
  1. `🕒 Riwayat` → `/riwayat` (redundan disengaja dengan tab Riwayat — real localStorage).
  2. `❤️ Wishlist` → disabled jujur `Segera` (ikut header AS6, momen wall #3a tetap `isWishlistLoginWall`).
  3. `💬 Hubungi kami` → link langsung `https://wa.me/` (tanpa page perantara).
  4. `ℹ️ Tentang` → anchor footer `#tentang` (footer `app.vue` tambah `id="tentang"` + teks Wikendo MVP).
- Notif tetap Bell header login-only (SOP §8). NOL tab Notif di bottom-nav. NOL dead-end: semua baris ada aksi.

### 3.3 Tab Riwayat (`/riwayat` BARU)

- Route BARU `/riwayat` (file `app/pages/riwayat.vue`). Baca `localStorage key wikendo_history` (array JSON `{ kind, title, sub, at }`, max 20, newest-first).
- Kosong → `Belum ada riwayat — mulai quiz pertamamu →` (1:1 teks home `Terakhir dilihat`).
- `result.vue` + `result-makan.vue` tulis 1 entry ke `wikendo_history` pas data sukses (guard `typeof window`, try/catch JSON, dedupe by title, cap 20). NOL API, NOL quota kepotong.
- Home `Terakhir dilihat` tetap (redundan disengaja, real data sama).

---

## 4. Scope guard (JANGAN dibangun di slice ini)

- Tab Notif / tabel notif / push → BACKLOG (E2).
- `/profile` full (edit nama/foto/ganti password) → BACKLOG (ikut Addendum 22).
- Foto avatar Google → initial aja (hemat bandwidth).
- `GET /api/quota` session-aware (baca access_token, 2+5 real login) → slice berikutnya, JANGAN dicampur.
- Wishlist real / backend history → BACKLOG. Wishlist tetap `Segera` disabled jujur.
- Idle 1:1: home/mall/quiz/makan/result render HARUS sama persis kayak sekarang (kecuali padding-bottom + nav).

---

## 5. Kriteria DONE

- [ ] `app/components/BottomNav.vue` BARU: 5 tab Home/Mall/Quiz+/Riwayat/Akun, `max-w-md`, fixed bottom, active lime+dot, Quiz+ center buka sheet (bukan route).
- [ ] Sheet Quiz+ 2 kartu Tempat→`/quiz` + Makan→`/makan`, quota jujur, habis disabled `Besok lagi 00.00`, tutup backdrop/X, `aria-label`.
- [ ] `app/pages/account.vue` BARU: 2-state anon/login cermin AS6 + 4 baris hub (Riwayat/Wishlist Segera/WA/Tentang) + Keluar spinner+guard → `/`.
- [ ] `app/pages/riwayat.vue` BARU: baca `wikendo_history`, kosong jujur, list newest-first.
- [ ] `result.vue` + `result-makan.vue` tulis `wikendo_history` (guard window, cap 20, dedupe).
- [ ] `app.vue` pasang `<BottomNav/>` + `pb-24` anti-ketutup + footer `id="tentang"`.
- [ ] Test `bottom-nav-e1.test.ts` GREEN → full suite hijau → lint 0 → build sukses → push sinkron → prod `/ /mall /account /riwayat` 200.

## 6. Verifikasi (TDD)

- Test BARU `app/tests/bottom-nav-e1.test.ts` (~18 assert): component 5-tab + sheet 2 intent + quota/disabled + account 2-state + hub 4 baris + riwayat localStorage + result tulis history + app.vue wiring.
- Status saat Addendum ditulis: RED by design (file `BottomNav.vue`/`account.vue`/`riwayat.vue` belum ada) → GREEN pas slice. Full suite tetap hijau.
