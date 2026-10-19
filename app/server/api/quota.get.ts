/**
 * GET /api/quota — Place+food split quota status (API contract §2, Addendum v1.4).
 *
 * WHAT: read the logged-in rows from DB, or count anonymous usage on the SERVER from the
 *   `generations` ledger (httpOnly `session_id` + salted-IP soft cap) → build the response
 *   via buildQuotaStatus() (same pure helper as the wallet).
 * WHY: anon 1+1 vs login 2+5 — must be honest per user. The old version trusted cookies
 *   (`quota_used`, `food_quota_used`) that the client could clear, so the wallet could say
 *   "still full" while the gate refused (or the reverse).
 * WHY the food row is WIB-dated (PK user_id+date): it MUST be filtered by today or
 *   `.single()` throws on day 2.
 * EXAMPLE: fresh visitor → { place:{limit:1}, food:{limit:1}, is_logged_in:false }.
 */
import { defineEventHandler, getRequestIP } from "h3";
import { supabaseAdmin } from "../utils/db";
import { extractAccessToken } from "../utils/authToken";
import { ensureSessionId } from "../utils/sessionId";
import { getAnonUsage, wibDay } from "../utils/anonQuotaStore";
import { hashIp, ipSalt } from "../utils/anonQuotaPolicy";
import { buildQuotaStatus } from "../../common/utils/quota";

/* eslint-disable complexity */
export default defineEventHandler(async (event) => {
  const token = extractAccessToken(event);
  const { data: authData, error: authErr } = token
    ? await supabaseAdmin().auth.getUser(token)
    : ({ data: null, error: null } as { data: null; error: null });
  const userId = !authErr && authData?.user ? authData.user.id : null;

  if (userId) {
    const db = supabaseAdmin();
    // A fresh account has no quota rows yet — bootstrap them (idempotent) so the wallet
    // shows 2 • 5 instead of silently falling back to anonymous numbers.
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

  // Anonymous: count what this browser actually generated today (same source as the gate,
  // so the wallet can never disagree with the wall).
  const sessionId = ensureSessionId(event);
  const ipHash = hashIp(
    getRequestIP(event, { xForwardedFor: true }) || "unknown",
    ipSalt(wibDay()),
  );
  const usage = await getAnonUsage(supabaseAdmin(), sessionId, ipHash);
  return buildQuotaStatus({
    placeUsed: usage.place,
    foodUsed: usage.food,
    isLoggedIn: false,
  });
});
