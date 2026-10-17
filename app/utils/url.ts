/**
 * utils/url.ts — Pure URL builder.
 *
 * WHAT: buildMapsUrl(tenant, mall) → Google Maps search link. PURE.
 * EXAMPLE: buildMapsUrl("Kopi Kenangan", "grand-indonesia").
 */

/** Build a Google Maps link for 1 tenant. Used by the server food/recommend. */
export function buildMapsUrl(tenantName: string, mallSlug: string): string {
  return (
    "https://www.google.com/maps/search/" +
    encodeURIComponent(`${tenantName} ${mallSlug}`)
  );
}
