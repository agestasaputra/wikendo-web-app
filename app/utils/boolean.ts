/**
 * utils/boolean.ts — Normalisasi boolean dari input longgar.
 *
 * APA: coerceBool("false") → false. PURE.
 * KENAPA: frontend kirim halal_only:"false" (string) via query → truthy bug bikin filter halal nyala.
 */

/** Normalisasi boolean dari query string frontend ("false" string → false). */
export function coerceBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes" || s === "y";
  }
  return false;
}
