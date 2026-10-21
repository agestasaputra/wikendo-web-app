/**
 * common/utils/loader.ts — skeleton meta + default shape per screen.
 *
 * WHAT: getLoaderMeta(variant) → accent color + title + hint. PURE.
 *   defaultLayout(variant) → the shape that matches that screen's real content.
 * WHY: 1 component on 4 surfaces → consistent message + color, and the skeleton always
 *   mirrors what is about to appear (no spinner floating above a card list).
 * EXAMPLE: getLoaderMeta("food").accent → "#ee2c4b"; defaultLayout("mall") → "mall-list".
 */
import type { LoaderLayout, LoaderMeta, LoaderVariant } from "../types/loader";

const LOADER_META: Record<LoaderVariant, LoaderMeta> = {
  place: {
    accent: "#f97316",
    title: "Lagi cariin tempat yang cocok…",
    hint: "LLM lagi ranking 5 tempat • 30–45 detik",
  },
  food: {
    accent: "#ee2c4b",
    title: "Lagi cariin tenant yang cocok…",
    hint: "Filter tenant + ranking LLM • 20 detik",
  },
  mall: {
    accent: "#0e7490",
    title: "Lagi muat tenant…",
    hint: "Direktori mall • tanpa LLM, bentar doang",
  },
  history: {
    accent: "#0c0a09",
    title: "Lagi buka riwayatmu…",
    hint: "Riwayat di HP ini • tanpa login",
  },
  account: {
    accent: "#0c0a09",
    title: "Lagi cek akunmu…",
    hint: "Sesi login • sebentar",
  },
};

/** The shape each screen really renders: mall index = card list, detail = rows, results = deck. */
const DEFAULT_LAYOUT: Record<LoaderVariant, LoaderLayout> = {
  place: "result-place",
  food: "result-food",
  mall: "mall-list",
  history: "history-list",
  account: "account",
};

/** How many bones each shape draws when the caller does not pass `count`.
 *  WHY: derived from the RESOLVED layout (a variant can override the shape, e.g. mall detail),
 *  so a 7-row tenant list never gets 4 rows just because the variant defaults to cards. */
const DEFAULT_COUNT: Record<LoaderLayout, number> = {
  "mall-list": 4,
  "tenant-list": 7,
  "result-place": 1,
  "result-food": 1,
  "history-list": 3,
  account: 1,
};

/** Wrong variant = fallback to mall (safe, no crash). */
export function getLoaderMeta(variant: LoaderVariant): LoaderMeta {
  return LOADER_META[variant] ?? LOADER_META.mall;
}

/** Layout for a variant; a page can override it when the same variant has 2 shapes (mall). */
export function defaultLayout(variant: LoaderVariant): LoaderLayout {
  return DEFAULT_LAYOUT[variant] ?? "mall-list";
}

/** Bones to draw for a shape when `count` is omitted (mall list 4 · tenant rows 7 · history 3). */
export function defaultCount(layout: LoaderLayout): number {
  return DEFAULT_COUNT[layout] ?? 4;
}
