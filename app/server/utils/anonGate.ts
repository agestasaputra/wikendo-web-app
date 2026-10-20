/**
 * server/utils/anonGate.ts — the anonymous gate: "may this request run?" in ONE call.
 *
 * WHAT: anonGate(event, db, kind) → { usage, ipHash } or throws the 403 login wall.
 * WHY: both recommend endpoints repeated the same 10 lines (request IP → salted hash → count
 *   today's usage → refuse). Repeating a SECURITY gate is how one endpoint eventually ships
 *   without it. Extracting it also keeps each handler under the repo's 50-line function limit.
 * WHY it returns the usage: the caller needs it to compute `quota_remaining` honestly.
 * EXAMPLE: const { usage, ipHash } = await anonGate(event, db, "food");
 */
import { createError, getRequestIP, type H3Event } from "h3";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  canUse,
  hashIp,
  ipSalt,
  loginWallMessage,
  type AnonUsage,
  type QuizKind,
} from "./anonQuotaPolicy";
import { getAnonUsage, wibDay } from "./anonQuotaStore";
import { ensureSessionId } from "./sessionId";

export interface GateResult {
  /** Counts for today (WIB), including the salted-IP total. */
  usage: AnonUsage;
  /** Stable salted IP hash — needed later to record this generation for the soft cap. */
  ipHash: string;
  /** Persistent per-browser id written by ensureSessionId (httpOnly cookie). */
  sessionId: string;
}

/** Salted, per-day IP hash: the same visitor is unlinkable tomorrow. */
export function currentIpHash(event: H3Event): string {
  const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown";
  return hashIp(ip, ipSalt(wibDay()));
}

/**
 * Count today's anonymous usage and refuse with the login wall when the trial is spent.
 * WHY 403 + `login_cta`: the wall is the highest-leverage conversion moment in the app; the
 *   client renders a login CTA instead of a dead end.
 */
export async function anonGate(
  event: H3Event,
  db: SupabaseClient,
  kind: QuizKind,
): Promise<GateResult> {
  const sessionId = ensureSessionId(event);
  const ipHash = currentIpHash(event);
  const usage = await getAnonUsage(db, sessionId, ipHash);
  if (!canUse(kind, usage)) {
    throw createError({
      statusCode: 403,
      statusMessage: "LOGIN_REQUIRED",
      data: { message: loginWallMessage(), login_cta: true },
    });
  }
  return { usage, ipHash, sessionId };
}
