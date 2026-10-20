/**
 * server/utils/legacyRoutes.ts — pure mapping for the renamed quiz URLs.
 *
 * WHAT: legacyRedirectTarget(pathname, search) → "/result-place?mood=fun" | null.
 * WHY pure: the 301 rules are the only thing that must never regress (a broken legacy
 *   link silently lands on an empty result deck), so the mapping is unit-tested with
 *   zero HTTP. The middleware stays a 3-line wrapper around this function.
 * WHY query string matters: the place answers travel in the query
 *   (/result?mood=fun&companion=group…); dropping `?…` would render an empty deck.
 * EXAMPLE: legacyRedirectTarget("/result", "?mood=fun") → "/result-place?mood=fun"
 */

/** Old URL → new URL. Exact match only — no prefix matching, so /result-food is untouched. */
const LEGACY_ROUTES: Record<string, string> = {
  "/quiz": "/place",
  "/result": "/result-place",
};

/** New location for a legacy path (query preserved), or null when the path is current. */
export function legacyRedirectTarget(
  pathname: string,
  search = "",
): string | null {
  const target = LEGACY_ROUTES[pathname];
  if (!target) return null;
  return `${target}${search}`;
}
