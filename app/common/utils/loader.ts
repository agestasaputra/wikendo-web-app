/**
 * common/utils/loader.ts — Spinner meta for API fetching per variant.
 *
 * WHAT: getLoaderMeta(variant) → accent color + title + hint. PURE.
 * WHY: used by AppLoader on 3 pages → consistent message + color.
 * EXAMPLE: getLoaderMeta("food").accent → "#ee2c4b".
 */
import type { LoaderMeta, LoaderVariant } from "../types/loader";

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
};

/** Wrong variant = fallback to mall (safe, no crash). */
export function getLoaderMeta(variant: LoaderVariant): LoaderMeta {
  return LOADER_META[variant] ?? LOADER_META.mall;
}
