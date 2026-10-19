/**
 * GET /api/quota — Place+food split quota status (API contract §2, Addendum v1.3).
 *
 * WHAT: read anon cookies (quota_used 1x place, food_quota_used 2x food) or the logged-in
 *   rows from DB → build response via buildQuotaStatus() (same pure helper as wallet).
 * WHY: anon 1+2 vs login 2+5 — must be honest per user. The food row is WIB-dated
 *   (PK user_id+date), so it MUST be filtered by today or `.single()` throws on day 2.
 * EXAMPLE: empty cookie → { place:{limit:1}, food:{limit:2}, is_logged_in:false }.
 */
import { defineEventHandler, getCookie } from "h3";
import { supabaseAdmin } from "../utils/db";
import { extractAccessToken } from "../utils/authToken";
import { todayWIB } from "../utils/voucherClaim";
import {
  buildQuotaStatus,
  parseAnonFoodUsed,
  parseAnonPlaceUsed,
} from "../../common/utils/quota";

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
    const placeUsed = place?.quota_used ?? 0;
    const foodUsed = food?.used ?? 0;
    return buildQuotaStatus({
      placeUsed,
      foodUsed,
      isLoggedIn: true,
      resetAt: place?.last_reset_at ?? null,
    });
  }

  const placeUsed = parseAnonPlaceUsed(getCookie(event, "quota_used"));
  const foodUsed = parseAnonFoodUsed(getCookie(event, "food_quota_used"));
  return buildQuotaStatus({ placeUsed, foodUsed, isLoggedIn: false });
});
