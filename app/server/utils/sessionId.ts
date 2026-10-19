/**
 * server/utils/sessionId.ts — Stable per-browser `session_id` cookie (server-only).
 *
 * WHAT: ensureSessionId(event) → existing cookie value, or a fresh UUID that is SET on the
 *   response (30 days, httpOnly, lax).
 * WHY: quiz rows are inserted with the `session_id` cookie so an anonymous row can later be
 *   claimed by the same browser after login. Only the place endpoint used to set it — food
 *   rows were written with `session_id: getCookie(...) || randomUUID()` which was NEVER
 *   persisted, so every food row became unreachable the moment the request ended.
 * EXAMPLE: const sessionId = ensureSessionId(event);
 */
import { getCookie, setCookie, type H3Event } from "h3";
import { randomUUID } from "node:crypto";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

/** Read the `session_id` cookie, creating + setting one when it is missing. */
export function ensureSessionId(event: H3Event): string {
  const existing = getCookie(event, "session_id");
  if (existing) return existing;
  const sessionId = randomUUID();
  setCookie(event, "session_id", sessionId, {
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  return sessionId;
}
