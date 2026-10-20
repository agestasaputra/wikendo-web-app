/**
 * features/place/@types/place.ts — UI contract for the place mode.
 *
 * WHAT: ResultPlaceMeta (R3b card tokens: ember strip + best lime + action ink) + PlaceHero (hero deck card).
 * Used by: getResultPlaceMeta() + buildPlaceHero() in features/place/utils + PlaceResultPage.vue.
 */
export interface ResultPlaceMeta {
  strip: string;
  bestBg: string;
  bestColor: string;
  actionBg: string;
  actionColor: string;
  cardBg: string;
  moreBg: string;
  moreColor: string;
}

export interface PlaceHero {
  name: string;
  category: string;
  reason: string;
  cost: string;
  area: string;
  areaLabel: string;
  time: string;
  rating: string;
  vibe: string;
  emoji: string;
  bg: string;
}
