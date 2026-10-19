/**
 * POST /api/food/recommend — Generate 5 TENANT recommendations (Mall mode).
 * Body: QuizFoodInput (mall_slug, mission, budget_tier, companion, halal_only?, kids_friendly?).
 * Kuota untuk pengguna ter-login disimpan di tabel `mall_search_quota` (5 per hari, PK user_id+date).
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
import { extractAccessToken } from "../../utils/authToken";
import { ensureSessionId } from "../../utils/sessionId";
import { claimAnonRows } from "../../utils/claimAnonRows";
import { todayWIB } from "../../utils/voucherClaim";

/* eslint-disable max-lines-per-function, complexity */
const ANON_FOOD_LIMIT = 2;
const LOGGED_IN_FOOD_LIMIT = 5;

export default defineEventHandler(async (event) => {
  const body = await readBody<QuizFoodInput>(event);
  const sessionId = ensureSessionId(event);

  // ---- Detect login (Bearer first — the browser client has no auth cookie) ----
  const token = extractAccessToken(event);
  const { data: authData, error: authErr } = token
    ? await supabaseAdmin().auth.getUser(token)
    : { data: null, error: null };
  const userId = !authErr && authData?.user ? authData.user.id : null;

  // ---- Logged-in flow (DB quota) ----
  if (userId) {
    const db = supabaseAdmin();
    // Bootstrap the profile + today's quota row (idempotent; no trigger on auth.users).
    const { error: bootErr } = await db.rpc("initialize_new_user", {
      p_user_id: userId,
    });
    if (bootErr) {
      throw createError({
        statusCode: 500,
        statusMessage: "FOOD_QUOTA_BOOTSTRAP_ERROR",
        data: { message: bootErr.message },
      });
    }

    // The PK is (user_id, date) → every read MUST pin today's date or `.single()`
    // breaks as soon as yesterday's row still exists. Date is WIB (browser + users are GMT+7).
    const today = todayWIB();
    const { data: quotaRow, error: fetchErr } = await db
      .from("mall_search_quota")
      .select("used")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle();
    if (fetchErr) {
      throw createError({
        statusCode: 500,
        statusMessage: "FOOD_QUOTA_CHECK_ERROR",
        data: { message: fetchErr.message },
      });
    }
    const used = quotaRow?.used ?? 0;
    if (used >= LOGGED_IN_FOOD_LIMIT) {
      throw createError({
        statusCode: 403,
        statusMessage: "FOOD_QUOTA_EXCEEDED",
        data: { message: "Kuota makan Anda habis. Reset jam 00:00 WIB" },
      });
    }

    // ---- Generate FIRST: a failed generate (404 no tenant, LLM error) must not burn a slot ----
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

    // Generate succeeded → consume the slot now. Re-read so the number stays honest if
    // another tab incremented meanwhile (`upsert` MUST declare the composite PK; chaining
    // `.eq()` after `upsert` — the old code — is invalid on a write query).
    const { data: fresh } = await db
      .from("mall_search_quota")
      .select("used")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle();
    const usedNow = fresh?.used ?? used;
    const { error: upErr } = await db
      .from("mall_search_quota")
      .upsert(
        { user_id: userId, date: today, used: usedNow + 1 },
        { onConflict: "user_id,date" },
      );
    if (upErr) {
      throw createError({
        statusCode: 500,
        statusMessage: "FOOD_QUOTA_UPDATE_ERROR",
        data: { message: upErr.message },
      });
    }

    await db.from("generations").insert({
      session_id: sessionId,
      user_id: userId,
      quiz_input: { ...body, type: "food" },
      recommendations,
    });
    // Adopt rows this browser generated while anonymous (quiz first, login at the quota wall).
    await claimAnonRows(db, sessionId, userId);
    return {
      recommendations,
      quota_remaining: LOGGED_IN_FOOD_LIMIT - (usedNow + 1),
    };
  }

  // ---- Anonymous flow (cookie based) ----
  const usedAnon = parseInt(getCookie(event, "food_quota_used") || "0");
  if (usedAnon >= ANON_FOOD_LIMIT) {
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
    session_id: sessionId,
    user_id: null,
    quiz_input: { ...body, type: "food" },
    recommendations,
  });
  setCookie(event, "food_quota_used", String(usedAnon + 1), {
    maxAge: 86400,
    path: "/",
  });

  return { recommendations, quota_remaining: ANON_FOOD_LIMIT - (usedAnon + 1) };
});
