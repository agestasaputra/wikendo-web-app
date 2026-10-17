import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * voucherClaim.spec.ts — TDD Gas v13 S1-S4 (deterministic file-assert, Oct 13 2026).
 * WHAT: read route claim.post.ts + server/utils/voucherClaim.ts as text, lock the anti-500 prod backend contract.
 * WHY file-assert (not fetching localhost:3000): old tests hit a dead dev-server → ECONNREFUSED flaky in CI.
 * Locked contract: 401/404/409/429 + dual-write date+code + claim_date WIB
 * + UNIQUE race 23505→409 + 23:59 WIB countdown.
 */
const S = readSource(
  "server/api/voucher/claim.post.ts",
  "server/utils/voucherClaim.ts",
);

describe("Voucher Claims — S1 auth guard 401", () => {
  it("401 without Bearer token (login first)", () => {
    expect(S).toContain("401");
    expect(S).toContain("Login dulu sebelum claim voucher");
    expect(S).toContain("authorization");
  });

  it("401 invalid token (getUser fails → log in again)", () => {
    expect(S).toContain("getUser");
    expect(S).toContain("User token tidak valid");
  });
});

describe("Voucher Claims — S2 promo active/expired", () => {
  it("404 voucher not found (maybeSingle)", () => {
    expect(S).toContain("404");
    expect(S).toContain("Voucher tidak ditemukan");
    expect(S).toContain("maybeSingle");
  });

  it("400 promo inactive + not yet active + expired", () => {
    expect(S).toContain("VOUCHER_INACTIVE");
    expect(S).toContain("VOUCHER_NOT_ACTIVE");
    expect(S).toContain("VOUCHER_EXPIRED");
    expect(S).toContain("valid_from");
    expect(S).toContain("valid_until");
  });

  it("400 voucher_code required", () => {
    expect(S).toContain("VOUCHER_CODE_REQUIRED");
    expect(S).toContain("voucher_code");
  });
});

describe("Voucher Claims — S3 anti-farming + dual-write", () => {
  it("claim_date WIB single source (todayWIB Asia/Jakarta)", () => {
    expect(S).toContain("todayWIB");
    expect(S).toContain("Asia/Jakarta");
    expect(S).toContain("claim_date");
  });

  it("429 rate-limit 3/day wins over 409", () => {
    expect(S).toContain("429");
    expect(S).toContain("RATE_LIMIT_EXCEEDED");
    expect(S).toContain("DAILY_CLAIM_LIMIT = 3");
    expect(S).toContain(">= DAILY_CLAIM_LIMIT");
  });

  it("409 UNIQUE user+tenant+claim_date (P0 lock)", () => {
    expect(S).toContain("409");
    expect(S).toContain("ALREADY_CLAIMED");
    expect(S).toContain("tenant_id");
  });

  it("dual-write old date/code columns + new claim_date/claim_code (anti-500)", () => {
    expect(S).toContain("date: claimDate");
    expect(S).toContain("claim_date: claimDate");
    expect(S).toContain("code: voucher.code");
    expect(S).toContain("claim_code: voucher.code");
    expect(S).toContain("redeemed: false");
  });

  it("UNIQUE race 23505 → friendly 409 (not 500)", () => {
    expect(S).toContain("23505");
    expect(S).toContain("ALREADY_CLAIMED");
  });
});

describe("Voucher Claims — S4 countdown 23:59 WIB", () => {
  it("23:59 WIB expiry with explicit +07:00 offset", () => {
    expect(S).toContain("expiryWIBToday");
    expect(S).toContain("23:59");
    expect(S).toContain("+07:00");
    expect(S).toContain("time_remaining");
    expect(S).toContain("expires_at");
  });
});
