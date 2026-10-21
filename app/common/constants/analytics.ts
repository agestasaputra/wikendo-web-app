/**
 * common/constants/analytics.ts — Event names for the directory funnel (ONE owner).
 *
 * WHAT: the only event types the browser is allowed to send + the server-side names.
 * WHY a whitelist: `/api/analytics/track` is public (no login). Without a fixed list any
 *   script could write arbitrary rows into `analytics_events` and poison the dashboard.
 *   The client list is deliberately SMALL — server-side events (search/filter) are recorded
 *   inside the tenants endpoint where they cannot be blocked by an adblocker.
 * EXAMPLE: trackEvent(ANALYTICS_EVENTS.promoClick, { slug, tenant });
 */
export const ANALYTICS_EVENTS = {
  /** Server: a directory request that carried ?search=. */
  directorySearch: "directory_search",
  /** Server: a directory request that carried a filter chip (?halal/?budget/?mission/?kids). */
  directoryFilter: "directory_filter",
  /** Client: a tap on a promo row / promo badge (CTR of the promo strip). */
  promoClick: "promo_click",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/** Events the PUBLIC endpoint accepts (server-side names are written directly, not posted). */
export const CLIENT_EVENT_WHITELIST: readonly string[] = [
  ANALYTICS_EVENTS.promoClick,
];
