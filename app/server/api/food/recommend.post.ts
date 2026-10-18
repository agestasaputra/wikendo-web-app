/**
 * POST /api/food/recommend — Generate 5 TENANT recommendations (Mall mode).
 * Body: QuizFoodInput (mall_slug, mission, budget_tier, companion, halal_only?, kids_friendly?).
 * Kuota untuk pengguna ter‑login disimpan di tabel `mall_search_quota` (5 per hari).
 * Untuk anonim tetap gunakan cookie `food_quota_used` (max 2).
 */
import type { QuizFoodInput } from "../../../common/types/api";
import { supabaseAdmin } from "../../utils/db";
import {
  fetchFoodCandidates,
  pickCandidate,
  toTenantRecommendation,
} from "../../utils/foodCandidates";
import { readBody, getCookie, setCookie, createError } from "h3";

const ANON_FOOD_LIMIT = 2;

export default defineEventHandler(async (event) => {
  const body = await readBody<QuizFoodInput>(event);

  // ---- Detect login ----
  const token = getCookie(event, "sb-access-token");
  const { data: authData, error: authErr } = token ? await supabaseAdmin().auth.getUser(token) : { data: null, error: null };
  const userId = (!authErr && authData?.user) ? authData.user.id : null;

  // ---- Logged‑in flow (DB quota) ----
  if (userId) {
    // fetch current quota row (or treat not‑found as 0)
    const { data: quotaRow, error: fetchErr } = await supabaseAdmin()
      .from('mall_search_quota')
      .select('used, date')
      .eq('user_id', userId)
      .single();
    if (fetchErr && fetchErr.code !== 'PGRST116') { // ignore not‑found error code
      throw createError({
        statusCode: 500,
        statusMessage: "FOOD_QUOTA_CHECK_ERROR",
        data: { message: fetchErr.message },
      });
    }
    const used = quotaRow?.used ?? 0;
    if (used >= 5) {
      throw createError({
        statusCode: 403,
        statusMessage: "FOOD_QUOTA_EXCEEDED",
        data: { message: "Kuota makan Anda habis. Reset jam 00:00 WIB" },
      });
    }
    // increment quota atomically via upsert (date = today)
    const today = new Date().toISOString().split('T')[0];
    const { error: upErr } = await supabaseAdmin()
      .from('mall_search_quota')
      .upsert({ user_id: userId, date: today, used: used + 1 })
      .eq('user_id', userId);
    if (upErr) {
      throw createError({
        statusCode: 500,
        statusMessage: "FOOD_QUOTA_UPDATE_ERROR",
        data: { message: upErr.message },
      });
    }

    // ---- Generate recommendations ----
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

    await db.from('generations').insert({
      session_id: getCookie(event, "session_id") || crypto.randomUUID(),
      user_id: userId,
      quiz_input: { ...body, type: "food" },
      recommendations,
    });
    // Update anon cookie for consistency (optional, not used for logged‑in)
    setCookie(event, "food_quota_used", String(used + 1), { maxAge: 86400 });
    return { recommendations, quota_remaining: 5 - (used + 1) };
  }

  // ---- Anonymous flow (cookie based) ----
  const usedAnon = parseInt(getCookie(event, "food_quota_used") || "0");
  if (usedAnon >= ANON_FOOD_LIMIT) {
    throw createError({
      statusCode: 403,
      statusMessage: "FOOD_QUOTA_EXCEEDED",
      data: { message: "Quota makan habis. Login untuk 5x/hari, reset 00:00 WIB." },
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

  await db.from('generations').insert({
    session_id: getCookie(event, "session_id") || crypto.randomUUID(),
    user_id: null,
    quiz_input: { ...body, type: "food" },
    recommendations,
  });
  setCookie(event, "food_quota_used", String(usedAnon + 1), { maxAge: 86400 });

  return { recommendations, quota_remaining: ANON_FOOD_LIMIT - (usedAnon + 1) };
});

