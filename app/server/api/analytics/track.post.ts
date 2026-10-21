/**
 * POST /api/analytics/track — public, whitelisted client events (currently: promo_click).
 *
 * WHAT: body { event, props } → 1 row in `analytics_events`. Always 204 (telemetry, not an API).
 * WHY a route and not a direct Supabase insert: the service key is server-only, so the browser
 *   cannot write to the DB. The whitelist lives next to the code that emits the event.
 * WHY always 204: a 4xx/5xx would only produce console noise the visitor cannot act on.
 * EXAMPLE: await $fetch("/api/analytics/track", { method: "POST",
 *   body: { event: "promo_click", props: { mall_slug: "grand-indonesia", tenant: "% Arabica" } } })
 */
import { CLIENT_EVENT_WHITELIST } from "../../../common/constants/analytics";
import { supabaseAdmin } from "../../utils/db";
import { sanitizeEventName, sanitizeProps } from "../../utils/clientEvent";
import { ensureSessionId } from "../../utils/sessionId";

export default defineEventHandler(async (event) => {
  setResponseStatus(event, 204);
  const body = await readBody<{ event?: unknown; props?: unknown }>(
    event,
  ).catch(() => null);
  const name = sanitizeEventName(body?.event);
  if (!CLIENT_EVENT_WHITELIST.includes(name)) return null;

  try {
    await supabaseAdmin()
      .from("analytics_events")
      .insert({
        event_type: name,
        session_id: ensureSessionId(event),
        metadata: sanitizeProps(body?.props),
      });
  } catch {
    // telemetry is best-effort — the click already navigated
  }
  return null;
});
