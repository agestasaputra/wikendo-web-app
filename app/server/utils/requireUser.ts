/**
 * server/utils/requireUser.ts — Bearer token → Supabase user, with the 401 wall in ONE place.
 *
 * WHAT: getOptionalUserId(event) → userId | null; requireUserId(event) → userId or throws 401.
 * WHY: four handlers (`history.get`, `history/claim.post`, `quota.get`, both recommend endpoints)
 *   repeated the same 12 lines: read the token, call `auth.getUser`, then build an identical
 *   401. Duplicated auth is the classic place where one route silently forgets to check and
 *   becomes an open door — one implementation cannot drift.
 * WHY Bearer first: the Supabase browser client keeps its session in localStorage and never
 *   writes the `sb-access-token` cookie, so cookie-only auth resolved `userId = null` forever
 *   (orphan `generations` rows). See server/utils/authToken.ts.
 * EXAMPLE: const userId = await requireAuthUser(event); // 401 LOGIN_REQUIRED when anonymous
 */
import { createError, type H3Event } from "h3";
import { extractAccessToken } from "./authToken";
import { supabaseAdmin } from "./db";

/** Resolve the caller, or `null` when the request carries no valid session (never throws). */
export async function getOptionalUserId(
  event: H3Event,
): Promise<string | null> {
  const token = extractAccessToken(event);
  if (!token) return null;
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  return !error && data?.user ? data.user.id : null;
}

/**
 * Resolve the caller or throw 401.
 * WHY `invalid` copy differs: an expired session should tell the user to log in again, while a
 * missing token is just an anonymous request — both end at the same wall, different wording.
 */
export async function requireAuthUser(
  event: H3Event,
  message = "Login required",
): Promise<string> {
  const token = extractAccessToken(event);
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "LOGIN_REQUIRED",
      data: { message },
    });
  }
  const userId = await getOptionalUserId(event);
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "LOGIN_REQUIRED",
      data: { message: "Invalid session. Please login again." },
    });
  }
  return userId;
}
