# 26 — Coding Principles (LOCKED)

> **Ringkas (ID):** SOC · KISS · DRY · Single Responsibility · Document Your Code. Wajib untuk setiap perubahan, dicek di Definition of Done. Pelanggaran = pekerjaan belum selesai.

Status: **LOCKED 20 Oct 2026** (Agesta). Applies to every human and AI contributor.
Related: [`AGENTS.md`](../AGENTS.md) (agent entry point) · [`docs/architecture/architecture.md`](architecture/architecture.md) (layers) · [`docs/architecture/CONVENTIONS.md`](architecture/CONVENTIONS.md) (doc format).

---

## 1. The five rules

### 1.1 SOC — Separation of Concerns

Each layer owns exactly one concern. A change to one concern must not force edits in another.

| Layer | Owns | Must NOT |
| ----- | ---- | -------- |
| `app/pages/*.vue` | Route → renders 1 `XPage.vue` | Contain business logic, fetching, state |
| `app/features/<x>/<X>Page.vue` + `components/` | Rendering + local UI state | Fetch directly in templates, touch `server/`, import another feature |
| `app/features/<x>/utils/`, `app/common/utils/`, `app/utils/` | Pure logic (input → output) | Read route/cookie/store/DB, perform I/O |
| `app/common/store/*.ts` | One slice of cross-page state | Render, know about a specific page's markup |
| `app/common/constants/` | Tokens, limits, copy tables | Contain logic |
| `app/server/api/*` | Validate input → authorize → respond | Hold reusable business logic (extract to `server/utils/`) |
| `app/server/utils/` | DB/LLM/voucher logic | Leak secrets to client code |

**Enforcement:** ESLint `no-restricted-imports` (cross-feature, client→server), plus review.

### 1.2 KISS — Keep It Simple

The smallest change that solves the stated problem wins.

- YAGNI: no flags, options, or branches "for later". A P1 idea goes to `08-PROGRESS.md` BACKLOG, not into code.
- Three similar lines beat a premature abstraction. Extract only on the **second** real caller.
- No new layer/folder/file type without a concrete second use.
- Prefer a pure function over a class; prefer a constant over a config; prefer deleting code over adding a flag.

### 1.3 DRY — Don't Repeat Yourself

One fact = one owner. If a value appears twice, it is a bug waiting to diverge.

- Colors, spacing tokens, limits, quota numbers, copy strings → `common/constants/` or `features/<x>/constants/`.
- Shared pure logic → `common/utils/` (or `app/utils/` for app-wide).
- Types: API contract in `common/types/`, UI types in `features/<x>/@types/`.
- Formatting/linting: **one** toolchain (ESLint + Prettier). Never add a second formatter.
- UI copy that the server and the client both show must come from the same constant (e.g. quota wall numbers).

> **Worked example (real bug, fixed 20 Oct 2026):** the page canvas colour had **four** owners — `homeHero.pageBg`, `resultMeta.pageBg` (place), `resultMeta.pageBg` (food), and a hardcoded `#f5f5f4` in mall/legal — while history/account set nothing and fell back to `bg-base`. Result: three visibly different backgrounds. Fix: `common/constants/theme.ts → PAGE_BG`, owned by `app.vue`; features no longer declare the canvas. Locked by `common/constants/__tests__/theme.spec.ts`.

### 1.4 Single Responsibility

One module, one reason to change.

- A function does one thing. If the name needs "and", split it.
- A component renders one concern; a section with its own data/state becomes its own component.
- Server handlers: ≤ 50 lines per function; heavy work → `server/utils/`.
- A store owns one state slice (`AuthStore`, `HistoryStore`, `VoucherStore`) — never two domains.

### 1.5 Document Your Code

Documentation is part of the deliverable, not an afterthought.

Every file starts with a header:

```ts
/**
 * <path> — <one-line purpose>.
 *
 * WHAT: what this module exposes.
 * WHY: the decision/reason behind it (constraints, trade-offs, the bug it prevents).
 * EXAMPLE: smallest real usage.
 */
```

Every exported function gets JSDoc with WHAT/WHY and, when non-obvious, an EXAMPLE.
Inline comments explain **why**, never restate **what** the code already says.
Docs that must follow a code change: the flow spoke in `docs/architecture/flows/<topic>/README.md`, `GLOSSARY.md` (new term first), and `docs/08-PROGRESS.md` (BOARD + LOG).

---

## 2. Definition of Done (additions)

Every item must be true before a task is called done:

- [ ] **SOC** — the change sits in the correct layer; no cross-feature import; no `server/` import from browser code.
- [ ] **KISS** — no speculative option/flag/layer; the diff is the minimum needed.
- [ ] **DRY** — no new copy of an existing constant/limit/string; extracted to the canonical location.
- [ ] **Single responsibility** — no function/component/store doing two jobs; server functions ≤ 50 lines.
- [ ] **Document** — file header (WHAT/WHY/EXAMPLE) + JSDoc on new exports; spoke + GLOSSARY + PROGRESS updated.
- [ ] Existing gates: `pnpm lint` 0 · `pnpm type-check` 0 · `pnpm test` green · `pnpm build` 0.

---

## 3. Anti-patterns seen in this repo (do not repeat)

| Anti-pattern | Why it hurt | Rule |
| ------------ | ----------- | ---- |
| Same colour declared in 4 files | Pages drifted visibly apart | DRY → one constant, one owner |
| Canvas background set inside a feature page | Feature owned a layout concern | SOC → layout owns canvas |
| Dedup logic buried in `onMounted` | Untestable, broke silently (newest deck disappeared) | SOC + SRP → pure util + unit test |
| "Just in case" option on a helper | Unused branches, harder reads | KISS → YAGNI |
| Handler doing validation + LLM + mapping | 1 change touched 3 concerns | SRP → extract to `server/utils/` |

---

## 4. How a reviewer checks it

1. Read the diff top-down; name the layer of each hunk. Wrong layer → request changes.
2. Search the diff for duplicated literals (hex, numbers, copy). Any hit → DRY violation.
3. Look for new parameters/flags with a single call site. Any → KISS violation.
4. Check each new file's header + each new export's JSDoc. Missing → Document violation.
5. Run the gates: lint, type-check, test, build.
