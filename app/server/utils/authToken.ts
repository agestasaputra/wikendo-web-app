/**
 * server/utils/authToken.ts — Incoming request → Supabase access token (server-only).
 *
 * WHAT: extractAccessToken(event) = Authorization: Bearer <token> first, then the legacy
 *   `sb-access-token` cookie (SSR / old sessions).
 * WHY: the Supabase browser client keeps its session in localStorage and NEVER writes the
 *   `sb-access-token` cookie. Routes that read the cookie alone always resolved
 *   `userId = null`, so every quiz row was inserted with `user_id = NULL` (orphan rows that
 *   a logged-in history can never read) and /api/history answered 401 forever.
 * EXAMPLE: const token = extractAccessToken(event); // "" when the request is anonymous
 */
import { getCookie, getHeader, type H3Event } from "h3";

/** Bearer header (primary) → legacy `sb-access-token` cookie → "" (anonymous). */
export function extractAccessToken(event: H3Event): string {
  const authHeader = getHeader(event, "authorization") || "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (bearer) return bearer;
  return getCookie(event, "sb-access-token") || "";
}
