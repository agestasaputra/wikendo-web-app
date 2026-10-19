/**
 * server/utils/claimAnonRows.ts — adopt this browser's anonymous quiz rows after login.
 *
 * WHAT: claimAnonRows(db, sessionId, userId) → UPDATE generations SET user_id = userId
 *   WHERE session_id = sessionId AND user_id IS NULL.
 * WHY: a visitor answers the quiz first and logs in afterwards (the quota wall is exactly that
 *   moment). Without adoption those rows stay `user_id = NULL` forever and the logged-in
 *   /history can only show them via the session_id fallback — which breaks the moment the
 *   cookie expires or the user opens another device. Claiming makes ownership explicit.
 * WHY session_id is safe: it is an httpOnly per-browser UUID (30 days) set by ensureSessionId,
 *   never a user-supplied value, so a user can only adopt rows written by their own browser.
 * EXAMPLE: await claimAnonRows(supabaseAdmin(), sessionId, userId);
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/** Best-effort: never throws, quiz generation must not fail because of the adoption step. */
export async function claimAnonRows(
  db: SupabaseClient,
  sessionId: string,
  userId: string,
): Promise<void> {
  if (!sessionId || !userId) return;
  try {
    await db
      .from("generations")
      .update({ user_id: userId })
      .eq("session_id", sessionId)
      .is("user_id", null);
  } catch {
    // ignore — history still falls back to the session_id filter
  }
}
