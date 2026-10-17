/**
 * POST /api/tempat/recommend — Generate 5 rekomendasi TEMPAT (mode Plan).
 * Body: QuizTempatInput (mood, companion, budget, location, time?).
 * Quota MVP: cookie quota_used (anon 1x; habis → 403 LOGIN_REQUIRED).
 * Flow: cek quota → generateTempat() [LLM] → INSERT generations {type:'tempat'} → set cookie.
 * Result TIDAK campur tenant — kontrak split total (Addendum v1.1).
 */
import type { QuizTempatInput } from "../../../common/types/api";
import { supabaseAdmin } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const body = await readBody<QuizTempatInput>(event);
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

  const { generateTempat } = await import("../../utils/llm");
  const recommendations = await generateTempat(body);

  const db = supabaseAdmin();
  await db.from("generations").insert({
    session_id: sessionId,
    quiz_input: { ...body, type: "tempat" },
    recommendations,
  });
  setCookie(event, "quota_used", "1", { maxAge: 86400 });

  return { recommendations, quota_remaining: 0 };
});
