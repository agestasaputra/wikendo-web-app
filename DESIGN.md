---
version: alpha
name: Wikendo
description: Weekend plan + mall F&B finder — playful utility, decisive 1-tap, split Tempat (ember) vs Makan (rose).
colors:
  primary: "#0C0A09"
  paper: "#F5F5F4"
  card: "#FFFFFF"
  ember: "#EA580C"
  ember-cta: "#C2410C"
  ember-bright: "#FB923C"
  ember-wash: "#FFF7ED"
  rose: "#E11D48"
  rose-bright: "#FDA4AF"
  rose-wash: "#FFE4E6"
  gift-border: "#FECDD3"
  lime: "#A3E635"
  on-ink: "#FFFFFF"
  on-ember: "#FFFFFF"
  on-rose: "#FFFFFF"
  on-lime: "#0C0A09"
typography:
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.625rem
    fontWeight: 800
    letterSpacing: "0.025em"
  question:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.1875rem
    fontWeight: 800
    lineHeight: 1.375
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.8125rem
    lineHeight: 1.5
  option:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: 700
rounded:
  header: 14px
  option: 20px
  card: 24px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
components:
  page-canvas:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.primary}"
    rounded: "{rounded.card}"
    padding: 16px
  quiz-ink-header:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.header}"
    padding: 12px
  quiz-option:
    backgroundColor: "{colors.card}"
    textColor: "{colors.primary}"
    typography: "{typography.option}"
    rounded: "{rounded.option}"
    padding: 14px
  quiz-option-selected-place:
    backgroundColor: "{colors.ember-wash}"
    textColor: "{colors.primary}"
    rounded: "{rounded.option}"
    padding: 14px
  quiz-option-selected-food:
    backgroundColor: "{colors.rose-wash}"
    textColor: "{colors.primary}"
    rounded: "{rounded.option}"
    padding: 14px
  quiz-dot-place:
    backgroundColor: "{colors.ember-bright}"
    rounded: "{rounded.full}"
    size: 8px
  quiz-dot-food:
    backgroundColor: "{colors.rose-bright}"
    rounded: "{rounded.full}"
    size: 8px
  quiz-seg-on:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.on-lime}"
    rounded: "{rounded.full}"
    height: 8px
  strip-place:
    backgroundColor: "{colors.ember}"
    rounded: "{rounded.full}"
    width: 5px
    height: 48px
  voucher-gift:
    backgroundColor: "{colors.rose-wash}"
    textColor: "{colors.primary}"
    rounded: "{rounded.header}"
    padding: 12px
  voucher-gift-edge:
    backgroundColor: "{colors.gift-border}"
    textColor: "{colors.primary}"
    rounded: "{rounded.header}"
    padding: 12px
  cta-place:
    backgroundColor: "{colors.ember-cta}"
    textColor: "{colors.on-ember}"
    rounded: "{rounded.header}"
    height: 56px
  cta-food:
    backgroundColor: "{colors.rose}"
    textColor: "{colors.on-rose}"
    rounded: "{rounded.header}"
    height: 56px
---

## Overview

Wikendo = weekend planner + mall food finder. Personality: playful utility — emoji, casual (santai) Indonesian copy, yet every screen asks for only 1 small decision (completion >70%).

The most sacred split: **Tempat = ember, Makan = rose**. The two flows never mix accent colours. Small labels and questions are always white on ink. Lime is only for progress/value (<10% dose).

## Colors

- **Primary ({colors.primary}):** Ink — text, quiz header, Maps button. Background of the Q2d/M3d quiz header.
- **Paper ({colors.paper}):** Container background for all pages (`page-canvas`, a warm combo, not plain white).
- **Card ({colors.card}):** Surface of quiz options and list cards.
- **Ember ({colors.ember}):** Brand/strip/selected state of the Tempat flow — 5px hero strip (`strip-place`), selected quiz option. NOT a background for white text (white on it is 3.56:1, fails AA) — white-text CTAs must use `ember-cta`.
- **Ember CTA ({colors.ember-cta}):** Ember-deep, reserved for white-text surfaces (`cta-place`, white 5.2:1 passes AA). Same ember family, only for the Tempat CTA.
- **Ember bright ({colors.ember-bright}):** Only the Q2d label dot (`quiz-dot-place`). Wash ({colors.ember-wash}) is only the selected bg for Tempat.
- **Rose ({colors.rose}):** The ONLY action colour of the Makan flow — CTA (`cta-food`, white 4.73:1 passes AA), mirrors ember. Bright ({colors.rose-bright}) is only the M3d label dot (`quiz-dot-food`). Wash ({colors.rose-wash}) is the selected bg for Makan + the gift voucher base.
- **Gift border ({colors.gift-border}):** Border/accent of the V12 gift voucher card (`voucher-gift-edge`).
- **Lime ({colors.lime}):** Progress (quiz block segments `quiz-seg-on`) and value (BEST pill, badges). NOT an action, NOT a label. Dose <10% per screen. Text on lime is always ink ({colors.on-lime}).
- **On-colors:** White on ink/ember-cta/rose; ink on lime.

## Typography

Plus Jakarta Sans for everything. Hierarchy comes from size + weight, not from switching fonts.

- `label-caps` (10px, 800, wide tracking): the `QUIZ TEMPAT` / `QUIZ MAKAN` labels — always white + bright dot, not an action.
- `question` (19px, 800, snug): quiz question text — white on the ink header.
- `body-md` (13px): hints, microcopy, tenant reasons.
- `option` (14px, 700): quiz option labels.

## Layout

Single mobile column: container `max-w-md mx-auto px-4 pb-10` (`page-canvas`). **The background always lives on this container, not on body/root.** 4px baseline spacing: `sm` is the gap between segments/chips, `md` between cards, `lg` between sections.

## Shapes

Quiz header 14px, quiz option 20px, hero/list card 24px, CTA button min-height 56px, pill/chip full. Left accent strip = 5px border (ember for Tempat, rose for Makan). Progress segments = blocks (not a gradient bar), 5px gap, on = lime, off = white 22%.

## Components

- `page-canvas`: `max-w-md` container for all pages, bg paper + ink text.
- `quiz-ink-header` (Q2d/M3d): ink card containing a white label-caps + dot (`quiz-dot-place`/`quiz-dot-food`) + white question + lime block segments (`quiz-seg-on`). The only valid quiz header.
- `quiz-option` + `quiz-option-selected-place/food`: white option with a neutral border; selected = 2px ember/rose border + wash bg. Mall chips (GI/CP/Kokas/PIM/Aeon) follow the Makan selected pattern.
- `quiz-dot-place` / `quiz-dot-food`: 8px dot on the header label — the only use of bright.
- `quiz-seg-on`: lit block segment (lime, ink text on it). The only use of lime in the quiz.
- `strip-place`: 5px accent strip on the Tempat flow hero (pure ember, non-text).
- `voucher-gift` (V12): cream→rose gradient (tokens: rose-wash + border gift-border), 🎁 icon + `Ada −20% buat lu` + rose pill `Buka →`. 1 focal point per card.
- `voucher-gift-edge`: accent/border of the gift (`gift-border`) voucher card.
- `cta-place` / `cta-food`: one dominant action per screen, 56px tall, bold white text ≥14px. Tempat must use `ember-cta` (not pure ember — AA contrast).
- Results (Tempat & Makan) = list of 5 items, 3-tier pattern: hero + minis + full list. Never mix tourist places + tenants.

## Logo

Locked master: **D16 P3** — 56px die, W 29, die rotation -8°, ink tile, cream die, place + food dots. Master files in `app/public/`: `d16-day.svg` (ink tile, primary), `d16-night.svg` (transparent takeout die), `d16-mono.svg` (1-colour), `d16-lockup.svg` (icon + wordmark below), `d16-lockup-horizontal.svg` (icon left + wordmark right). Favicon = Day.

- **Used in:** web header H-LOCK, app icon + light splash Day, web dark mode (`prefers-color-scheme`) Night, WIK-XXXXX voucher receipt Mono, splash/T-shirt V-LOCK.
- **Don't:** stretch/squash, recolour, put Day on dark (dark = Night takeout), use Night as the app icon (launcher must be opaque — iOS rejects transparency). The die (W + 2 dots + rotation) must not be changed in any version.

## Do's and Don'ts

- **Do** use token references (`{colors.ember-cta}`) — don't hardcode hex in new components.
- **Do** keep the split: ember = Tempat, rose = Makan. Selected, CTA, strip follow their flow.
- **Do** use `ember-cta` for ALL white text on orange; pure ember is only for non-text surfaces (strip, selected border).
- **Do** use the tested helpers (`getQuizHeaderMeta`, `getQuizSegState`, `getVoucherCardMeta`, `getLogoAsset`) — not loose hex/paths in pages.
- **Don't** use lime for labels, CTAs, or large backgrounds. Lime = progress/value only.
- **Don't** make full red/orange 10px labels — fails AAA, labels are not actions.
- **Don't** mix Tempat + Makan results in one list.
- **Don't** put a background on body/root — always on the `max-w-md` container.
- **Don't** use colours outside the palette — add a token first, then use it.
- **Don't** tamper with the logo die (W + 2 dots + -8° rotation) in any version.
- **Don't** nest component variants (`cta-place.hover` is wrong; the sibling `cta-place-hover` is correct).
