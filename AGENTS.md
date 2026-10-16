# AGENTS.md — Wikendo

> Single source of truth untuk semua AI agent (Claude, Cursor, Copilot, Windsurf, Hermes).
> Edit HANYA file ini. File config agent lain (`CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`) cuma menunjuk ke sini.
> Bahasa: Indonesia santai, instruksi tegas.

---

## Before you start

1. **Load context.** Baca [`docs/architecture/architecture.md`](docs/architecture/architecture.md), lalu 1 spoke di `docs/architecture/flows/<topic>/README.md` yang mencakup area yang kamu ubah.
2. **Baseline hijau.** Jalankan `pnpm lint && pnpm type-check && pnpm test` (di `app/`) sebelum menyentuh file. Kalau sudah merah, berhenti dan laporkan — jangan perbaiki hal tak terkait.
3. **Scope check.** Pastikan tugas tetap dalam 1 feature slice. Lintas feature → lewat `common/`. Kalau tugas merembes antar feature, tandai dulu sebelum lanjut.

---

## Definition of done

- [ ] `pnpm lint` exit 0 (ESLint 0 warning + `prettier --check`)
- [ ] `pnpm type-check` exit 0
- [ ] `pnpm test` hijau (minimal `pnpm test path/to/x.spec.ts` untuk kode yang berubah)
- [ ] `pnpm build` exit 0 sebelum PR
- [ ] Setiap fungsi pure / composable / store / util baru punya `__tests__/<nama>.spec.ts` sibling (TDD: tonton MERAH dulu)
- [ ] Alur/store/composable/endpoint berubah → spoke di `docs/architecture/flows/` diperbarui, `status: ready`
- [ ] Tidak ada `console.log`, `v-html`, `any`, atau secret di kode/log
- [ ] Tidak ada import lintas feature, dan tidak ada import `server/` dari kode browser
- [ ] Review security (OWASP) selesai — lihat bagian Security

---

## Project overview

Nuxt 4 SSR app: quiz → rekomendasi weekend Jabodetabek. Stack: Vue 3 Composition API · TypeScript strict · Pinia (setup syntax) · Tailwind · Supabase · Vitest · ESLint 10 + Prettier. Deploy: Vercel (root directory = `app/`). Kode di `app/`; root repo juga berisi `docs/`, `design/`, `data/`, `supabase/` — **jangan taruh kode Nuxt di sana**.

**2 mode DIPISAH TOTAL (hasil tidak pernah dicampur):**

| Mode         | Feature slice     | Route                      | API                                              | Quota anon (cookie)   | Target produksi                     |
| ------------ | ----------------- | -------------------------- | ------------------------------------------------ | --------------------- | ----------------------------------- |
| 🗺️ Tempat    | `features/tempat` | `/quiz` → `/result`        | `POST /api/tempat/recommend`                     | 1x/hari               | 2x/hari login (`user_quota`)        |
| 🍜 Makan     | `features/makan`  | `/makan` → `/result-makan` | `POST /api/makan/recommend`                      | 2x/hari               | 5x/hari login (`mall_search_quota`) |
| 🏬 Direktori | `features/mall`   | `/mall`, `/mall/:slug`     | `GET /api/malls`, `GET /api/malls/:slug/tenants` | tanpa quota/login/LLM | sama                                |

### Feature catalog

| Feature | Folder              | Catatan                                               |
| ------- | ------------------- | ----------------------------------------------------- |
| Home    | `features/home/`    | Wallet quota jujur + CTA + entrypoint mall            |
| Tempat  | `features/tempat/`  | Quiz 5 tanya + result (LLM)                           |
| Makan   | `features/makan/`   | Quiz 4 tanya + result tenant + voucher gift/sheet     |
| Mall    | `features/mall/`    | Direktori + infinity scroll + filter + strip promo    |
| Auth    | `features/auth/`    | Login, register, check-email, Google OAuth satu pintu |
| Account | `features/account/` | Hub Akun 2-state                                      |
| History | `features/history/` | Riwayat localStorage                                  |

### Runtime & environment

- Env publik → `useRuntimeConfig().public.*`; secret → `useRuntimeConfig()` di `server/` saja. **Jangan** baca `process.env` di kode client (lint error).
- Env: `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` (rahasia), `HERMES_API_URL`, `HERMES_API_KEY` (rahasia), `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (rahasia), `NUXT_PUBLIC_GA_ID`. Contoh: `app/.env.example`. Mapping di `app/nuxt.config.ts`.
- CI/CD: `.github/workflows/ci.yml` — security (gitleaks + audit) + verify (lint → type-check → test → build).

---

## Safe commands

> Jalankan dari `app/`. Pertama kali: `pnpm install` (otomatis memasang Husky via `prepare`).

```bash
pnpm dev               # http://localhost:3000
pnpm lint              # ESLint (0 warning) + prettier --check — WAJIB exit 0
pnpm lint:fix          # prettier --write + eslint --fix
pnpm type-check        # nuxt typecheck (vue-tsc) — WAJIB exit 0
pnpm test              # vitest run (semua)
pnpm test path/to/x.spec.ts   # 1 file
pnpm test:related      # hanya test terkait file yang berubah
pnpm build             # verifikasi production — WAJIB exit 0 sebelum PR
```

---

## Pre-commit gate

Husky (`app/.husky/pre-commit`) menjalankan 3 cek berurutan dan berhenti di kegagalan pertama:

1. `pnpm lint-staged` — `eslint --fix` + `prettier --write` untuk file staged.
2. `pnpm type-check` — `vue-tsc` di SELURUH project.
3. `vitest related --run` — hanya test yang terkait file staged.

`commit-msg` memaksa **Conventional Commits**: `type(scope): subject` (tipe: feat fix docs design refactor test chore perf style ci build revert).

**JANGAN pakai `--no-verify` (atau `-n`).** Hook gagal = perbaiki akar masalah lalu buat commit baru (jangan amend). CI menjalankan gerbang yang sama.

---

## Naming conventions

| Artefak                    | Pola                                                   | Contoh                                     |
| -------------------------- | ------------------------------------------------------ | ------------------------------------------ |
| Halaman feature            | `PascalCase + Page.vue` di root feature                | `TempatQuizPage.vue`, `MallListPage.vue`   |
| Route Nuxt                 | kebab-case, **tipis** (render 1 `XPage`)               | `pages/result-makan.vue`                   |
| Komponen                   | `PascalCase.vue`                                       | `TenantCard.vue`, `AppSpinner.vue`         |
| Composable (file + fungsi) | `use` + PascalCase → `useCamelCase.ts`                 | `useInfiniteList.ts` → `useInfiniteList()` |
| Pinia store                | file `XStore.ts`, fungsi `useXStore()`                 | `AuthStore.ts` → `useAuthStore()`          |
| Type / interface           | PascalCase di `@types/` (feature) / `common/types/`    | `TenantRow`, `QuotaStatus`                 |
| Konstanta                  | `SCREAMING_SNAKE_CASE`                                 | `MALL_NAMES`, `HISTORY_MAX_ENTRIES`        |
| Util (pure)                | camelCase di `utils/`                                  | `buildQuotaStatus()`                       |
| Server route               | `nama.method.ts`                                       | `quota.get.ts`, `recommend.post.ts`        |
| Test                       | `{nama}.spec.ts` di `__tests__/` sibling               | `utils/__tests__/pagination.spec.ts`       |
| Field JSON API / DB        | `snake_case`                                           | `claim_code`, `mall_slug`                  |

---

## Code style & size limits

- **Prettier** (`app/.prettierrc`): `semi: true`, double quotes, `printWidth: 80`. Jangan debat format — `pnpm lint:fix`.
- **Batas ukuran (ESLint = error, sama dgn hub-chat):** `complexity ≤ 10`, `max-depth ≤ 3`, `max-lines-per-function ≤ 50`, `max-params ≤ 3` (lebih → objek opsi), `max-lines ≤ 500` per file, `max-classes-per-file 1`, `no-param-reassign`.
- **TypeScript strict**: `any` dilarang (pakai `unknown` + narrowing), return type eksplisit untuk fungsi (`explicit-function-return-type`). Error `catch`/`useFetch`: `getErrorMessage()` / `getErrorStatus()` di `utils/error.ts`.
- **Vue**: `<script setup lang="ts">` saja; urutan blok `script → template → style`; macro `defineProps → defineEmits → defineSlots`.
- Test boleh melonggarkan batas ukuran (`describe`/fixture panjang). Selain itu **jangan** menambah `eslint-disable` — pecah fungsinya.
- **Komentar header tiap file**: APA + KENAPA + CONTOH, singkat (3–5 baris), Bahasa Indonesia. Inline comment menjelaskan _kenapa_, bukan _apa_. Fungsi pure: JSDoc 1 baris.

---

## Architecture

### Layers

| Layer         | Folder          | Tanggung jawab                                                                                         | Hard constraint                                       |
| ------------- | --------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Pages         | `pages/`        | Route Nuxt file-based                                                                                  | Tanpa business logic; render `features/<f>/XPage.vue` |
| Feature slice | `features/<f>/` | Vertical slice: `XPage.vue`, `components/`, `utils/`, `constants/`, `@types/`, `store/`, `__tests__/` | Tidak boleh import slice lain (ESLint error)          |
| Common        | `common/`       | Components, composables, store, utils, constants, types bersama                                        | Tidak boleh import `features/`                        |
| Utils         | `utils/`        | Fungsi pure app-wide (error, pagination, url, boolean)                                                 | Tanpa side effect, tanpa store                        |
| Server        | `server/`       | API + Supabase admin + LLM                                                                             | Secret hanya di sini                                  |
| Plugins       | `plugins/`      | Wiring boot (`v-dompurify-html`)                                                                       | Tanpa state komponen                                  |

### Cross-feature communication

Feature tidak boleh saling import. Pakai: `common/store/` (state bersama), `common/components/` (UI bersama), `common/utils/` (logic bersama). Server boleh mengimpor `common/` dan `utils/` lewat path **relatif** (`~/` tidak selalu resolve di Nitro).

### API & data

| Konteks                    | Pakai                                                            |
| -------------------------- | ---------------------------------------------------------------- |
| Data GET yang dirender SSR | `useFetch<T>(url)`                                               |
| Aksi (POST klaim, dll.)    | `$fetch` di dalam store/composable (mis. `VoucherStore`)         |
| Auth dari browser          | `useSupabaseBrowser()` (anon key)                                |
| Akses DB di server         | `supabaseAdmin()` dari `server/utils/db.ts` (service key)        |
| Panggil LLM                | `server/utils/llm.ts` — kandidat dari DB dulu, LLM hanya ranking |

### State management

Pinia setup store untuk state lintas file/feature; `ref` lokal untuk 1 halaman; quiz = state lokal + query string. Detail: `docs/architecture/flows/cross-cutting/state-management/README.md`. Selalu `storeToRefs()` saat destructure state.

### Docs hub

- Hub: `docs/architecture/architecture.md` · Istilah: `GLOSSARY.md` · Aturan format: `CONVENTIONS.md`
- Spokes: `docs/architecture/flows/<topic>/README.md` (home, quiz-tempat, quiz-makan, mall-directory, auth, quota, voucher-claim, history, layout-navigation, llm, cross-cutting/\*)

---

## Doc updates are part of the task

Tiga pertanyaan sebelum selesai:

1. **Alur berubah?** → update spoke terkait + set `status: ready`.
2. **Menambah/mengganti nama sesuatu yang terdokumentasi?** → perluas/buat spoke; tambah istilah ke GLOSSARY **dulu**.
3. **Kosmetik saja (rename/format)?** → tidak perlu update.

| Yang berubah                           | Aksi                                                         |
| -------------------------------------- | ------------------------------------------------------------ |
| Endpoint baru / kontrak API berubah    | Update spoke `code:` + sequence diagram                      |
| Store / composable / util bersama baru | Extend `state-management` / `shared-ui`; istilah ke GLOSSARY |
| Perubahan quota / wall                 | `quota`                                                      |
| Klaim voucher                          | `voucher-claim`                                              |
| Aturan lint / hook / CI                | `testing-ci` + `security`                                    |

Set `status: stale` kalau kode berubah tapi tidak sempat update. Cek integritas: `python3 ~/.claude/skills/repo-docs/verify.py` dari root repo (jika skill tersedia).

---

## Testing

- Runner: **Vitest** + happy-dom. Config `app/vitest.config.ts` (`**/*.spec.ts`, alias `~` = `app/`).
- Co-locate: `__tests__/<file>.spec.ts` sibling dengan source. Tidak ada folder test terpusat.
- Modul yang diuji unit mengimpor `vue`/`pinia` **eksplisit** (tanpa auto-import). Mock Supabase di level `useSupabaseBrowser` dengan `vi.hoisted` + `vi.mock`; `$fetch` dengan `vi.stubGlobal`.
- **File-assert** (membaca `.vue`/`.ts` sebagai teks, `test/utils.ts → readSource`) dipakai untuk mengunci copy & token UI. `readSource` menormalkan hex lowercase + whitespace (tahan Prettier). Setelah halaman dipecah, 1 assert boleh membaca beberapa file.
- API routes belum punya integration test (butuh mock Nitro/Supabase) — jangan klaim coverage penuh. Kalau menambah: mock di level `callLLM`, bukan HTTP sungguhan.
- TDD: test MERAH → kode minimal HIJAU → refactor. Satu perilaku per test.

---

## Things to watch out for

- ❌ Jangan campur rekomendasi tempat + tenant di 1 halaman / 1 response API.
- ❌ Jangan buat backend terpisah (Express dll.) — monolit Nuxt + Supabase (ADR `docs/02-ADR.md`).
- ❌ Jangan ubah quota cookie jadi DB tanpa migrasi `user_quota`/`mall_search_quota` (`docs/04-Database-Schema.md`).
- ❌ Jangan rename slug mall (`grand-indonesia`, `central-park`, `kota-kasablanka`, `pondok-indah-mall`, `aeon-bsd`) tanpa update `MALL_NAMES`, quiz makan Q1, dan tabel `malls` sekaligus.
- ❌ Jangan commit `.env` (hanya `.env.example`) dan jangan expose `SUPABASE_SERVICE_KEY` ke client.
- `halal` / `kids_friendly` / `hype_tiktok` itu **tri-state** (NULL = belum riset). Filter pakai `.eq(true)`; UI tampil ❓. Jangan overclaim.
- `coerceBool`: frontend mengirim `halal_only: "false"` (string) lewat query — jangan pakai truthiness.
- `?mall=` di `/makan` hanya skip Q1 kalau slug valid (`MAKAN_MALL_SLUGS`).
- Server route memakai **import relatif** untuk file di luar `server/`.
- Tombol yang request API wajib spinner + `:disabled` + early-return guard (anti double-submit).
- Prod Vercel tidak bisa ke `localhost:20128`: butuh `CLOUDFLARE_*` agar LLM jalan.

---

## Security

Sebelum menandai tugas selesai:

1. Periksa semua file yang diubah terhadap OWASP Top 10 (2021).
2. `v-html` dilarang (`vue/no-v-html` = error). Butuh HTML dinamis → `v-dompurify-html` (`plugins/dompurify-html.ts`).
3. Token/secret tidak boleh di-log atau masuk pesan error; secret hanya di `server/`.
4. Input eksternal divalidasi di batas (`parseVoucherCode`, `parsePaginationParams`, `coerceBool`, validasi hasil LLM).
5. Format laporan: `No confirmed vulnerabilities found` ATAU temuan → kategori OWASP + `file:line`.

Kontrol lengkap + Known Debt: `docs/architecture/flows/cross-cutting/security/README.md`.

---

## How to add a feature

1. Cek kode bersama di `common/` dan `utils/` dulu.
2. Buat `features/<name>/` dengan `@types/`, `components/`, `utils/`, `constants/`, (`store/` jika state dibagi).
3. Buat `features/<name>/<Name>Page.vue` (`<script setup lang="ts">`).
4. Buat `pages/<route>.vue` tipis: import & render `<NamePage />` saja.
5. Endpoint baru: `server/api/<x>.<method>.ts` — `defineEventHandler` + validasi input + `supabaseAdmin()` + `createError`. Logic berat → `server/utils/` (≤50 baris/fungsi).
6. Tulis test dulu (MERAH): `features/<name>/utils/__tests__/*.spec.ts`.
7. Types dulu: kontrak API di `common/types/api.ts`, tipe UI di `features/<name>/@types/`.
8. Update docs: spoke baru/ekstensi + istilah GLOSSARY.
9. `pnpm lint && pnpm type-check && pnpm test && pnpm build`.

**Mall ke-6:** (1) row tabel `malls`; (2) tenants ke `data/tenants-seed.csv` + import; (3) 1 option Q1 di `features/makan/constants/questions.ts`; (4) 1 entry `MALL_NAMES` + `MALL_SHORT_LABELS` di `common/constants/malls.ts`. Tanpa endpoint baru.

---

## Key file locations

| Tujuan                   | Path                                                            |
| ------------------------ | --------------------------------------------------------------- |
| Nuxt config              | `app/nuxt.config.ts`                                            |
| Lint / format / tsconfig | `app/eslint.config.mjs`, `app/.prettierrc`, `app/tsconfig.json` |
| Git hooks                | `app/.husky/`                                                   |
| CI                       | `.github/workflows/ci.yml`                                      |
| Kontrak API (types)      | `app/common/types/api.ts`                                       |
| Quota logic              | `app/common/utils/quota.ts`                                     |
| Auth store               | `app/common/store/AuthStore.ts`                                 |
| Server DB admin          | `app/server/utils/db.ts`                                        |
| LLM                      | `app/server/utils/llm.ts`, `llmParsing.ts`                      |
| Klaim voucher            | `app/server/utils/voucherClaim.ts`                              |
| Helper test              | `app/test/utils.ts`                                             |
| Env scaffold             | `app/.env.example`                                              |

---

## Troubleshooting cepat

| Gejala                                               | Cek                                                                                 |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Result 500                                           | Env LLM ada? Dev: `curl http://127.0.0.1:20128/v1/models`; prod: `CLOUDFLARE_*`     |
| Result 403 `LOGIN_REQUIRED` / `MAKAN_QUOTA_EXCEEDED` | Normal (quota habis) — incognito / hapus cookie                                     |
| `/mall/:slug` kosong / 404                           | Tabel `malls`/`tenants` belum di-seed (`data/tenants-seed.csv`); slug harus salah satu dari 5 |
| `pnpm lint` gagal import                             | Lihat pesan `no-restricted-imports` (lintas feature / client→server)                |
| Page blank setelah build                             | `NUXT_PUBLIC_*` belum diisi di `.env` / Vercel env                                  |
| Hook commit gagal                                    | Baca outputnya; perbaiki (jangan `--no-verify`)                                     |

README manusia (setup panjang): `app/README.md`. Kalau kode dan dokumen beda, **kode yang menang** — lalu update dokumen ini + spoke terkait.

---

## Known debt

- `pnpm audit --prod` melaporkan temuan transitif (Nuxt devtools / tailwind-config-viewer); belum memblokir CI.
- Quota login (2+5) ada di `buildQuotaStatus` tetapi server selalu jalur anon.
- Beberapa cast `as` tersisa; ganti dengan type di `common/types` saat menyentuh file.
- Test route API & halaman masih file-assert (belum mount komponen).
