/**
 * utils/url.ts — Builder URL murni.
 *
 * APA: buildMapsUrl(tenant, mall) → link Google Maps search. PURE.
 * Contoh: buildMapsUrl("Kopi Kenangan", "grand-indonesia").
 */

/** Bikin link Google Maps buat 1 tenant. Dipakai server makan/recommend. */
export function buildMapsUrl(tenantName: string, mallSlug: string): string {
  return (
    "https://www.google.com/maps/search/" +
    encodeURIComponent(`${tenantName} ${mallSlug}`)
  );
}
