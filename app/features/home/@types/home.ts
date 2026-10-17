/**
 * features/home/@types/home.ts — Hero token CONTRACT for home I17 V2 Ember P1.
 *
 * WHAT: headBg ink #0C0A09 + ember strip #EA580C + lime-on-dark number #D9F99D + lime pill #A3E635
 *   + ink CTA + paper page #F5F5F4 + white card + mint badge.
 * Used by: getHomeHeroMeta() in features/home/utils/homeHero + HomePage.vue.
 */
export interface HomeHeroMeta {
  headBg: string;
  strip: string;
  numColor: string;
  pillBg: string;
  pillColor: string;
  ctaBg: string;
  ctaColor: string;
  pageBg: string;
  cardBg: string;
  tagBg: string;
  tagColor: string;
}
