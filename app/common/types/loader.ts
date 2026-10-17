/**
 * common/types/loader.ts — CONTRACT for the API fetching spinner (1 helper + 1 component).
 *
 * WHAT: accent color variant per page.
 * - place = orange #f97316 · food = red #ee2c4b · mall = teal #0e7490 (without LLM)
 * Used by: getLoaderMeta() in common/utils/loader + common/components/AppLoader.vue.
 */
export type LoaderVariant = "place" | "food" | "mall";

export interface LoaderMeta {
  accent: string;
  title: string;
  hint: string;
}
