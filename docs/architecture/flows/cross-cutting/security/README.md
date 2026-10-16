---
topic: security
status: ready
related: [auth, voucher-claim, llm, testing-ci]
code:
  - app/eslint.config.mjs
  - app/server/utils/db.ts
  - app/plugins/dompurify-html.ts
  - app/nuxt.config.ts
  - .github/workflows/ci.yml
  - app/server/utils/voucherClaim.ts
---

# Security

## TL;DR

Secret hanya hidup di server (`runtimeConfig` non-public + `server/utils/db.ts`). Aturan ESLint memaksa batas client/server dan melarang `v-html`, `process.env` di client, dan `console.log`. CI memindai secret (gitleaks) dan melaporkan kerentanan dependency.

## Controls

| Area                  | Kontrol                                                                                   | Ditegakkan oleh                          |
| --------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------- |
| Secrets management    | `supabaseServiceKey`, `cfApiToken`, `hermesApiKey` hanya di `runtimeConfig` server        | `no-restricted-imports` (client ↔ `server/`) |
| Env di client         | Wajib `useRuntimeConfig()`; `process.env` dilarang di kode client                         | `no-restricted-properties`               |
| XSS / injection       | `v-html` dilarang; pakai `v-dompurify-html`                                               | `vue/no-v-html` + plugin dompurify       |
| Eval / dynamic code   | `eval`, `new Function`, implied eval dilarang                                             | ESLint                                   |
| Logging               | `console.log` dilarang (hanya `warn`/`error`); token tidak pernah di-log                  | `no-console`                             |
| AuthN klaim voucher   | Bearer token diverifikasi `db.auth.getUser`; 401 tanpa token                              | `server/utils/voucherClaim.ts`           |
| Anti-abuse            | Rate-limit 3 klaim/hari; UNIQUE user+tenant+hari; limit paging max 50; quota cookie       | server                                   |
| Input validation      | `parseVoucherCode`, `parsePaginationParams`, `coerceBool`, validasi hasil LLM             | utils pure + tests                       |
| Secret scan           | gitleaks di CI (riwayat penuh)                                                            | `.github/workflows/ci.yml`               |
| Dependency audit      | `pnpm audit --prod` (non-blocking, lihat Known Debt)                                      | CI                                       |

## Review Checklist (sebelum DONE)

1. Cek OWASP Top 10 (2021) untuk file yang berubah.
2. Tidak ada `v-html`; tidak ada secret/token di log atau pesan error.
3. Laporan: `No confirmed vulnerabilities found` ATAU temuan + kategori OWASP + `file:line`.

## Known Debt

- `pnpm audit --prod --audit-level=high` melaporkan temuan transitif (via `@nuxt/devtools` / `tailwind-config-viewer`, Okt 2026); belum diblokir di CI.
- Quota anon berbasis cookie dapat dihapus pengguna (jatah MVP; DB `user_quota` untuk produksi).
- Belum ada security headers / CSP di `nuxt.config.ts`.

## See Also

[auth](../../auth/README.md) · [voucher-claim](../../voucher-claim/README.md) · [testing-ci](../testing-ci/README.md)
