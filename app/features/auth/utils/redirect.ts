/**
 * features/auth/utils/redirect.ts — Auth redirect URL (respects ?redirect=, client origin).
 *
 * WHAT: getRedirectQuery(value) → safe path (fallback "/"); buildOriginUrl(path) → origin + path in the browser.
 * WHY: previously `typeof window` + a template string repeated in login/register/check-email.
 * EXAMPLE: buildOriginUrl("/place") → "https://wikendo.app/place" (browser) | "/place" (SSR).
 */

/** ?redirect= query value → path; not a string/empty → "/". */
export function getRedirectQuery(value: unknown): string {
  return typeof value === "string" && value ? value : "/";
}

/** Path → absolute URL of the current origin (browser) or the path as-is (SSR). */
export function buildOriginUrl(path: string): string {
  return typeof window !== "undefined"
    ? `${window.location.origin}${path}`
    : path;
}
