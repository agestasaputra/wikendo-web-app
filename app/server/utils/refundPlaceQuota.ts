/**
 * server/utils/refundPlaceQuota.ts — give a consumed place slot back when the request produced nothing.
 *
 * WHAT: refundPlaceQuota(db, userId) → user_quota.quota_used = max(quota_used - 1, 0).
 * WHY: the logged-in place flow consumes the slot BEFORE the LLM call because
 *   `check_and_increment_quota` is the atomic check (and applies the 24h reset). If
 *   `generatePlace()` then fails (LLM timeout / provider error) the user lost a slot
 *   for a request that returned nothing — refund it so retries stay possible.
 * WHY best-effort: a refund failure must never mask the original error (the request
 *   already failed). The realistic race (2 requests, 1 fails mid-flight) is harmless
 *   for an MVP quota — undercount favours the user.
 * EXAMPLE: try { generatePlace() } catch (err) { await refundPlaceQuota(db, userId); throw err; }
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export async function refundPlaceQuota(
  db: SupabaseClient,
  userId: string,
): Promise<void> {
  if (!userId) return;
  try {
    const { data } = await db
      .from("user_quota")
      .select("quota_used")
      .eq("user_id", userId)
      .maybeSingle();
    const used = data?.quota_used ?? 0;
    if (used <= 0) return;
    await db
      .from("user_quota")
      .update({ quota_used: used - 1 })
      .eq("user_id", userId)
      .gt("quota_used", 0);
  } catch {
    // ignore — the original request error is what matters
  }
}
