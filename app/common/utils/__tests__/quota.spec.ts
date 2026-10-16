/**
 * common/utils/__tests__/quota.spec.ts — Test quota split v1.3 + label wallet home.
 * Kontrak GET /api/quota v1.1: anon 1+2, register 2+5. Wallet jujur ikut sisa.
 */
import { describe, it, expect } from "vitest";
import {
  buildQuotaStatus,
  buildWalletLabel,
  parseAnonMakanUsed,
  parseAnonTempatUsed,
} from "../quota";

describe("parseAnonTempatUsed (cookie quota_used → 0|1)", () => {
  it("'1' = 1 (jatah anon tempat habis)", () => {
    expect(parseAnonTempatUsed("1")).toBe(1);
  });

  it("undefined = 0 (belum pakai)", () => {
    expect(parseAnonTempatUsed(undefined)).toBe(0);
  });

  it("'0' = 0", () => {
    expect(parseAnonTempatUsed("0")).toBe(0);
  });

  it("nilai ngaco = 0 (aman, tidak nge-block)", () => {
    expect(parseAnonTempatUsed("ngaco")).toBe(0);
  });
});

describe("parseAnonMakanUsed (cookie makan_quota_used → 0|1|2)", () => {
  it("undefined = 0", () => {
    expect(parseAnonMakanUsed(undefined)).toBe(0);
  });

  it("'1' = 1", () => {
    expect(parseAnonMakanUsed("1")).toBe(1);
  });

  it("'2' = 2 (jatah anon makan habis)", () => {
    expect(parseAnonMakanUsed("2")).toBe(2);
  });

  it("'99' dijepit ke 2 (clamp, anti-curang cookie)", () => {
    expect(parseAnonMakanUsed("99")).toBe(2);
  });

  it("nilai ngaco = 0", () => {
    expect(parseAnonMakanUsed("ngaco")).toBe(0);
  });
});

describe("buildQuotaStatus (split tempat+makan, kontrak GET /api/quota v1.1)", () => {
  it("anon fresh: tempat 0/1 + makan 0/2 + login_cta", () => {
    expect(
      buildQuotaStatus({ tempatUsed: 0, makanUsed: 0, isLoggedIn: false }),
    ).toEqual({
      tempat: { used: 0, limit: 1, remaining: 1 },
      makan: { used: 0, limit: 2, remaining: 2 },
      is_logged_in: false,
      reset_at: null,
      login_cta: "Login gratis → buka 2 tempat + 5 makan/hari",
    });
  });

  it("anon tempat habis: remaining tempat 0, makan jalan terus (tidak campur)", () => {
    const s = buildQuotaStatus({
      tempatUsed: 1,
      makanUsed: 1,
      isLoggedIn: false,
    });
    expect(s.tempat.remaining).toBe(0);
    expect(s.makan).toEqual({ used: 1, limit: 2, remaining: 1 });
  });

  it("register: tempat limit 2 + makan limit 5, tanpa login_cta", () => {
    expect(
      buildQuotaStatus({
        tempatUsed: 1,
        makanUsed: 3,
        isLoggedIn: true,
        resetAt: "RESET",
      }),
    ).toEqual({
      tempat: { used: 1, limit: 2, remaining: 1 },
      makan: { used: 3, limit: 5, remaining: 2 },
      is_logged_in: true,
      reset_at: "RESET",
    });
  });
});

describe("buildWalletLabel (QuotaStatus → label wallet home)", () => {
  it('anon fresh: headline "1 tempat • 2 makan", chip penuh, belum habis', () => {
    const s = buildQuotaStatus({
      tempatUsed: 0,
      makanUsed: 0,
      isLoggedIn: false,
    });
    expect(buildWalletLabel(s)).toEqual({
      headline: "1 tempat • 2 makan",
      tempatChip: "1/1 tempat",
      makanChip: "2/2 makan",
      exhausted: false,
    });
  });

  it("anon tempat habis + makan sisa 1: headline ikut sisa, belum exhausted", () => {
    const s = buildQuotaStatus({
      tempatUsed: 1,
      makanUsed: 1,
      isLoggedIn: false,
    });
    const w = buildWalletLabel(s);
    expect(w.headline).toBe("0 tempat • 1 makan");
    expect(w.tempatChip).toBe("0/1 tempat");
    expect(w.makanChip).toBe("1/2 makan");
    expect(w.exhausted).toBe(false);
  });

  it('anon habis semua: headline "0 tempat • 0 makan" + exhausted true (momen login CTA)', () => {
    const s = buildQuotaStatus({
      tempatUsed: 1,
      makanUsed: 2,
      isLoggedIn: false,
    });
    const w = buildWalletLabel(s);
    expect(w.headline).toBe("0 tempat • 0 makan");
    expect(w.exhausted).toBe(true);
  });

  it('register: limit ikut 2+5 (chip "1/2 tempat", "2/5 makan")', () => {
    const s = buildQuotaStatus({
      tempatUsed: 1,
      makanUsed: 3,
      isLoggedIn: true,
      resetAt: "RESET",
    });
    const w = buildWalletLabel(s);
    expect(w.headline).toBe("1 tempat • 2 makan");
    expect(w.tempatChip).toBe("1/2 tempat");
    expect(w.makanChip).toBe("2/5 makan");
    expect(w.exhausted).toBe(false);
  });
});
