/**
 * server/utils/makanCandidates.ts — Kandidat tenant quiz makan + bentuk rekomendasi akhir.
 *
 * APA: fetchMakanCandidates(db, body) (mall_slug→mall_id, filter tenants, limit 30, GRATIS),
 *   toTenantRecommendation(t, reason, slug) + pickCandidate(candidates, name).
 * KENAPA: handler makan/recommend dulu >50 baris + kompleksitas tinggi → dipecah.
 * Kosong → 404 ("Tidak ada tenant cocok. Coba ubah filter.").
 * Contoh: toTenantRecommendation(row, "cocok", "grand-indonesia").maps_url → link Google Maps.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createError } from "h3";
import type {
  QuizMakanInput,
  TenantRecommendation,
  TenantRow,
} from "../../common/types/api";
import type { MallRow } from "../../common/types/database";
import { buildMapsUrl } from "../../utils/url";
import { buildMakanEqFilters } from "./tenantFilters";

const MAX_CANDIDATES = 30;

/** Kandidat tenant (is_open + budget/halal/kids) untuk 1 mall. 404 kalau mall/tenant tidak ada. */
export async function fetchMakanCandidates(
  db: SupabaseClient,
  body: QuizMakanInput,
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
  for (const [column, value] of buildMakanEqFilters(body))
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

/** Cari kandidat by nama; tidak ketemu → kandidat pertama (LLM sudah divalidasi, ini jaring pengaman). */
export function pickCandidate(
  candidates: TenantRow[],
  name: string,
): TenantRow {
  const found = candidates.find((c) => c.name === name) ?? candidates[0];
  if (!found) throw new Error("NO_CANDIDATES");
  return found;
}

/** Tenant DB + reason LLM → kartu hasil (needs_survey: ada kolom tri-state yang masih NULL). */
export function toTenantRecommendation(
  t: TenantRow,
  reason: string,
  mallSlug: string,
): TenantRecommendation {
  return {
    name: t.name,
    category: t.category,
    lantai: t.lantai,
    halal: t.halal,
    budget_tier: t.budget_tier,
    price_range: t.price_range,
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
