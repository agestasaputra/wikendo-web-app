# Glossary

Single source of truth for terminology used across `docs/architecture/`. Use the **bolded form** when writing or editing any doc. Add an entry here before introducing a new term.

---

## 1. Domain Concepts

| Term          | Definition                                                                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wikendo**   | Produk: quiz → rekomendasi weekend Jabodetabek. Dua mode dipisah total: **Tempat** dan **Makan**.                                              |
| **Tempat**    | Mode rekomendasi 5 tempat wisata/nongkrong via LLM. Route `/quiz` → `/result`. Tidak pernah dicampur dengan tenant.                            |
| **Makan**     | Mode rekomendasi 5 **Tenant** di 1 mall. Route `/makan` → `/result-makan`. Kandidat dari DB dulu, LLM hanya ranking.                           |
| **Mall**      | Salah satu dari 5 mall aktif (`grand-indonesia`, `central-park`, `kota-kasablanka`, `pondok-indah-mall`, `aeon-bsd`). Identitas = **slug**.    |
| **Tenant**    | Restoran/kafe di dalam mall (baris tabel `tenants`). Punya flag tri-state `halal`, `kids_friendly`, `hype_tiktok` (NULL = belum riset).        |
| **Direktori** | Halaman `/mall` + `/mall/:slug`: daftar mall & tenant tanpa login/quota/LLM (SEO).                                                             |
| **Quota**     | Jatah generate per hari. **Anon**: tempat 1x + makan 2x (cookie). **Register**: tempat 2x + makan 5x. Reset 00.00 WIB.                         |
| **Anon**      | Pengguna belum login. Quota dilacak lewat cookie `quota_used` / `makan_quota_used`.                                                            |
| **Wall**      | Momen UI yang mengunci aksi untuk anon dan mengarahkan ke login (#1 quota, #2 Simpan, #3 Wishlist/Riwayat, #4 klaim voucher).                  |
| **Wallet**    | Kartu quota di Home: headline sisa ("1 tempat • 2 makan") + chip per mode. Selalu jujur ikut `GET /api/quota`.                                 |
| **Voucher**   | Promo tenant (`vouchers`). **Klaim** wajib login; 1 user + 1 tenant + 1 hari = 1 klaim; maksimal 3 klaim/hari.                                 |
| **Gift**      | Gaya banner voucher V12 di hero result makan ("Ada -20% buat lu" + Buka →). Detail promo di **Sheet**.                                         |
| **Sheet**     | Panel overlay: `QuizPlusSheet` (pilih quiz) dan `VoucherSheet` (pilih 1 dari 3 promo).                                                         |
| **Riwayat**   | Daftar hasil quiz terakhir (max 20) di localStorage `wikendo_history`. Tanpa backend.                                                          |
| **Hero**      | Kartu utama result (deck BEST) atau blok quota di Home. Nilainya diturunkan oleh helper pure (`buildTempatHero`, `buildMakanHero`).            |
| **Slicing**   | Menyalin desain/screenshot 1:1 ke komponen. "Token lock" = warna/spacing yang dikunci Agesta (ink `#0C0A09`, ember `#EA580C`, lime `#A3E635`). |
| **Sentinel**  | Elemen di dasar list yang memicu muat page berikutnya saat masuk viewport (infinity scroll, `useSentinelObserver`).                            |

## 2. Architecture Patterns

| Term                   | Definition                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Feature slice**      | Folder `app/features/<name>/` berisi `XPage.vue`, `components/`, `utils/`, `constants/`, `@types/`, `store/`. Tidak boleh import slice lain. |
| **Thin page**          | File `app/pages/*.vue` yang hanya merender 1 `XPage.vue` dari feature (tanpa business logic).                                                |
| **Common**             | `app/common/`: components, composables, store, utils, constants, types yang dipakai lintas feature. Tidak boleh import `features/`.          |
| **Pure helper**        | Fungsi input → output tanpa side effect/route/cookie/DB; satu-satunya tempat logic boleh diuji tanpa Nuxt (`utils/`, `*/utils/`).            |
| **Setup store**        | Pinia store bersintaks setup (`defineStore("x", () => {...})`), file `XStore.ts`, fungsi `useXStore()`.                                      |
| **File-assert test**   | Test yang membaca source sebagai teks (`test/utils.ts → readSource`) untuk mengunci copy/token UI. NOL network, deterministik.               |
| **Definition of done** | Checklist di `AGENTS.md`: lint 0, type-check 0, test hijau, build exit 0, docs & boundary terjaga.                                           |

## 3. External Services

| Term                      | Definition                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Supabase**              | Postgres + Auth. Browser memakai anon key (`useSupabaseBrowser`); server memakai service key (`supabaseAdmin`, bypass RLS). |
| **Cloudflare Workers AI** | Provider LLM produksi (endpoint OpenAI-compatible). Dipilih kalau `cfAccountId` + `cfApiToken` terisi.                      |
| **Hermes-combo**          | Provider LLM lokal untuk dev (`http://127.0.0.1:20128`). Fallback kalau env Cloudflare kosong.                              |
| **Vercel**                | Hosting produksi (root directory = `app/`).                                                                                 |
| **Google OAuth**          | Login 1-klik lewat Supabase `signInWithOAuth({ provider: "google" })`.                                                      |
| **GitHub Actions**        | CI `.github/workflows/ci.yml`: security (gitleaks + audit) dan verify (lint, type-check, test, build).                      |
