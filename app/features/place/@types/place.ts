/**
 * features/tempat/@types/tempat.ts — KONTRAK UI mode Tempat.
 *
 * APA: ResultTempatMeta (token kartu R3b: strip ember + best lime + aksi ink) + TempatHero (kartu hero deck).
 * Dipakai: getResultTempatMeta() + buildTempatHero() di features/tempat/utils + TempatResultPage.vue.
 */
export interface ResultTempatMeta {
  strip: string;
  bestBg: string;
  bestColor: string;
  actionBg: string;
  actionColor: string;
  pageBg: string;
  cardBg: string;
  moreBg: string;
  moreColor: string;
}

export interface TempatHero {
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
