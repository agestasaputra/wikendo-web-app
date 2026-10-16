/**
 * utils/error.ts — Ekstraksi pesan/status dari error `unknown` (catch, useFetch.error).
 *
 * APA: getErrorMessage(e, fallback) + getErrorStatus(e). PURE: input → output.
 * KENAPA: sebelumnya cast `(e as {...})` diulang di 3 file; `any` dilarang, jadi narrowing
 *   dipusatkan di sini (input validation di batas error, 1 sumber kebenaran).
 * Contoh: getErrorMessage({ data: { message: 'LOGIN_REQUIRED' } }, 'Gagal') // 'LOGIN_REQUIRED'
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

/** Pesan error untuk UI: data.message → message → fallback. */
export function getErrorMessage(e: unknown, fallback: string): string {
  const { data, message } = asErrorLike(e);
  const picked = data?.message || message;
  return typeof picked === "string" && picked ? picked : fallback;
}

/** HTTP status dari error (statusCode), atau undefined kalau tidak ada. */
export function getErrorStatus(e: unknown): number | undefined {
  const { statusCode } = asErrorLike(e);
  return typeof statusCode === "number" ? statusCode : undefined;
}
