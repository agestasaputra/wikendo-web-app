/**
 * features/tempat/utils/resultMeta.ts — Token kartu result TEMPAT R3b (photo + lime).
 *
 * APA: getResultTempatMeta() → warna. PURE. Token lock Agesta: lime=nilai, ember=strip, ink=aksi.
 * KENAPA: 1 sumber kebenaran, bukan hardcode hex di template TempatResultPage.
 * Contoh: getResultTempatMeta().strip → "#EA580C".
 */
import type { ResultTempatMeta } from "../@types/tempat";

/** Meta kartu result tempat R3b: strip ember + best lime + aksi ink. */
export function getResultTempatMeta(): ResultTempatMeta {
  return {
    strip: "#EA580C",
    bestBg: "#A3E635",
    bestColor: "#0C0A09",
    actionBg: "#0C0A09",
    actionColor: "#fff",
    pageBg: "#F5F5F4",
    cardBg: "#fff",
    moreBg: "#0C0A09",
    moreColor: "#A3E635",
  };
}
