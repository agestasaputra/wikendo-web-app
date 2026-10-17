/**
 * common/utils/quota.ts — Quota split v1.3: cookie parsing + status builder + wallet label.
 *
 * WHAT: parseAnon*Used, buildQuotaStatus, buildWalletLabel. PURE: the caller reads cookie/API.
 * WHY: used by server (GET /api/quota) + pages (wallet) → 1 interpretation, not duplicated.
 * Response contract: ../../docs/05-API-Specification.md. Anonymous 1+2, register 2+5.
 * EXAMPLE: buildQuotaStatus({ placeUsed: 0, foodUsed: 1, isLoggedIn: false })
 */
import type {
  QuotaStatus,
  QuotaStatusInput,
  WalletLabel,
} from "../types/quota";

/** Cookie `quota_used` (place, anonymous 1x) → 0|1. Wrong value = 0 (safe). */
export function parseAnonPlaceUsed(cookieValue: string | undefined): number {
  return cookieValue === "1" ? 1 : 0;
}

/** Cookie `food_quota_used` (food, anonymous 2x) → 0|1|2. Clamped 0–2, wrong = 0. */
export function parseAnonFoodUsed(cookieValue: string | undefined): number {
  const n = parseInt(cookieValue || "0", 10);
  if (Number.isNaN(n) || n <= 0) return 0;
  return Math.min(n, 2);
}

/** Build the quota split response: anonymous (1+2 + login_cta) vs register (2+5). */
export function buildQuotaStatus(input: QuotaStatusInput): QuotaStatus {
  if (!input.isLoggedIn) {
    return {
      place: {
        used: input.placeUsed,
        limit: 1,
        remaining: 1 - input.placeUsed,
      },
      food: {
        used: input.foodUsed,
        limit: 2,
        remaining: 2 - input.foodUsed,
      },
      is_logged_in: false,
      reset_at: null,
      login_cta: "Login gratis → buka 2 tempat + 5 makan/hari",
    };
  }
  return {
    place: {
      used: input.placeUsed,
      limit: 2,
      remaining: 2 - input.placeUsed,
    },
    food: {
      used: input.foodUsed,
      limit: 5,
      remaining: 5 - input.foodUsed,
    },
    is_logged_in: true,
    reset_at: input.resetAt ?? null,
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
