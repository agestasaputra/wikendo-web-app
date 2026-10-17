/**
 * GET /api/quota — Place+food split quota status (API contract §2, Addendum v1.3).
 *
 * WHAT: read anon cookies (quota_used 1x place, food_quota_used 2x food)
 * → build the response via buildQuotaStatus() (the SAME pure helper used by
 * the wallet page — 1 interpretation, not duplicated logic per caller).
 * WHY: the static home wallet "2 • 5" = register limit → a lie for anon.
 * This endpoint makes the wallet honest, following the actually remaining count.
 * Auth (register 2+5) comes with a later login slice: no session infra yet, so
 * now it's always the anon path. No LLM/DB — free, fast.
 * EXAMPLE: empty cookie → { place:{used:0,limit:1,remaining:1}, food:{used:0,limit:2,remaining:2}, is_logged_in:false, ... }.
 */
import {
  buildQuotaStatus,
  parseAnonFoodUsed,
  parseAnonPlaceUsed,
} from "../../common/utils/quota";

export default defineEventHandler((event) => {
  const placeUsed = parseAnonPlaceUsed(getCookie(event, "quota_used"));
  const foodUsed = parseAnonFoodUsed(getCookie(event, "food_quota_used"));

  return buildQuotaStatus({ placeUsed, foodUsed, isLoggedIn: false });
});
