/**
 * POST /api/place/recommend — Generate 5 PLACE recommendations (Plan mode).
 * Body: QuizPlaceInput (mood, companion, budget, location, time?).
 * Quota: member 2/day (DB `user_quota`), anonymous 1/day counted on the SERVER from the
 *   `generations` ledger (httpOnly `session_id` + salted-IP soft cap) — never a client cookie.
 * Flow: resolve user → bootstrap quota rows → increment quota → generatePlace() [LLM] → INSERT generations.
 * Result NEVER mixes in tenants — total split contract (Addendum v1.1).
 */
import type { QuizPlaceInput } from "../../../common/types/api";
import { supabaseAdmin } from "../../utils/db";
import { extractAccessToken } from "../../utils/authToken";
import { ensureSessionId } from "../../utils/sessionId";
import { claimAnonRows } from "../../utils/claimAnonRows";
import { refundPlaceQuota } from "../../utils/refundPlaceQuota";
import { getRequestIP, createError, readBody } from "h3";
import {
  ANON_PLACE_LIMIT,
  canUse,
  hashIp,
  ipSalt,
  loginWallMessage,
  remainingFor,
} from "../../utils/anonQuotaPolicy";
import {
  getAnonUsage,
  recordAnonGeneration,
  wibDay,
} from "../../utils/anonQuotaStore";

/**
 * Read the single row returned by the `RETURNS TABLE` quota function.
 * WHY: PostgREST hands back an ARRAY for a set-returning function, so `result.allowed`
 *   was always `undefined` → `?? false` → every logged-in user got a 403 on their
 *   first quiz even with a full quota. Normalizing here keeps the handler readable.
 */
function firstRow<T>(data: T[] | T | null): T | null {
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

/* eslint-disable max-lines-per-function, complexity */
export default defineEventHandler(async (event) => {
  const sessionId = ensureSessionId(event);

  // Determine if user is logged in (Bearer first — the browser client has no auth cookie)
  const token = extractAccessToken(event);
  const { data: authData, error: authErr } = token
    ? await supabaseAdmin().auth.getUser(token)
    : { data: null, error: null };
  const userId = !authErr && authData?.user ? authData.user.id : null;
  const body = await readBody<QuizPlaceInput>(event);

  if (userId) {
    // Ensure the profile + quota rows exist before touching them. `initialize_new_user`
    // is idempotent (ON CONFLICT DO NOTHING) and there is no trigger on auth.users, so
    // without this the quota SELECT finds no row and the function returns nothing → 403.
    const { error: bootErr } = await supabaseAdmin().rpc(
      "initialize_new_user",
      {
        p_user_id: userId,
      },
    );
    if (bootErr) {
      throw createError({
        statusCode: 500,
        statusMessage: "QUOTA_BOOTSTRAP_ERROR",
        data: { message: bootErr.message },
      });
    }

    const { data: result, error: quotaErr } = await supabaseAdmin().rpc(
      "check_and_increment_quota",
      { p_user_id: userId },
    );
    if (quotaErr) {
      throw createError({
        statusCode: 500,
        statusMessage: "QUOTA_CHECK_ERROR",
        data: { message: quotaErr.message },
      });
    }
    const row = firstRow<{ allowed: boolean; remaining: number }>(result);
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
    const remaining = row.remaining ?? 0;

    const { generatePlace } = await import("../../utils/llm");
    // The slot was consumed above (atomic check). If the LLM fails, refund it so the
    // user does not lose a slot for a request that returned nothing.
    let recommendations;
    try {
      recommendations = await generatePlace(body);
    } catch (err) {
      await refundPlaceQuota(supabaseAdmin(), userId);
      throw err;
    }
    const db = supabaseAdmin();
    // Adopt rows this browser generated while anonymous (quiz first, login at the quota wall).
    await claimAnonRows(db, sessionId, userId);
    // Read the id back: the id IS the address of this result (`/result-place?id=<uuid>`).
    // A failed save must not cost the user their slot — the deck still renders, it just
    // cannot be reopened later (same behaviour as before, now logged instead of silent).
    const { data: saved, error: saveErr } = await db
      .from("generations")
      .insert({
        session_id: sessionId,
        user_id: userId,
        quiz_input: { ...body, type: "place" },
        recommendations,
      })
      .select("id")
      .single();
    if (saveErr) console.error("place recommend: save failed", saveErr.message);
    return {
      id: saved?.id,
      recommendations,
      quota_remaining: remaining,
      quota_limit: 2,
      is_logged_in: true,
    };
  }

  // ---- Anonymous flow: quota is decided on the SERVER (httpOnly session_id + IP soft cap) ----
  const db = supabaseAdmin();
  const ipHash = hashIp(
    getRequestIP(event, { xForwardedFor: true }) || "unknown",
    ipSalt(wibDay()),
  );
  const usage = await getAnonUsage(db, sessionId, ipHash);
  if (!canUse("place", usage)) {
    throw createError({
      statusCode: 403,
      statusMessage: "LOGIN_REQUIRED",
      data: { message: loginWallMessage(), login_cta: true },
    });
  }

  const { generatePlace } = await import("../../utils/llm");
  const recommendations = await generatePlace(body);

  const { data: saved, error: saveErr } = await db
    .from("generations")
    .insert({
      session_id: sessionId,
      user_id: null,
      quiz_input: { ...body, type: "place" },
      recommendations,
    })
    .select("id")
    .single();
  if (saveErr) console.error("place recommend: save failed", saveErr.message);
  await recordAnonGeneration(db, { sessionId, ipHash, kind: "place" });
  // No client-readable quota cookie: the counter is derived from the row above.

  return {
    id: saved?.id,
    recommendations,
    quota_remaining: Math.max(0, remainingFor("place", usage) - 1),
    quota_limit: ANON_PLACE_LIMIT,
    is_logged_in: false,
  };
});
