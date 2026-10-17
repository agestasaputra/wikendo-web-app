/**
 * POST /api/food/recommend — Generate 5 TENANT recommendations (Mall mode).
 * Body: QuizFoodInput (mall_slug, mission, budget_tier, companion, halal_only?, kids_friendly?).
 * MVP quota: food_quota_used cookie (anon max 2; used up → 403 FOOD_QUOTA_EXCEEDED). Separate from the place quota.
 * Flow: check quota → Supabase tenant candidates (server/utils/foodCandidates, FREE, limit 30)
 * → rankTenants() [LLM Top 5 ranking] → merge tenant data + maps_url → INSERT generations {type:'food'} → quota +1.
 * NULL RULE (tri-state): halal/kids/hype NULL = not researched yet (see server/utils/tenantFilters.ts).
 */
import type { QuizFoodInput } from "../../../common/types/api";
import { supabaseAdmin } from "../../utils/db";
import {
  fetchFoodCandidates,
  pickCandidate,
  toTenantRecommendation,
} from "../../utils/foodCandidates";

const ANON_FOOD_LIMIT = 2;

export default defineEventHandler(async (event) => {
  const body = await readBody<QuizFoodInput>(event);
  const used = parseInt(getCookie(event, "food_quota_used") || "0");

  if (used >= ANON_FOOD_LIMIT) {
    throw createError({
      statusCode: 403,
      statusMessage: "FOOD_QUOTA_EXCEEDED",
      data: {
        message: "Quota makan habis. Login untuk 5x/hari, reset 00:00 WIB.",
      },
    });
  }

  const db = supabaseAdmin();
  const candidates = await fetchFoodCandidates(db, body);
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
    quiz_input: { ...body, type: "food" },
    recommendations,
  });
  setCookie(event, "food_quota_used", String(used + 1), { maxAge: 86400 });

  return { recommendations, quota_remaining: ANON_FOOD_LIMIT - (used + 1) };
});
