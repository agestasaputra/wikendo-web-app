/**
 * server/utils/tenantFilters.ts — Filter tenant → daftar kondisi `.eq(kolom, nilai)` (pure).
 *
 * APA: buildDirectoryEqFilters(query) (direktori), buildMakanEqFilters(body) (quiz makan),
 *   filterByMission(list, mission) (array kolom, di-memory).
 * KENAPA: handler dulu penuh `if` bertingkat (kompleksitas > batas). Data kondisi dipisah dari query builder.
 * ATURAN NULL (tri-state): halal/kids NULL = belum riset. `.eq(true)` → NULL otomatis ke-exclude
 *   (aman, tidak overclaim). Direktori tampil apa adanya + badge ❓ di UI.
 * Contoh: buildDirectoryEqFilters({ halal: "true" }) → [["halal", true]].
 */
import type { QuizMakanInput, TenantRow } from "../../common/types/api";
import { coerceBool } from "../../utils/boolean";

export type EqFilter = [column: string, value: string | boolean];

/** Query direktori (?halal=true ?budget=… ?kids=true) → kondisi eq. */
export function buildDirectoryEqFilters(
  query: Record<string, unknown>,
): EqFilter[] {
  const out: EqFilter[] = [];
  if (query.halal === "true") out.push(["halal", true]);
  if (query.budget) out.push(["budget_tier", String(query.budget)]);
  if (query.kids === "true") out.push(["kids_friendly", true]);
  return out;
}

/** Body quiz makan → kondisi eq. coerceBool: "false" (string) dari query tidak boleh nyalakan filter. */
export function buildMakanEqFilters(body: QuizMakanInput): EqFilter[] {
  const out: EqFilter[] = [];
  if (body.budget_tier) out.push(["budget_tier", body.budget_tier]);
  if (coerceBool(body.halal_only)) out.push(["halal", true]);
  if (coerceBool(body.kids_friendly)) out.push(["kids_friendly", true]);
  return out;
}

/** Filter di-memory: tenant yang `mission`-nya memuat nilai (kolom array). Tanpa mission = semua. */
export function filterByMission(
  list: TenantRow[],
  mission: unknown,
): TenantRow[] {
  if (!mission) return list;
  return list.filter((t) => (t.mission || []).includes(String(mission)));
}
