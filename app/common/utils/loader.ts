/**
 * common/utils/loader.ts — Meta spinner fetching API per variant.
 *
 * APA: getLoaderMeta(variant) → warna aksen + judul + hint. PURE.
 * KENAPA: dipakai AppLoader di 3 halaman → pesan + warna konsisten.
 * Contoh: getLoaderMeta("makan").accent → "#ee2c4b".
 */
import type { LoaderMeta, LoaderVariant } from "../types/loader";

const LOADER_META: Record<LoaderVariant, LoaderMeta> = {
  tempat: {
    accent: "#f97316",
    title: "Lagi cariin tempat yang cocok…",
    hint: "LLM lagi ranking 5 tempat • 30–45 detik",
  },
  makan: {
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

/** Variant ngaco = fallback mall (aman, tidak crash). */
export function getLoaderMeta(variant: LoaderVariant): LoaderMeta {
  return LOADER_META[variant] ?? LOADER_META.mall;
}
