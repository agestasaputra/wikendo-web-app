/**
 * common/composables/useGaAnalytics.ts — ONE place the browser sends events to Google Analytics 4.
 *
 * WHAT: trackGaEvent(name, params) → window.gtag("event", name, params), never throws.
 * WHY separate from useAnalytics: that one writes to OUR db (/api/analytics/track); this one
 *   only talks to GA. Two destinations, two jobs — a caller picks one or both explicitly.
 * WHY silent no-op: window.gtag only exists when NUXT_PUBLIC_GA_ID is set (plugins/gtag.client.ts)
 *   and adblockers block it, so a missing or throwing gtag must never surface to the visitor.
 * WHY no PII in params: GA terms forbid it and UU PDP applies — send slugs/enums, never
 *   search text, email or IP.
 * WHY trackGaPageView builds page_location itself: gtag's default is the full href, and an OAuth
 *   callback carries tokens in the query/hash — origin + path keeps them out of GA.
 * EXAMPLE: trackGaEvent("promo_click", { mall_slug: slug, surface: "promo_strip" })
 */

export type GaParams = Record<string, string | number | boolean>;

export function trackGaEvent(name: string, params: GaParams = {}): void {
  if (typeof window === "undefined") return; // SSR: nothing to send
  try {
    window.gtag?.("event", name, params);
  } catch {
    // gtag blocked or broken — telemetry is optional
  }
}

/** Send a GA4 page_view for a route (path only — no query string, no hash). */
export function trackGaPageView(path: string, title: string): void {
  if (typeof window === "undefined") return;
  trackGaEvent("page_view", {
    page_location: `${window.location.origin}${path}`,
    page_title: title,
  });
}
