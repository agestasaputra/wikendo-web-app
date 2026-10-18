/**
 * POST /api/place/recommend — Generate 5 PLACE recommendations (Plan mode).
 * Body: QuizPlaceInput (mood, companion, budget, location, time?).
 * MVP quota: quota_used cookie (anon 1x; used up → 403 LOGIN_REQUIRED).
 * Flow: check quota → generatePlace() [LLM] → INSERT generations {type:'place'} → set cookie.
 * Result NEVER mixes in tenants — total split contract (Addendum v1.1).
 */
import type { QuizPlaceInput } from "../../../common/types/api";
import { supabaseAdmin } from "../../utils/db";
import { getCookie, setCookie, createError, readBody } from "h3";

/* eslint-disable max-lines-per-function, complexity */
export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, "session_id") || crypto.randomUUID();
  setCookie(event, "session_id", sessionId, { maxAge: 86400 * 30 });

  // Determine if user is logged in via Supabase access token
  const token = getCookie(event, "sb-access-token");
  const { data: authData, error: authErr } = token
    ? await supabaseAdmin().auth.getUser(token)
    : { data: null, error: null };
  const userId = !authErr && authData?.user ? authData.user.id : null;
  const body = await readBody<QuizPlaceInput>(event);

  if (userId) {
    // Logged‑in: use server‑side quota via DB function
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
    const allowed = result?.allowed ?? false;
    const remaining = result?.remaining ?? 0;
    if (!allowed) {
      throw createError({
        statusCode: 403,
        statusMessage: "LOGIN_REQUIRED",
        data: { message: "Kuota place Anda habis. Reset jam 00:00 WIB" },
      });
    }
    // proceed, quota remaining (for response) = remaining
    const { generatePlace } = await import("../../utils/llm");
    const recommendations = await generatePlace(body);
    const db = supabaseAdmin();
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
  setCookie(event, "quota_used", "1", { maxAge: 86400 });

  return { recommendations, quota_remaining: 0 };
});
