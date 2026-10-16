/**
 * features/makan/utils/resultHero.ts — Data kartu hasil MAKAN (hero, chips, rank #1-3).
 *
 * APA: buildMakanHero(rec), buildMakanChips(list), buildRankItems(list). PURE.
 * KENAPA: dulu computed panjang di halaman → dipisah supaya testable + mudah dibaca.
 * Contoh: buildMakanHero(undefined).name → "—".
 */
import type { TenantRecommendation } from "~/common/types/api";
import type { MakanHero, RankItem } from "../@types/makan";

/** Halal tri-state → kata (null = belum verifikasi ❓). */
function halalWord(halal: boolean | null | undefined): string {
  if (halal === true) return "Halal";
  if (halal === false) return "Non-halal";
  return "❓";
}

/** 1 rekomendasi (boleh kosong) → data hero. Field kosong = "—"/"?". */
export function buildMakanHero(
  rec: Partial<TenantRecommendation> | undefined,
): MakanHero {
  const r = rec ?? {};
  return {
    name: r.name || "—",
    reason: r.reason || "—",
    price: r.price_range || "—",
    floor: r.lantai || "?",
    halal: r.halal ?? null,
    kids: r.kids_friendly ? "👶 kids" : "—",
    maps: r.maps_url || "#",
  };
}

/** 2 chip preview (rekomendasi ke-2 & ke-3), nama dipotong 6 huruf. */
export function buildMakanChips(list: TenantRecommendation[]): string[] {
  return list.slice(1, 3).map((r) => (r.name || "").slice(0, 6).trim() + "...");
}

/** Rank #1-3: nama + tag (halal · lantai · promo · alasan 28 huruf). */
export function buildRankItems(list: TenantRecommendation[]): RankItem[] {
  return list.slice(0, 3).map((r) => ({
    name: r.name || "—",
    tags: `${halalWord(r.halal)} · L${r.lantai || "?"} · -20% · ${(r.reason || "").slice(0, 28)}`,
  }));
}
