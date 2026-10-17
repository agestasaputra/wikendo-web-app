/**
 * server/utils/foodCandidates.ts — Food quiz tenant candidates + final recommendation shape.
 *
 * WHAT: fetchFoodCandidates(db, body) (mall_slug→mall_id, filter tenants, limit 30, FREE),
 *   toTenantRecommendation(t, reason, slug) + pickCandidate(candidates, name).
 * WHY: the food/recommend handler was previously >50 lines + high complexity → split out.
 * Empty → 404 ("Tidak ada tenant cocok. Coba ubah filter.").
 * EXAMPLE: toTenantRecommendation(row, "cocok", "grand-indonesia").maps_url → Google Maps link.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createError } from "h3";
import type {
  QuizFoodInput,
  TenantRecommendation,
  TenantRow,
} from "../../common/types/api";
import type { MallRow } from "../../common/types/database";
import { buildMapsUrl } from "../../utils/url";
import { buildFoodEqFilters } from "./tenantFilters";

const MAX_CANDIDATES = 30;

/** Tenant candidates (is_open + budget/halal/kids) for 1 mall. 404 if the mall/tenants don't exist. */
export async function fetchFoodCandidates(
  db: SupabaseClient,
  body: QuizFoodInput,
): Promise<TenantRow[]> {
  const { data: mall } = await db
    .from("malls")
    .select("id")
    .eq("slug", body.mall_slug)
    .single<Pick<MallRow, "id">>();
  if (!mall)
    throw createError({
      statusCode: 404,
      statusMessage: "Mall tidak ditemukan",
    });

  let q = db
    .from("tenants")
    .select("*")
    .eq("mall_id", mall.id)
    .eq("is_open", true);
  for (const [column, value] of buildFoodEqFilters(body))
    q = q.eq(column, value);
  const { data } = await q.limit(MAX_CANDIDATES);
  const candidates = (data || []) as TenantRow[];
  if (!candidates.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "Tidak ada tenant cocok. Coba ubah filter.",
    });
  }
  return candidates;
}

/** Find candidate by name; not found → first candidate (LLM already validated, this is a safety net). */
export function pickCandidate(
  candidates: TenantRow[],
  name: string,
): TenantRow {
  const found = candidates.find((c) => c.name === name) ?? candidates[0];
  if (!found) throw new Error("NO_CANDIDATES");
  return found;
}

/** DB tenant + LLM reason → result card (needs_survey: some tri-state column is still NULL). */
export function toTenantRecommendation(
  t: TenantRow,
  reason: string,
  mallSlug: string,
): TenantRecommendation {
  return {
    name: t.name,
    category: t.category,
    floor: t.floor,
    halal: t.halal,
    budget_tier: t.budget_tier,
    price_min: t.price_min,
    price_max: t.price_max,
    kids_friendly: t.kids_friendly,
    hype_tiktok: t.hype_tiktok,
    reason,
    maps_url: buildMapsUrl(t.name, mallSlug),
    data_source: t.data_source || "curated",
    needs_survey:
      t.needs_survey ??
      (t.halal == null || t.kids_friendly == null || t.hype_tiktok == null),
  };
}
