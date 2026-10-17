# 17 — Design Index (Wikendo Design Asset Index)

> List of all visual artifacts in `../design/` as of 8 Oct 2026. HTML files = interactive boards (open in a browser), not markdown documents — so they stay in `design/`; this is only the index.

## Logo (final: D16 P3 🔒)

| File | Contents |
|---|---|
| `../design/assets/d16-day.svg` | Master Day: ink tile + 56px cream die (app icon, light header, favicon) |
| `../design/assets/d16-night.svg` | Transparent takeout (web dark mode, dark header) |
| `../design/assets/d16-mono.svg` | Single-color (WKD-XXXXXX voucher receipt, photocopy, stamp) |
| `../design/assets/d16-lockup.svg` | Vertical: icon + wordmark below (splash, t-shirt) |
| `../design/assets/d16-lockup-horizontal.svg` | Horizontal: icon + wordmark on the right (web header/navbar) |
| `../design/logo-d16-full-version.html` | Official P3 brand sheet (self-contained, inline SVG) |
| `../design/logo-d16-padding-options.html` | Board of 7 padding options P1(48)→P7(72), P3 FINAL highlighted |
| `../design/logo-d16-dual-mode.html` | Day vs Night study + OLED contrast test |
| `../design/logo-finalist-top4-darkmode.html` | Finalists A2/A3/D16/D18 + dark-mode fix |
| `../design/logo-wikendo-icon-30.html` | Board v2: 30 icon-first logos |
| `../design/logo-wikendo-30.html` | Board v1: 30 logos (partially obsolete, mixes in wordmarks) |

## UI Revamp (combo 5+10+15, Addendum v1.3)

| File | Contents |
|---|---|
| `../design/revamp-combo-5-10-15.html` | Visual spec for the combo (already sliced into `app/`, commit `e12be1b`) |
| `../design/revamp-options-v1.html` | Options 1–5 (proposal, visual only) |
| `../design/revamp-options-v2.html` | Options 6–15 (proposal, visual only) |

## Archive (pre-Wikendo)

| File | Contents |
|---|---|
| `15-Wireframes.md` | (mirror) Text wireframes from the Weekend Planner era |
| `14-Prototype-Guide.md` | (mirror) HTML prototype testing guide |
| `../design/prototype/` | Interactive HTML prototype (index/quiz/result) |

## Rules

- FINAL logo = D16 P3 (die 56, W 29, rotation -8°). Don't redraw manually — derive from `assets/`.
- HTML boards may be added; the master SVG only changes via a new lock decision (record it in `08-PROGRESS.md`).
