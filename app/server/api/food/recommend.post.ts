/**
 * POST /api/food/recommend — generate 5 TENANT recommendations (Mall mode).
 *
 * WHAT: gate (member 5/day in `mall_search_quota`, or the anonymous trial) → fetch candidate
 *   tenants → rank them with the LLM → store the deck → return deck + id + quota numbers.
 * WHY the quota is consumed AFTER a successful generate: a 404 ("no tenants match") or an LLM
 *   error must not burn a slot the user never received value for.
 * WHY the date is WIB and the upsert declares the composite PK: the row is keyed
 *   (user_id, date); reading without pinning today breaks `.single()` on day 2, and `.eq()`
 *   after `upsert()` is silently invalid on a write query.
 * EXAMPLE: POST { mall_slug, mission, budget_tier, companion } → { id, recommendations: [5] }.
 */
import type {
  QuizFoodInput,
  RecommendationResponse,
  TenantRecommendation,
} from "../../../common/types/api";
import { createError, readBody, type H3Event } from "h3";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../../utils/db";
import { getOptionalUserId } from "../../utils/requireUser";
import { ensureSessionId } from "../../utils/sessionId";
import { claimAnonRows } from "../../utils/claimAnonRows";
import { todayWIB } from "../../utils/voucherClaim";
import { MEMBER_FOOD_LIMIT } from "../../../common/constants/quota";
import { ANON_FOOD_LIMIT, remainingFor } from "../../utils/anonQuotaPolicy";
import { anonGate } from "../../utils/anonGate";
import { recordAnonGeneration } from "../../utils/anonQuotaStore";
import { insertGeneration } from "../../utils/insertGeneration";
import {
  fetchFoodCandidates,
  pickCandidate,
  toTenantRecommendation,
} from "../../utils/foodCandidates";

/** Read today's slot usage for a member (missing row = 0). */
async function readUsed(db: SupabaseClient, userId: string): Promise<number> {
  const { data, error } = await db
    .from("mall_search_quota")
    .select("used")
    .eq("user_id", userId)
    .eq("date", todayWIB())
    .maybeSingle();
  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "FOOD_QUOTA_CHECK_ERROR",
      data: { message: error.message },
    });
  }
  return data?.used ?? 0;
}

/** Take one member slot (composite-PK upsert). Returns the new used count. */
async function consumeSlot(
  db: SupabaseClient,
  userId: string,
): Promise<number> {
  // Re-read so the number stays honest when another tab incremented meanwhile.
  const usedNow = await readUsed(db, userId);
  const { error } = await db
    .from("mall_search_quota")
    .upsert(
      { user_id: userId, date: todayWIB(), used: usedNow + 1 },
      { onConflict: "user_id,date" },
    );
  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "FOOD_QUOTA_UPDATE_ERROR",
      data: { message: error.message },
    });
  }
  return usedNow + 1;
}

/** Candidates → LLM ranking → renderable recommendations (shared by both branches). */
async function rank(
  db: SupabaseClient,
  body: QuizFoodInput,
): Promise<ReturnType<typeof toTenantRecommendation>[]> {
  const candidates = await fetchFoodCandidates(db, body);
  const { rankTenants } = await import("../../utils/llm");
  const ranking = await rankTenants(body, candidates);
  return ranking.map((r) =>
    toTenantRecommendation(
      pickCandidate(candidates, r.name),
      r.reason,
      body.mall_slug,
    ),
  );
}

/**
 * Bootstrap the profile + today's quota row, then enforce the member wall.
 * WHY a helper: the handler reads as the happy path; the two failure modes (500 bootstrap,
 * 403 wall) are one concern and live together.
 */
async function assertMemberQuota(
  db: SupabaseClient,
  userId: string,
): Promise<void> {
  // Idempotent; there is no trigger on auth.users to create the quota rows.
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

  if ((await readUsed(db, userId)) >= MEMBER_FOOD_LIMIT) {
    // Already logged in → no "login" upsell, just an honest reset time.
    throw createError({
      statusCode: 403,
      statusMessage: "FOOD_QUOTA_EXCEEDED",
      data: {
        message:
          "Kuota makan kamu habis hari ini — reset jam 00.00 WIB ya. " +
          "Cari tempat tetap bisa (2/hari).",
      },
    });
  }
}

/** Logged-in branch: check the wall, generate, then consume the slot. */
async function memberRecommend(
  event: H3Event,
  userId: string,
): Promise<RecommendationResponse<TenantRecommendation>> {
  const body = await readBody<QuizFoodInput>(event);
  const db = supabaseAdmin();
  const sessionId = ensureSessionId(event);

  await assertMemberQuota(db, userId);

  const recommendations = await rank(db, body);
  // Generate succeeded → this request earned its slot.
  const used = await consumeSlot(db, userId);
  await claimAnonRows(db, sessionId, userId);
  const id = await insertGeneration(db, {
    sessionId,
    userId,
    kind: "food",
    body,
    recommendations,
  });

  return {
    id,
    recommendations,
    quota_remaining: Math.max(0, MEMBER_FOOD_LIMIT - used),
    quota_limit: MEMBER_FOOD_LIMIT,
    is_logged_in: true,
  };
}

/** Anonymous branch: server-side trial, generate, persist, record the IP soft cap. */
async function anonRecommend(
  event: H3Event,
): Promise<RecommendationResponse<TenantRecommendation>> {
  const body = await readBody<QuizFoodInput>(event);
  const db = supabaseAdmin();
  const { usage, ipHash, sessionId } = await anonGate(event, db, "food");

  const recommendations = await rank(db, body);
  const id = await insertGeneration(db, {
    sessionId,
    userId: null,
    kind: "food",
    body,
    recommendations,
  });
  await recordAnonGeneration(db, { sessionId, ipHash, kind: "food" });

  return {
    id,
    recommendations,
    quota_remaining: Math.max(0, remainingFor("food", usage) - 1),
    quota_limit: ANON_FOOD_LIMIT,
    is_logged_in: false,
  };
}

export default defineEventHandler(async (event) => {
  const userId = await getOptionalUserId(event);
  return userId ? memberRecommend(event, userId) : anonRecommend(event);
});
