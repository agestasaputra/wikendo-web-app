# Architecture Doc Conventions

Rules every doc in `docs/architecture/` follows. Keep docs short. (Same format as hub-chat.)

## Frontmatter (4 fields, required)

```yaml
---
topic: <slug>
status: ready | stale
related: [<sibling-slug>, ...]
code: [<path>, <path>, ...]
---
```

- `status: stale` — anyone editing the underlying code flips to `stale`.
- `status: ready` — reviewer flips back after re-verifying.
- `code:` — primary paths (relative to repo root, so `app/...`) to verify the doc. Plain paths only (use `path:line` in prose).

## Doc template

Every spoke `README.md` follows the template:

1. Frontmatter block (above)
2. `# Title`
3. `## TL;DR` — 2–3 sentences
4. `## Entry Points` — bullet list of `path` + trigger description
5. `## Sequence` — Mermaid sequence diagram + numbered prose steps
6. `## Key Components` — table: Component | File | Role
7. `## Data` — JSON payload examples in fences
8. `## Failure & State` — retries, persistence, TTLs
9. `## See Also` — links to related spokes

**Skip any section that has nothing to say.** Three sentences beat three paragraphs of filler.

## Diagrams

- Format: **Mermaid** in ` ```mermaid ` fences inside the README.
- Solid arrows (`-->`) for sync, dashed (`-.->`) for async.
- **No separate `.mmd` files, no `diagrams/` subfolders.**

## Examples / payloads

- Embed JSON in ` ```json ` fences inside the README. **No separate `examples/` folders.**

## Code references

- In prose: `path/to/file.ext` (add `:line` only if verified).
- In frontmatter `code:`: plain paths only.

## File naming

- Topic folders: kebab-case. `README.md` is the only doc per folder. One file = one full context.
- New term? Add it to [GLOSSARY.md](./GLOSSARY.md) FIRST, then use it in a spoke.
