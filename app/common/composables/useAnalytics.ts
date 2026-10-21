/**
 * common/composables/useAnalytics.ts — ONE place the browser sends telemetry.
 *
 * WHAT: trackEvent(name, props) → keepalive POST to /api/analytics/track, never throws.
 * WHY a composable: promo_click is emitted from 2 components today (PromoStrip + TenantCard)
 *   and the endpoint name/whitelist must not drift between them.
 * WHY keepalive + void: a promo row navigates immediately; a normal fetch would be cancelled
 *   by the page transition. `keepalive` lets the request finish after unload.
 * WHY silent: telemetry failure must never block a tap or produce a console error for users.
 * EXAMPLE: trackEvent("promo_click", { mall_slug: slug, tenant: t.name })
 */

export function trackEvent(
  name: string,
  props: Record<string, string | number | boolean> = {},
): void {
  if (typeof window === "undefined") return; // SSR: nothing to send
  try {
    void $fetch("/api/analytics/track", {
      method: "POST",
      body: { event: name, props },
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // $fetch unavailable (unit test / offline) — telemetry is optional
  }
}
