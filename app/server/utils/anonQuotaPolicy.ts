/**
 * server/utils/anonQuotaPolicy.ts — Anonymous free-trial rules (pure, no IO).
 *
 * WHAT: limits + `usageFromCounts`, `remaining`, `canUse`, `loginWallMessage`, `hashIp`.
 * WHY: anon quota must be decided on the SERVER keyed to an httpOnly id — the old
 *   cookies (`quota_used`, `food_quota_used`) were client-writable, so clearing them
 *   reset the counter and a curl loop got unlimited LLM calls.
 * WHY a total: the free trial is "2 gratis" for the DEVICE, whichever quiz is used —
 *   one honest gate instead of two separate meters nobody understands.
 * WHY IP_MULTIPLIER is 25 (soft, ~50 generations/day): Indonesia is CGNAT-heavy — a
 *   wartel, office, campus or one Telkomsel cell can put hundreds of real users behind a
 *   single public IP. A tight IP cap would block innocent first-time visitors (100% loss)
 *   to stop a scraper that can switch IPs anyway. The IP gate is a cheap tripwire to make
 *   mass abuse expensive, NOT a per-user quota — the real per-device gate is session_id.
 * EXAMPLE: canUse("food", { place: 1, food: 0, ipTotal: 1 }) → true (1 of 2 used).
 */
import { createHash } from "node:crypto";
import {
  ANON_FOOD_LIMIT,
  ANON_PLACE_LIMIT,
  FREE_TRIAL_TOTAL,
} from "../../common/constants/quota";

// Re-exported so the gate and its callers keep one import site, while the NUMBER itself
// has exactly one owner (common/constants/quota.ts) shared with the browser wallet.
export { ANON_FOOD_LIMIT, ANON_PLACE_LIMIT, FREE_TRIAL_TOTAL };

/** An IP may serve up to N devices' worth of free trials (CGNAT/hotspot safe). */
export const IP_MULTIPLIER = 25;

export type QuizKind = "place" | "food";

export interface AnonUsage {
  place: number;
  food: number;
  /** Total anon generations seen from the same salted IP hash today. */
  ipTotal: number;
}

/** Raw counts → the shape the policy reasons about. */
export function usageFromCounts(input: {
  place: number;
  food: number;
  ipTotal?: number;
}): AnonUsage {
  return {
    place: Math.max(0, input.place || 0),
    food: Math.max(0, input.food || 0),
    ipTotal: Math.max(0, input.ipTotal || 0),
  };
}

/** Total used today across both quiz types. */
export function totalUsed(usage: AnonUsage): number {
  return usage.place + usage.food;
}

/** Slots left in the free trial (0 when exhausted; never negative). */
export function remaining(used: number, limit: number): number {
  return Math.max(0, limit - Math.max(0, used));
}

/** Slots left for a specific quiz type. */
export function remainingFor(kind: QuizKind, usage: AnonUsage): number {
  const limit = kind === "place" ? ANON_PLACE_LIMIT : ANON_FOOD_LIMIT;
  const used = kind === "place" ? usage.place : usage.food;
  return Math.min(
    remaining(used, limit),
    remaining(totalUsed(usage), FREE_TRIAL_TOTAL),
  );
}

/** May this device (and its IP neighbourhood) run one more generation of `kind`? */
export function canUse(kind: QuizKind, usage: AnonUsage): boolean {
  if (usage.ipTotal >= FREE_TRIAL_TOTAL * IP_MULTIPLIER) return false;
  return remainingFor(kind, usage) > 0;
}

/**
 * Copy for the login wall. WHAT: sells what login GIVES (2 place + 5 food + cross-device
 * history) and reassures the trial is saved. WHY: the old "Kuota place Anda habis" reads
 * like a punishment; this is the single highest-leverage conversion string in the app.
 */
export function loginWallMessage(): string {
  return (
    "Login gratis — dapat 2 tempat + 5 makan per hari, " +
    "plus riwayat lintas device. Hasil coba kamu tetap kesimpan."
  );
}

/** Short label for chips ("2 gratis") — re-exported from the single owner. */
export { FREE_TRIAL_LABEL } from "../../common/constants/quota";

/** Salted SHA-256 of an IP — 64 hex chars, stable per salt, never reversible to the IP. */
export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/** Per-day salt: the same IP hashes differently tomorrow (no long-term tracking). */
export function ipSalt(day: string): string {
  return `wikendo-anon-${day}`;
}
