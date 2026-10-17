/**
 * utils/error.ts — Extract message/status from an `unknown` error (catch, useFetch.error).
 *
 * WHAT: getErrorMessage(e, fallback) + getErrorStatus(e). PURE: input → output.
 * WHY: previously the cast `(e as {...})` was repeated across 3 files; `any` is forbidden, so narrowing
 *   is centralized here (input validation at the error boundary, 1 source of truth).
 * EXAMPLE: getErrorMessage({ data: { message: 'LOGIN_REQUIRED' } }, 'Gagal') // 'LOGIN_REQUIRED'
 *   getErrorStatus({ statusCode: 403 }) // 403
 */
interface ErrorLike {
  data?: { message?: unknown };
  message?: unknown;
  statusCode?: unknown;
}

function asErrorLike(e: unknown): ErrorLike {
  return typeof e === "object" && e !== null ? (e as ErrorLike) : {};
}

/** Error message for the UI: data.message → message → fallback. */
export function getErrorMessage(e: unknown, fallback: string): string {
  const { data, message } = asErrorLike(e);
  const picked = data?.message || message;
  return typeof picked === "string" && picked ? picked : fallback;
}

/** HTTP status from the error (statusCode), or undefined if absent. */
export function getErrorStatus(e: unknown): number | undefined {
  const { statusCode } = asErrorLike(e);
  return typeof statusCode === "number" ? statusCode : undefined;
}
