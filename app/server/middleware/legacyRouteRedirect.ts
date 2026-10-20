/**
 * server/middleware/legacyRouteRedirect.ts — keep the old quiz URLs alive forever.
 *
 * WHAT: 301 /quiz → /place and /result → /result-place, QUERY STRING INTACT.
 * WHY: the place answers travel in the query string (/result?mood=fun&companion=group…).
 *   A bare routeRules redirect drops `?…`, so a bookmarked or shared legacy link would
 *   land on an empty result deck. The mapping itself lives in server/utils/legacyRoutes
 *   (pure + unit-tested); this file is only the HTTP wrapper.
 * WHY 301: the rename is permanent — Google transfers the ranking signal and the browser
 *   stops asking after the first hit. Exact-path match only, so /place, /result-place and
 *   /result-food are never redirected.
 * EXAMPLE: GET /result?mood=fun&budget=hemat → 301 Location: /result-place?mood=fun&budget=hemat
 */
import { defineEventHandler, getRequestURL, sendRedirect } from "h3";
import { legacyRedirectTarget } from "../utils/legacyRoutes";

export default defineEventHandler((event) => {
  const url = getRequestURL(event);
  const target = legacyRedirectTarget(url.pathname, url.search);
  if (!target) return;
  return sendRedirect(event, target, 301);
});
