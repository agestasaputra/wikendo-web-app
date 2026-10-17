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

Secrets live only on the server (non-public `runtimeConfig` + `server/utils/db.ts`). ESLint rules enforce the client/server boundary and forbid `v-html`, `process.env` in client code, and `console.log`. CI scans for secrets (gitleaks) and reports dependency vulnerabilities.

## Controls

| Area                | Control                                                                             | Enforced by                                  |
| ------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------- |
| Secrets management  | `supabaseServiceKey`, `cfApiToken`, `hermesApiKey` only in server `runtimeConfig`    | `no-restricted-imports` (client ↔ `server/`) |
| Env di client       | `useRuntimeConfig()` required; `process.env` forbidden in client code               | `no-restricted-properties`                   |
| XSS / injection     | `v-html` forbidden; use `v-dompurify-html`                                         | `vue/no-v-html` + plugin dompurify           |
| Eval / dynamic code | `eval`, `new Function`, implied eval forbidden                                     | ESLint                                       |
| Logging             | `console.log` forbidden (only `warn`/`error`); tokens are never logged             | `no-console`                                 |
| AuthN voucher claim | Bearer token verified by `db.auth.getUser`; 401 without a token                     | `server/utils/voucherClaim.ts`               |
| Anti-abuse          | Rate limit 3 claims/day; UNIQUE user+tenant+day; paging limit max 50; cookie quota   | server                                       |
| Input validation    | `parseVoucherCode`, `parsePaginationParams`, `coerceBool`, LLM result validation    | utils pure + tests                           |
| Secret scan         | gitleaks in CI (full history)                                                      | `.github/workflows/ci.yml`                   |
| Dependency audit    | `pnpm audit --prod` (non-blocking, see Known Debt)                                 | CI                                           |

## Review Checklist (before DONE)

1. Check the changed files against OWASP Top 10 (2021).
2. No `v-html`; no secret/token in logs or error messages.
3. Report: `No confirmed vulnerabilities found` OR findings + OWASP category + `file:line`.

## Known Debt

- `pnpm audit --prod --audit-level=high` reports transitive findings (via `@nuxt/devtools` / `tailwind-config-viewer`, Oct 2026); not yet blocking in CI.
- The cookie-based anon quota can be cleared by the user (MVP allowance; DB `user_quota` for production).
- No security headers / CSP in `nuxt.config.ts` yet.

## See Also

[auth](../../auth/README.md) · [voucher-claim](../../voucher-claim/README.md) · [testing-ci](../testing-ci/README.md)
