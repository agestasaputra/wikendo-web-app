/**
 * common/types/quota.ts — Quota CONTRACT (GET /api/quota v1.1, Addendum 09 v1.3).
 *
 * WHAT: QuotaStatus split place+food, input builder, home wallet label.
 * - Anonymous: place limit 1 + food limit 2 + reset_at null + login_cta.
 * - Register: place limit 2 + food limit 5 + reset_at 00:00 WIB, without login_cta.
 * Used by: buildQuotaStatus() in common/utils/quota + server/api/quota.get.ts.
 */
export interface QuotaSlice {
  used: number;
  limit: number;
  remaining: number;
}

export interface QuotaStatusInput {
  placeUsed: number;
  foodUsed: number;
  isLoggedIn: boolean;
  resetAt?: string | null;
}

export interface QuotaStatus {
  place: QuotaSlice;
  food: QuotaSlice;
  is_logged_in: boolean;
  reset_at: string | null;
  login_cta?: string;
}

/** Home wallet label: remaining headline, "remaining/limit" chip, exhausted = login CTA moment. */
export interface WalletLabel {
  headline: string;
  placeChip: string;
  foodChip: string;
  exhausted: boolean;
}
