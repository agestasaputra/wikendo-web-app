/**
 * features/mall/utils/directory.ts — Logic murni direktori mall (search, area, lantai, filter, label).
 *
 * APA: filterTenantsByKeyword, shortArea, formatLantai, priceShort, buildDirCountLabel, buildTenantQuery. PURE.
 * KENAPA: dipakai mall list (area pendek) + mall detail (search/filter/pill) → 1 sumber.
 * Contoh: shortArea("Thamrin / Menteng") → "Thamrin".
 */
import type { DirectoryFilters } from "../@types/mall";

/** Search client-side di direktori mall. Case-insensitive. */
export function filterTenantsByKeyword<T extends { name: string }>(
  tenants: T[],
  keyword: string,
): T[] {
  const kw = keyword.toLowerCase();
  return tenants.filter((t) => t.name.toLowerCase().includes(kw));
}

/** Area full → pendek 1:1 D1: segmen '/' terpendek (Thamrin, Grogol). Kosong → ''. */
export function shortArea(area: string | undefined): string {
  if (!area) return "";
  const segs = area
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  return segs.reduce(
    (best, s) => (s.length < best.length ? s : best),
    segs[0] ?? "",
  );
}

/** Lantai DB → label kartu S2c: angka prefix L (1→L1, 3A→L3A), kode gedung as-is. */
export function formatLantai(lantai: string): string {
  const t = (lantai || "").trim();
  if (!t) return "";
  return /^[0-9]/.test(t) ? "L" + t.toUpperCase() : t;
}

/** 'Rp 50-90rb' → '50-90rb' (1:1 S2c, tanpa prefix Rp). */
export function priceShort(price: string): string {
  if (!price) return "";
  return price.replace(/^Rp\s*/i, "").trim();
}

/** Pill infinity S2c: '🟢 10/40 tenant · scroll untuk 10 berikutnya ↓' (middle dot). */
export function buildDirCountLabel(loaded: number, total: number): string {
  return `🟢 ${loaded}/${total} tenant · scroll untuk 10 berikutnya ↓`;
}

/** 3 chip filter → query server-side (ganti filter = reset page). */
export function buildTenantQuery(
  filters: DirectoryFilters,
): Record<string, string> {
  return {
    ...(filters.halal ? { halal: "true" } : {}),
    ...(filters.budget ? { budget: "menengah" } : {}),
    ...(filters.mission ? { mission: "nongkrong_lama" } : {}),
  };
}
