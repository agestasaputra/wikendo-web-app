/**
 * server/utils/anonQuotaStore.ts — Anonymous quota usage read from data we ALREADY have.
 *
 * WHAT: getAnonUsage(db, sessionId, ipHash) → { place, food, ipTotal } for the current
 *   WIB day.
 * WHY no new table: the project has no migration access at runtime (no DATABASE_URL, no
 *   CLI, no pg client) and `generations` already carries `session_id` + `quiz_input.type`
 *   + `created_at` with an index on `session_id`. Counting today's anon rows IS the usage
 *   ledger — zero schema change, exact, and it can never drift from reality because it is
 *   derived from the same rows the user received.
 * WHY: the previous quota lived in client-writable cookies, so clearing them reset the
 *   counter and a curl loop got unlimited LLM calls.
 * LIMIT: counting every request is fine at MVP scale (indexed, single-digit rows/day);
 *   promote to a `anon_quota` table when traffic makes the scan measurable.
 * EXAMPLE: const usage = await getAnonUsage(db, sid, hashIp(ip, ipSalt(today)));
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { usageFromCounts, type AnonUsage } from "./anonQuotaPolicy";

/** ISO instant of 00:00 WIB for the day containing `now` (WIB = UTC+7, no DST). */
export function wibDayStart(now: Date = new Date()): string {
  const day = now.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  return new Date(`${day}T00:00:00+07:00`).toISOString();
}

/** Today's WIB day string (YYYY-MM-DD) — salt scope + display. */
export function wibDay(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

/**
 * Count this device's anonymous generations today per quiz type.
 * Anonymous rows have `user_id IS NULL`; a logged-in row must never consume anon quota.
 */
export async function getAnonUsage(
  db: SupabaseClient,
  sessionId: string,
  ipHash?: string,
): Promise<AnonUsage> {
  const start = wibDayStart();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const base = (): any =>
    db
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .is("user_id", null)
      .gte("created_at", start);

  const [place, food] = await Promise.all([
    base().eq("quiz_input->>type", "place"),
    base().eq("quiz_input->>type", "food"),
  ]);

  // Fail CLOSED on a read error is wrong here (it would block a paying-attention user
  // because of a transient DB hiccup); log-and-continue keeps the free trial usable.
  const placeCount = place.error ? 0 : (place.count ?? 0);
  const foodCount = food.error ? 0 : (food.count ?? 0);

  let ipTotal = 0;
  if (ipHash) {
    // IP soft cap: how much free traffic this IP already consumed today (any device).
    const { count, error } = await db
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "anon_generation")
      .eq("metadata->>ip_hash", ipHash)
      .gte("created_at", start);
    ipTotal = error ? 0 : (count ?? 0);
  }

  return usageFromCounts({ place: placeCount, food: foodCount, ipTotal });
}

/**
 * Record one anonymous generation for the IP soft cap.
 * Best-effort: analytics must never break a generation the user already received.
 */
export async function recordAnonGeneration(
  db: SupabaseClient,
  opts: { sessionId: string; ipHash?: string; kind: "place" | "food" },
): Promise<void> {
  if (!opts.ipHash) return;
  try {
    await db.from("analytics_events").insert({
      event_type: "anon_generation",
      session_id: opts.sessionId,
      metadata: { ip_hash: opts.ipHash, kind: opts.kind },
    });
  } catch {
    // ignore — the user already has their recommendations
  }
}
