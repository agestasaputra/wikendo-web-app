/**
 * GET /api/quota — place+food split quota status (API contract §2, Addendum v1.4).
 *
 * WHAT: logged-in → read the DB rows; anonymous → count today's rows from the `generations`
 *   ledger (httpOnly session_id + salted-IP soft cap). Both go through buildQuotaStatus(),
 *   the same pure helper the wallet uses.
 * WHY: anon 1+1 vs member 2+5 must be honest per user. The old version trusted cookies the
 *   client could clear, so the wallet could say "still full" while the gate refused.
 * WHY the food row is WIB-dated (PK user_id+date): it MUST be filtered by today or
 *   `.single()` throws on day 2.
 * EXAMPLE: fresh visitor → { place:{limit:1}, food:{limit:1}, is_logged_in:false }.
 */
import { defineEventHandler, type H3Event } from "h3";
import { supabaseAdmin } from "../utils/db";
import { getOptionalUserId } from "../utils/requireUser";
import { getAnonUsage } from "../utils/anonQuotaStore";
import { buildQuotaStatus } from "../../common/utils/quota";
import type { QuotaStatus } from "../../common/types/quota";
import { todayWIB } from "../utils/voucherClaim";
import { currentIpHash } from "../utils/anonGate";
import { ensureSessionId } from "../utils/sessionId";

/** Member status: two indexed single-row reads, in parallel. */
async function memberStatus(userId: string): Promise<QuotaStatus> {
  const db = supabaseAdmin();
  // A fresh account has no quota rows yet — bootstrap them (idempotent) so the wallet shows
  // 2 • 5 instead of silently falling back to anonymous numbers.
  await db.rpc("initialize_new_user", { p_user_id: userId });

  const [{ data: place }, { data: food }] = await Promise.all([
    db
      .from("user_quota")
      .select("quota_used, quota_limit, last_reset_at")
      .eq("user_id", userId)
      .maybeSingle(),
    db
      .from("mall_search_quota")
      .select("used")
      .eq("user_id", userId)
      .eq("date", todayWIB())
      .maybeSingle(),
  ]);

  return buildQuotaStatus({
    placeUsed: place?.quota_used ?? 0,
    foodUsed: food?.used ?? 0,
    isLoggedIn: true,
    resetAt: place?.last_reset_at ?? null,
  });
}

/** Anonymous status: count what this browser generated today (same source as the gate). */
async function anonStatus(event: H3Event): Promise<QuotaStatus> {
  const usage = await getAnonUsage(
    supabaseAdmin(),
    ensureSessionId(event),
    currentIpHash(event),
  );
  return buildQuotaStatus({
    placeUsed: usage.place,
    foodUsed: usage.food,
    isLoggedIn: false,
  });
}

export default defineEventHandler(async (event) => {
  const userId = await getOptionalUserId(event);
  return userId ? memberStatus(userId) : anonStatus(event);
});
