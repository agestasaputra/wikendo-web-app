/**
 * features/auth/utils/redirect.ts — URL redirect auth (hormati ?redirect=, origin client).
 *
 * APA: getRedirectQuery(value) → path aman (fallback "/"); buildOriginUrl(path) → origin + path di browser.
 * KENAPA: dulu `typeof window` + template string diulang di login/register/check-email.
 * Contoh: buildOriginUrl("/quiz") → "https://wikendo.app/quiz" (browser) | "/quiz" (SSR).
 */

/** Nilai query ?redirect= → path; bukan string/kosong → "/". */
export function getRedirectQuery(value: unknown): string {
  return typeof value === "string" && value ? value : "/";
}

/** Path → URL absolut origin saat ini (browser) atau path as-is (SSR). */
export function buildOriginUrl(path: string): string {
  return typeof window !== "undefined"
    ? `${window.location.origin}${path}`
    : path;
}
