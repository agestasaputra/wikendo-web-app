/**
 * common/types/loader.ts — CONTRACT for the loading skeleton (1 helper + 1 component).
 *
 * WHAT: `LoaderVariant` = which screen is loading (drives copy + accent color).
 *   place = orange #f97316 · food = red #ee2c4b · mall = teal #0e7490 (directory, no LLM)
 *   history/account = ink #0c0a09 (personal pages, same ink as their real cards)
 *   `LoaderLayout` = which SHAPE the skeleton draws, because a skeleton must look like the
 *   content it replaces (a list card screen gets list cards, not one spinner).
 * Used by: getLoaderMeta() in common/utils/loader + common/components/AppLoader.vue.
 */
export type LoaderVariant = "place" | "food" | "mall" | "history" | "account";

/** One shape per real layout: mall index cards, tenant rows, place deck, food deck,
 *  history image cards, account identity card + hub rows. */
export type LoaderLayout =
  | "mall-list"
  | "tenant-list"
  | "result-place"
  | "result-food"
  | "history-list"
  | "account";

export interface LoaderMeta {
  accent: string;
  title: string;
  hint: string;
}
