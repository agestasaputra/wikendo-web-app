/**
 * POST /api/history/claim — adopt this browser's anonymous quiz rows into the account.
 *
 * WHAT: 401 wall → read the httpOnly session_id → claimAnonRows(db, sessionId, userId).
 * WHY: a visitor answers the quiz first and logs in afterwards (the quota wall is exactly that
 *   moment). Without this, anonymous rows stay `user_id = NULL` and are only visible through the
 *   fragile session_id fallback (breaks when the cookie expires or on another device).
 * WHY best-effort: a claim failure must never block login or the redirect — history still falls
 *   back to the session_id filter. Idempotent: rows already owned are skipped.
 * EXAMPLE: POST /api/history/claim + Bearer → 200 { claimed: true }.
 */
import { defineEventHandler, getCookie } from "h3";
import { supabaseAdmin } from "../../utils/db";
import { requireAuthUser } from "../../utils/requireUser";
import { claimAnonRows } from "../../utils/claimAnonRows";

export default defineEventHandler(async (event) => {
  const userId = await requireAuthUser(
    event,
    "Login required to claim history",
  );
  const sessionId = getCookie(event, "session_id") || "";
  await claimAnonRows(supabaseAdmin(), sessionId, userId);
  return { claimed: true, session_id: sessionId || null };
});
