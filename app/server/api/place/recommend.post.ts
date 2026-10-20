/**
 * POST /api/place/recommend — generate 5 PLACE recommendations (Plan mode).
 *
 * WHAT: validate the body → gate (member quota or anonymous trial) → generatePlace() [LLM] →
 *   store the deck in `generations` → return the deck + the stored id + quota numbers.
 * WHY the deck is stored and the id returned: a result link must be reopenable without paying
 *   quota twice. The id IS the address (`/result-place?id=<uuid>`).
 * WHY generate AFTER the member slot is taken but refunded on failure: `check_and_increment_quota`
 *   is the atomic check, so a crash between check and generate must not silently eat a slot.
 * RULES: a place deck NEVER mixes tenants — total split contract (Addendum v1.1).
 * EXAMPLE: POST { mood, companion, budget, location } → { id, recommendations: [5], quota_remaining }
 */
import type {
  PlaceRecommendation,
  QuizPlaceInput,
  RecommendationResponse,
} from "../../../common/types/api";
import { createError, readBody, type H3Event } from "h3";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../../utils/db";
import { getOptionalUserId } from "../../utils/requireUser";
import { ensureSessionId } from "../../utils/sessionId";
import { claimAnonRows } from "../../utils/claimAnonRows";
import { refundPlaceQuota } from "../../utils/refundPlaceQuota";
import { MEMBER_PLACE_LIMIT } from "../../../common/constants/quota";
import { ANON_PLACE_LIMIT, remainingFor } from "../../utils/anonQuotaPolicy";
import { anonGate } from "../../utils/anonGate";
import { recordAnonGeneration } from "../../utils/anonQuotaStore";
import { insertGeneration } from "../../utils/insertGeneration";

/**
 * Read the single row returned by a `RETURNS TABLE` RPC.
 * WHY: PostgREST hands back an ARRAY for a set-returning function, so `result.allowed` was
 *   always `undefined` → `?? false` → every logged-in user got a 403 on their first quiz.
 */
function firstRow<T>(data: T[] | T | null): T | null {
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

/** Bootstrap (idempotent) + atomically take one place slot. Returns the slots left. */
async function takeMemberSlot(
  db: SupabaseClient,
  userId: string,
): Promise<number> {
  // `initialize_new_user` is idempotent and there is NO trigger on auth.users, so without it
  // the quota SELECT finds no row → the RPC returns nothing → a phantom 403 on the first quiz.
  const { error: bootErr } = await db.rpc("initialize_new_user", {
    p_user_id: userId,
  });
  if (bootErr) {
    throw createError({
      statusCode: 500,
      statusMessage: "QUOTA_BOOTSTRAP_ERROR",
      data: { message: bootErr.message },
    });
  }

  const { data, error } = await db.rpc("check_and_increment_quota", {
    p_user_id: userId,
  });
  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "QUOTA_CHECK_ERROR",
      data: { message: error.message },
    });
  }
  const row = firstRow<{ allowed: boolean; remaining: number }>(data);
  if (!row || !row.allowed) {
    // Already logged in → never sell them a login they already have.
    throw createError({
      statusCode: 403,
      statusMessage: "QUOTA_EXCEEDED",
      data: {
        message:
          "Kuota tempat kamu habis hari ini — reset jam 00.00 WIB ya. " +
          "Cari makan tetap bisa (5/hari).",
      },
    });
  }
  return row.remaining ?? 0;
}

/** Generate a deck, refunding the slot when the LLM produces nothing. */
async function generateOrRefund(
  db: SupabaseClient,
  userId: string,
  body: QuizPlaceInput,
): Promise<PlaceRecommendation[]> {
  const { generatePlace } = await import("../../utils/llm");
  try {
    return await generatePlace(body);
  } catch (err) {
    await refundPlaceQuota(db, userId);
    throw err;
  }
}

/** Logged-in branch: atomic slot, LLM, adopt anon rows, persist. */
async function memberRecommend(
  event: H3Event,
  userId: string,
): Promise<RecommendationResponse<PlaceRecommendation>> {
  const body = await readBody<QuizPlaceInput>(event);
  const db = supabaseAdmin();
  const sessionId = ensureSessionId(event);

  const remaining = await takeMemberSlot(db, userId);
  const recommendations = await generateOrRefund(db, userId, body);
  // Adopt rows this browser generated while anonymous (quiz first, login at the wall).
  await claimAnonRows(db, sessionId, userId);
  const id = await insertGeneration(db, {
    sessionId,
    userId,
    kind: "place",
    body,
    recommendations,
  });

  return {
    id,
    recommendations,
    quota_remaining: remaining,
    quota_limit: MEMBER_PLACE_LIMIT,
    is_logged_in: true,
  };
}

/** Anonymous branch: server-side trial, generate, persist, record the IP soft cap. */
async function anonRecommend(
  event: H3Event,
): Promise<RecommendationResponse<PlaceRecommendation>> {
  const body = await readBody<QuizPlaceInput>(event);
  const db = supabaseAdmin();
  const { usage, ipHash, sessionId } = await anonGate(event, db, "place");

  const { generatePlace } = await import("../../utils/llm");
  const recommendations = await generatePlace(body);
  const id = await insertGeneration(db, {
    sessionId,
    userId: null,
    kind: "place",
    body,
    recommendations,
  });
  await recordAnonGeneration(db, { sessionId, ipHash, kind: "place" });

  return {
    id,
    recommendations,
    quota_remaining: Math.max(0, remainingFor("place", usage) - 1),
    quota_limit: ANON_PLACE_LIMIT,
    is_logged_in: false,
  };
}

export default defineEventHandler(async (event) => {
  const userId = await getOptionalUserId(event);
  return userId ? memberRecommend(event, userId) : anonRecommend(event);
});
