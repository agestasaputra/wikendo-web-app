import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * voucherClaim.spec.ts — TDD Gas v13 S1-S4 (file-assert deterministik, 13 Okt 2026).
 * APA: baca route claim.post.ts + server/utils/voucherClaim.ts sebagai teks, kunci kontrak backend anti-500 prod.
 * KENAPA file-assert (bukan fetch localhost:3000): test lama nembak dev-server yang mati → ECONNREFUSED flaky di CI.
 * Kontrak dikunci: 401/404/409/429 + dual-write date+code + claim_date WIB
 * + UNIQUE race 23505→409 + countdown 23:59 WIB.
 */
const S = readSource(
  "server/api/voucher/claim.post.ts",
  "server/utils/voucherClaim.ts",
);

describe("Voucher Claims — S1 auth guard 401", () => {
  it("401 tanpa Bearer token (login dulu)", () => {
    expect(S).toContain("401");
    expect(S).toContain("Login dulu sebelum claim voucher");
    expect(S).toContain("authorization");
  });

  it("401 token invalid (getUser gagal → login ulang)", () => {
    expect(S).toContain("getUser");
    expect(S).toContain("User token tidak valid");
  });
});

describe("Voucher Claims — S2 promo aktif/expired", () => {
  it("404 voucher tidak ditemukan (maybeSingle)", () => {
    expect(S).toContain("404");
    expect(S).toContain("Voucher tidak ditemukan");
    expect(S).toContain("maybeSingle");
  });

  it("400 promo nonaktif + belum aktif + expired", () => {
    expect(S).toContain("VOUCHER_INACTIVE");
    expect(S).toContain("VOUCHER_NOT_ACTIVE");
    expect(S).toContain("VOUCHER_EXPIRED");
    expect(S).toContain("valid_from");
    expect(S).toContain("valid_until");
  });

  it("400 voucher_code wajib diisi", () => {
    expect(S).toContain("VOUCHER_CODE_REQUIRED");
    expect(S).toContain("voucher_code");
  });
});

describe("Voucher Claims — S3 anti-farming + dual-write", () => {
  it("claim_date WIB satu sumber (todayWIB Asia/Jakarta)", () => {
    expect(S).toContain("todayWIB");
    expect(S).toContain("Asia/Jakarta");
    expect(S).toContain("claim_date");
  });

  it("429 rate-limit 3/hari menang atas 409", () => {
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

  it("dual-write kolom lama date/code + baru claim_date/claim_code (anti-500)", () => {
    expect(S).toContain("date: claimDate");
    expect(S).toContain("claim_date: claimDate");
    expect(S).toContain("code: voucher.code");
    expect(S).toContain("claim_code: voucher.code");
    expect(S).toContain("redeemed: false");
  });

  it("race UNIQUE 23505 → 409 ramah (bukan 500)", () => {
    expect(S).toContain("23505");
    expect(S).toContain("ALREADY_CLAIMED");
  });
});

describe("Voucher Claims — S4 countdown 23:59 WIB", () => {
  it("expiry 23:59 WIB offset +07:00 eksplisit", () => {
    expect(S).toContain("expiryWIBToday");
    expect(S).toContain("23:59");
    expect(S).toContain("+07:00");
    expect(S).toContain("time_remaining");
    expect(S).toContain("expires_at");
  });
});
