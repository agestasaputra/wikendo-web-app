/**
 * common/types/quota.ts — KONTRAK quota (GET /api/quota v1.1, Addendum 09 v1.3).
 *
 * APA: QuotaStatus split tempat+makan, input builder, label wallet home.
 * - Anon: tempat limit 1 + makan limit 2 + reset_at null + login_cta.
 * - Register: tempat limit 2 + makan limit 5 + reset_at 00:00 WIB, tanpa login_cta.
 * Dipakai: buildQuotaStatus() di common/utils/quota + server/api/quota.get.ts.
 */
export interface QuotaSlice {
  used: number;
  limit: number;
  remaining: number;
}

export interface QuotaStatusInput {
  tempatUsed: number;
  makanUsed: number;
  isLoggedIn: boolean;
  resetAt?: string | null;
}

export interface QuotaStatus {
  tempat: QuotaSlice;
  makan: QuotaSlice;
  is_logged_in: boolean;
  reset_at: string | null;
  login_cta?: string;
}

/** Label wallet home: headline sisa, chip "sisa/limit", exhausted = momen login CTA. */
export interface WalletLabel {
  headline: string;
  tempatChip: string;
  makanChip: string;
  exhausted: boolean;
}
