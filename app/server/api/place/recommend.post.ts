/**
 * POST /api/place/recommend — Generate 5 PLACE recommendations (Plan mode).
 * Body: QuizPlaceInput (mood, companion, budget, location, time?).
 * MVP quota: quota_used cookie (anon 1x; used up → 403 LOGIN_REQUIRED).
 * Flow: check quota → generatePlace() [LLM] → INSERT generations {type:'place'} → set cookie.
 * Result NEVER mixes in tenants — total split contract (Addendum v1.1).
 */
import type { QuizPlaceInput } from "../../../common/types/api";
import { supabaseAdmin } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const body = await readBody<QuizPlaceInput>(event);
  const sessionId = getCookie(event, "session_id") || crypto.randomUUID();
  setCookie(event, "session_id", sessionId, { maxAge: 86400 * 30 });

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
    quiz_input: { ...body, type: "place" },
    recommendations,
  });
  setCookie(event, "quota_used", "1", { maxAge: 86400 });

  return { recommendations, quota_remaining: 0 };
});
