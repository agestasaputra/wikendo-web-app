/**
 * features/mall/utils/directory.ts — Pure mall directory logic (search, area, floor, filter, label).
 *
 * WHAT: filterTenantsByKeyword, shortArea, formatFloor, buildDirCountLabel, buildTenantQuery. PURE.
 * WHY: used by mall list (short area) + mall detail (search/filter/pill) → 1 source.
 * EXAMPLE: shortArea("Thamrin / Menteng") → "Thamrin".
 */
import type { DirectoryFilters } from "../@types/mall";

/** Client-side search in the mall directory. Case-insensitive. */
export function filterTenantsByKeyword<T extends { name: string }>(
  tenants: T[],
  keyword: string,
): T[] {
  const kw = keyword.toLowerCase();
  return tenants.filter((t) => t.name.toLowerCase().includes(kw));
}

/** Full area → short 1:1 D1: shortest '/' segment (Thamrin, Grogol). Empty → ''. */
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

/** DB floor → S2c card label: numeric gets the L prefix (1→L1, 3A→L3A), building code as-is. */
export function formatFloor(floor: string): string {
  const t = (floor || "").trim();
  if (!t) return "";
  return /^[0-9]/.test(t) ? "L" + t.toUpperCase() : t;
}

/** S2c infinity pill: '🟢 10/40 tenant · scroll untuk 10 berikutnya ↓' (middle dot). */
export function buildDirCountLabel(loaded: number, total: number): string {
  return `🟢 ${loaded}/${total} tenant · scroll untuk 10 berikutnya ↓`;
}

/** 3 filter chips → server-side query (changing a filter = reset page). */
export function buildTenantQuery(
  filters: DirectoryFilters,
): Record<string, string> {
  return {
    ...(filters.halal ? { halal: "true" } : {}),
    ...(filters.budget ? { budget: "mid" } : {}),
    ...(filters.mission ? { mission: "long_hangout" } : {}),
  };
}
