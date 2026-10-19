/**
 * POST /api/place/recommend — Generate 5 PLACE recommendations (Plan mode).
 * Body: QuizPlaceInput (mood, companion, budget, location, time?).
 * MVP quota: logged-in 2/day (DB), anonymous 1/day (cookie `quota_used`).
 * Flow: resolve user → bootstrap quota rows → increment quota → generatePlace() [LLM] → INSERT generations.
 * Result NEVER mixes in tenants — total split contract (Addendum v1.1).
 */
import type { QuizPlaceInput } from "../../../common/types/api";
import { supabaseAdmin } from "../../utils/db";
import { extractAccessToken } from "../../utils/authToken";
import { ensureSessionId } from "../../utils/sessionId";
import { claimAnonRows } from "../../utils/claimAnonRows";
import { getCookie, setCookie, createError, readBody } from "h3";

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
      throw createError({
        statusCode: 403,
        statusMessage: "QUOTA_EXCEEDED",
        data: { message: "Kuota place Anda habis. Reset jam 00:00 WIB" },
      });
    }
    const remaining = row.remaining ?? 0;

    const { generatePlace } = await import("../../utils/llm");
    const recommendations = await generatePlace(body);
    const db = supabaseAdmin();
    // Adopt rows this browser generated while anonymous (quiz first, login at the quota wall).
    await claimAnonRows(db, sessionId, userId);
    await db.from("generations").insert({
      session_id: sessionId,
      user_id: userId,
      quiz_input: { ...body, type: "place" },
      recommendations,
    });
    return { recommendations, quota_remaining: remaining };
  }

  // Anonymous flow (cookie based)
  const used = getCookie(event, "quota_used");
  if (used === "1") {
    throw createError({
      statusCode: 403,
      statusMessage: "LOGIN_REQUIRED",
      data: { message: "Login untuk generate lagi" },
    });
  }

  const { generatePlace } = await import("../../utils/llm");
  const recommendations = await generatePlace(body);

  const db = supabaseAdmin();
  await db.from("generations").insert({
    session_id: sessionId,
    user_id: null,
    quiz_input: { ...body, type: "place" },
    recommendations,
  });
  setCookie(event, "quota_used", "1", { maxAge: 86400, path: "/" });

  return { recommendations, quota_remaining: 0 };
});
