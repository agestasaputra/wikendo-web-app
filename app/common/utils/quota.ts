/**
 * common/utils/quota.ts — Quota split v1.3: parsing cookie + bangun status + label wallet.
 *
 * APA: parseAnon*Used, buildQuotaStatus, buildWalletLabel. PURE: caller yang baca cookie/API.
 * KENAPA: dipakai server (GET /api/quota) + pages (wallet) → 1 interpretasi, bukan duplikat.
 * Kontrak response: ../../docs/05-API-Specification.md. Anon 1+2, register 2+5.
 * Contoh: buildQuotaStatus({ tempatUsed: 0, makanUsed: 1, isLoggedIn: false })
 */
import type {
  QuotaStatus,
  QuotaStatusInput,
  WalletLabel,
} from "../types/quota";

/** Cookie `quota_used` (tempat, anon 1x) → 0|1. Nilai ngaco = 0 (aman). */
export function parseAnonTempatUsed(cookieValue: string | undefined): number {
  return cookieValue === "1" ? 1 : 0;
}

/** Cookie `makan_quota_used` (makan, anon 2x) → 0|1|2. Dijepit 0–2, ngaco = 0. */
export function parseAnonMakanUsed(cookieValue: string | undefined): number {
  const n = parseInt(cookieValue || "0", 10);
  if (Number.isNaN(n) || n <= 0) return 0;
  return Math.min(n, 2);
}

/** Bangun response quota split: anon (1+2 + login_cta) vs register (2+5). */
export function buildQuotaStatus(input: QuotaStatusInput): QuotaStatus {
  if (!input.isLoggedIn) {
    return {
      tempat: {
        used: input.tempatUsed,
        limit: 1,
        remaining: 1 - input.tempatUsed,
      },
      makan: {
        used: input.makanUsed,
        limit: 2,
        remaining: 2 - input.makanUsed,
      },
      is_logged_in: false,
      reset_at: null,
      login_cta: "Login gratis → buka 2 tempat + 5 makan/hari",
    };
  }
  return {
    tempat: {
      used: input.tempatUsed,
      limit: 2,
      remaining: 2 - input.tempatUsed,
    },
    makan: {
      used: input.makanUsed,
      limit: 5,
      remaining: 5 - input.makanUsed,
    },
    is_logged_in: true,
    reset_at: input.resetAt ?? null,
  };
}

/** QuotaStatus → label wallet: headline sisa + chip "sisa/limit" + flag habis. */
export function buildWalletLabel(status: QuotaStatus): WalletLabel {
  const t = status.tempat.remaining;
  const m = status.makan.remaining;
  return {
    headline: `${t} tempat • ${m} makan`,
    tempatChip: `${t}/${status.tempat.limit} tempat`,
    makanChip: `${m}/${status.makan.limit} makan`,
    exhausted: t <= 0 && m <= 0,
  };
}
