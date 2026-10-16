/**
 * POST /api/makan/recommend — Generate 5 rekomendasi TENANT (mode Mall).
 * Body: QuizMakanInput (mall_slug, mission, budget_tier, companion, halal_only?, kids_friendly?).
 * Quota MVP: cookie makan_quota_used (anon max 2; habis → 403 MAKAN_QUOTA_EXCEEDED). Terpisah dari quota tempat.
 * Flow: cek quota → kandidat tenants Supabase (server/utils/makanCandidates, GRATIS, limit 30)
 * → rankTenants() [LLM ranking Top 5] → gabung data tenant + maps_url → INSERT generations {type:'makan'} → quota +1.
 * ATURAN NULL (tri-state): halal/kids/hype NULL = belum riset (lihat server/utils/tenantFilters.ts).
 */
import type { QuizMakanInput } from "../../../common/types/api";
import { supabaseAdmin } from "../../utils/db";
import {
  fetchMakanCandidates,
  pickCandidate,
  toTenantRecommendation,
} from "../../utils/makanCandidates";

const ANON_MAKAN_LIMIT = 2;

export default defineEventHandler(async (event) => {
  const body = await readBody<QuizMakanInput>(event);
  const used = parseInt(getCookie(event, "makan_quota_used") || "0");

  if (used >= ANON_MAKAN_LIMIT) {
    throw createError({
      statusCode: 403,
      statusMessage: "MAKAN_QUOTA_EXCEEDED",
      data: {
        message: "Quota makan habis. Login untuk 5x/hari, reset 00:00 WIB.",
      },
    });
  }

  const db = supabaseAdmin();
  const candidates = await fetchMakanCandidates(db, body);
  const { rankTenants } = await import("../../utils/llm");
  const ranking = await rankTenants(body, candidates);

  const recommendations = ranking.map((r) =>
    toTenantRecommendation(
      pickCandidate(candidates, r.name),
      r.reason,
      body.mall_slug,
    ),
  );

  await db.from("generations").insert({
    session_id: getCookie(event, "session_id") || "anon",
    quiz_input: { ...body, type: "makan" },
    recommendations,
  });
  setCookie(event, "makan_quota_used", String(used + 1), { maxAge: 86400 });

  return { recommendations, quota_remaining: ANON_MAKAN_LIMIT - (used + 1) };
});
