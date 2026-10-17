/**
 * server/utils/tenantFilters.ts — Tenant filters → list of `.eq(column, value)` conditions (pure).
 *
 * WHAT: buildDirectoryEqFilters(query) (directory), buildFoodEqFilters(body) (food quiz),
 *   filterByMission(list, mission) (array column, in-memory).
 * WHY: the handler was previously full of nested `if` (complexity over the limit). Condition data is separated from the query builder.
 * NULL RULE (tri-state): halal/kids NULL = not researched yet. `.eq(true)` → NULL is automatically excluded
 *   (safe, no overclaim). The directory shows rows as-is + a ❓ badge in the UI.
 * EXAMPLE: buildDirectoryEqFilters({ halal: "true" }) → [["halal", true]].
 */
import type { QuizFoodInput, TenantRow } from "../../common/types/api";
import { coerceBool } from "../../utils/boolean";

export type EqFilter = [column: string, value: string | boolean];

/** Directory query (?halal=true ?budget=… ?kids=true) → eq conditions. */
export function buildDirectoryEqFilters(
  query: Record<string, unknown>,
): EqFilter[] {
  const out: EqFilter[] = [];
  if (query.halal === "true") out.push(["halal", true]);
  if (query.budget) out.push(["budget_tier", String(query.budget)]);
  if (query.kids === "true") out.push(["kids_friendly", true]);
  return out;
}

/** Food quiz body → eq conditions. coerceBool: "false" (string) from the query must not turn the filter on. */
export function buildFoodEqFilters(body: QuizFoodInput): EqFilter[] {
  const out: EqFilter[] = [];
  if (body.budget_tier) out.push(["budget_tier", body.budget_tier]);
  if (coerceBool(body.halal_only)) out.push(["halal", true]);
  if (coerceBool(body.kids_friendly)) out.push(["kids_friendly", true]);
  return out;
}

/** In-memory filter: tenants whose `mission` contains the value (array column). No mission = all. */
export function filterByMission(
  list: TenantRow[],
  mission: unknown,
): TenantRow[] {
  if (!mission) return list;
  return list.filter((t) => (t.mission || []).includes(String(mission)));
}
