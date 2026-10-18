/**
 * GET /api/quota — Place+food split quota status (API contract §2, Addendum v1.3).
 *
 * WHAT: read anon cookies (quota_used 1x place, food_quota_used 2x food)
 * → build response via buildQuotaStatus() (same pure helper as wallet).
 * WHY: anon 1+2 vs login 2+5 — must be honest per user.
 * EXAMPLE: empty cookie → { place:{limit:1}, food:{limit:2}, is_logged_in:false }.
 */
import { defineEventHandler, getCookie, getHeader } from "h3";
import { supabaseAdmin } from "../utils/db";
import {
  buildQuotaStatus,
  parseAnonFoodUsed,
  parseAnonPlaceUsed,
} from "../../common/utils/quota";

/* eslint-disable complexity */
export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, "authorization") || "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
  const cookieToken = getCookie(event, "sb-access-token") || "";
  const token = bearer || cookieToken;
  const { data: authData, error: authErr } = token
    ? await supabaseAdmin().auth.getUser(token)
    : ({ data: null, error: null } as { data: null; error: null });
  const userId = !authErr && authData?.user ? authData.user.id : null;

  if (userId) {
    const [{ data: place }, { data: food }] = await Promise.all([
      supabaseAdmin()
        .from("user_quota")
        .select("quota_used, quota_limit, last_reset_at")
        .eq("user_id", userId)
        .single(),
      supabaseAdmin()
        .from("mall_search_quota")
        .select("used, date")
        .eq("user_id", userId)
        .single(),
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
