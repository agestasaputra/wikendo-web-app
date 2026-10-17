/**
 * utils/boolean.ts — Normalize booleans from loose input.
 *
 * WHAT: coerceBool("false") → false. PURE.
 * WHY: the frontend sends halal_only:"false" (string) via query → truthy bug turns the halal filter on.
 */

/** Normalize a boolean from the frontend query string ("false" string → false). */
export function coerceBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes" || s === "y";
  }
  return false;
}
