/**
 * server/utils/clientEvent.ts — Sanitizer for the PUBLIC /api/analytics/track body.
 *
 * WHAT: sanitizeEventName(raw) + sanitizeProps(raw) → safe scalars for `analytics_events`.
 * WHY here: the route file cannot be imported by a unit test (it calls the auto-imported
 *   `defineEventHandler` at module load), so the part that needs a test lives in server/utils.
 * WHY these limits: the endpoint is open to the internet. Without caps, one curl loop could
 *   write multi-MB JSONB rows. 8 props × 120 chars is above any real funnel payload.
 * EXAMPLE: sanitizeProps({ mall_slug: "grand-indonesia", tenant: "% Arabica" })
 */

export const MAX_PROPS = 8;
export const MAX_KEY_LEN = 32;
export const MAX_VALUE_LEN = 120;
export const MAX_EVENT_NAME_LEN = 64;

const KEY_RE = /^[a-z0-9_]{1,32}$/i;

/** Event name → trimmed string capped at 64 chars ('' when not a string). */
export function sanitizeEventName(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().slice(0, MAX_EVENT_NAME_LEN);
}

/** One prop value → scalar, or undefined when it is not storable. */
function toScalar(value: unknown): string | number | boolean | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, MAX_VALUE_LEN) : undefined;
  }
  if (typeof value === "number")
    return Number.isFinite(value) ? value : undefined;
  if (typeof value === "boolean") return value;
  return undefined;
}

/** Props → flat { key: scalar } with at most MAX_PROPS entries. Drops arrays/objects/NaN. */
export function sanitizeProps(
  raw: unknown,
): Record<string, string | number | boolean> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (Object.keys(out).length >= MAX_PROPS) break;
    if (!KEY_RE.test(key)) continue;
    const scalar = toScalar(value);
    if (scalar !== undefined) out[key] = scalar;
  }
  return out;
}
