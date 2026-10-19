/**
 * POST /api/history/claim — Adopt this browser's anonymous quiz rows into the logged-in account.
 *
 * WHAT: 401 auth guard → read httpOnly session_id cookie → claimAnonRows(db, sessionId, userId).
 * WHY: "claim on login" — a visitor answers the quiz first and logs in afterwards (the quota wall
 *   is exactly that moment). Without this, anon rows stay `user_id = NULL` and are only visible
 *   via the fragile session_id fallback (breaks when the cookie expires or the user switches
 *   device). Claiming makes ownership explicit and makes "riwayat lintas device" real.
 * WHY best-effort: claim failure must never block login or the redirect; history still falls back
 *   to the session_id filter. Idempotent: rows already owned are skipped (`.is("user_id", null)`).
 * EXAMPLE: POST /api/history/claim + Bearer token → 200 { claimed: true }.
 */
import { defineEventHandler, createError, getCookie } from "h3";
import { supabaseAdmin } from "../../utils/db";
import { extractAccessToken } from "../../utils/authToken";
import { claimAnonRows } from "../../utils/claimAnonRows";

export default defineEventHandler(async (event) => {
  const accessToken = extractAccessToken(event);
  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: "LOGIN_REQUIRED",
      data: { message: "Login required to claim history" },
    });
  }

  const { data: authData, error: authErr } =
    await supabaseAdmin().auth.getUser(accessToken);
  if (authErr || !authData?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "LOGIN_REQUIRED",
      data: { message: "Invalid session. Please login again." },
    });
  }
  const userId = authData.user.id;

  const sessionId = getCookie(event, "session_id") || "";
  await claimAnonRows(supabaseAdmin(), sessionId, userId);

  return { claimed: true, session_id: sessionId || null };
});
