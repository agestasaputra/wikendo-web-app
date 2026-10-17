/**
 * features/tempat/utils/resultHero.ts — Data kartu hero result TEMPAT dari 1 rekomendasi.
 *
 * APA: buildTempatHero(rec, idx) + buildTempatMapsUrl(name). PURE.
 * KENAPA: dulu computed 1 baris panjang di halaman → dipisah supaya testable + mudah dibaca.
 * Contoh: buildTempatHero({ name: "Rooftop", location_area: "Senayan, Jaksel" }, 0).areaLabel → "SENAYAN".
 */
import type { TempatRecommendation } from "~/common/types/api";
import type { TempatHero } from "../@types/tempat";

const HERO_EMOJIS = ["🌇", "☕", "🌳", "🎡", "🌊"];
const HERO_GRADIENTS = [
  "linear-gradient(140deg,#ffedd5,#fdba74)",
  "linear-gradient(140deg,#fef3c7,#fcd34d)",
  "linear-gradient(140deg,#dcfce7,#86efac)",
  "linear-gradient(140deg,#e0e7ff,#a5b4fc)",
  "linear-gradient(140deg,#cffafe,#67e8f9)",
];

/** Area "Senayan, Jaksel" → "SENAYAN" (kata pertama huruf saja), kosong → "JKT". */
function toAreaLabel(area: string): string {
  const firstPart = area.split(",")[0] ?? "";
  const firstWord = firstPart.split(" ")[0] ?? "";
  return firstWord.replace(/[^A-Za-z]/g, "").toUpperCase() || "JKT";
}

/** Nilai kosong/undefined → "—". */
function orDash(value: string | undefined): string {
  return value || "—";
}

/** Rekomendasi (boleh kosong) + index kartu → data hero deck. Field kosong = "—". */
export function buildTempatHero(
  rec: Partial<TempatRecommendation> | undefined,
  idx: number,
): TempatHero {
  const r = rec ?? {};
  const area = orDash(r.location_area);
  return {
    name: orDash(r.name),
    category: r.category || "tempat",
    reason: orDash(r.reason),
    cost: orDash(r.estimated_cost),
    area,
    areaLabel: toAreaLabel(area),
    time: orDash(r.best_time),
    rating: "4.8",
    vibe: (r.reason || "sunset + live music").slice(0, 24),
    emoji: HERO_EMOJIS[idx % HERO_EMOJIS.length] ?? "🌇",
    bg: HERO_GRADIENTS[idx % HERO_GRADIENTS.length] ?? "",
  };
}

/** Link Google Maps search untuk 1 tempat (Jakarta). */
export function buildTempatMapsUrl(name: string): string {
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(`${name} Jakarta`)
  );
}
