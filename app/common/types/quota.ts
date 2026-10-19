/**
 * common/types/quota.ts — Quota CONTRACT (GET /api/quota, Addendum 09 v1.4).
 *
 * WHAT: QuotaStatus split place+food, input builder, home wallet label.
 * - Anonymous: place limit 1 + food limit 1 + reset_at null + login_cta.
 * - Member (login): place limit 2 + food limit 5 + reset_at 00:00 WIB, without login_cta.
 * WHY food anon is 1: the free trial is the paired 2 (1 place + 1 food) that matches the
 *   "2 gratis" headline; giving 2 food made the promise and the meter disagree.
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
