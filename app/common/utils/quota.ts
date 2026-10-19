/**
 * common/utils/quota.ts — Quota split v1.4: status builder + wallet label.
 *
 * WHAT: buildQuotaStatus, buildWalletLabel. PURE: the caller supplies the counts.
 * WHY: used by server (GET /api/quota) + pages (wallet) → 1 interpretation, not duplicated.
 * WHY no cookie parsers any more: anonymous usage is counted on the SERVER from the
 *   `generations` ledger (httpOnly session_id + IP soft cap). A client-writable cookie is
 *   not trusted — clearing it used to reset the free trial and a curl loop got unlimited LLM.
 * Response contract: ../../docs/05-API-Specification.md. Anonymous 1+1, register 2+5.
 * EXAMPLE: buildQuotaStatus({ placeUsed: 0, foodUsed: 1, isLoggedIn: false })
 */
import type {
  QuotaStatus,
  QuotaStatusInput,
  WalletLabel,
} from "../types/quota";

/** Per-type limits that mirror server/utils/anonQuotaPolicy (kept in sync by a unit test). */
export const ANON_PLACE_LIMIT = 1;
export const ANON_FOOD_LIMIT = 1;
export const MEMBER_PLACE_LIMIT = 2;
export const MEMBER_FOOD_LIMIT = 5;

/** Slots left (never negative — a stale counter must not render "-1"). */
function left(limit: number, used: number): number {
  return Math.max(0, limit - Math.max(0, used));
}

/** Build the quota split response: anonymous (1+1 + login_cta) vs member (2+5). */
export function buildQuotaStatus(input: QuotaStatusInput): QuotaStatus {
  const isLoggedIn = input.isLoggedIn;
  const placeLimit = isLoggedIn ? MEMBER_PLACE_LIMIT : ANON_PLACE_LIMIT;
  const foodLimit = isLoggedIn ? MEMBER_FOOD_LIMIT : ANON_FOOD_LIMIT;

  return {
    place: {
      used: input.placeUsed,
      limit: placeLimit,
      remaining: left(placeLimit, input.placeUsed),
    },
    food: {
      used: input.foodUsed,
      limit: foodLimit,
      remaining: left(foodLimit, input.foodUsed),
    },
    is_logged_in: isLoggedIn,
    reset_at: isLoggedIn ? (input.resetAt ?? null) : null,
    ...(isLoggedIn
      ? {}
      : {
          login_cta:
            "Login gratis: 2 tempat + 5 makan per hari + riwayat lintas device",
        }),
  };
}

/** QuotaStatus → wallet label: remaining headline + "remaining/limit" chip + exhausted flag. */
export function buildWalletLabel(status: QuotaStatus): WalletLabel {
  const t = status.place.remaining;
  const m = status.food.remaining;
  return {
    headline: `${t} tempat • ${m} makan`,
    placeChip: `${t}/${status.place.limit} tempat`,
    foodChip: `${m}/${status.food.limit} makan`,
    exhausted: t <= 0 && m <= 0,
  };
}
