/**
 * common/types/loader.ts — KONTRAK spinner fetching API (1 helper + 1 komponen).
 *
 * APA: variant warna aksen per halaman.
 * - tempat = orange #f97316 · makan = merah #ee2c4b · mall = teal #0e7490 (tanpa LLM)
 * Dipakai: getLoaderMeta() di common/utils/loader + common/components/AppLoader.vue.
 */
export type LoaderVariant = "tempat" | "makan" | "mall";

export interface LoaderMeta {
  accent: string;
  title: string;
  hint: string;
}
