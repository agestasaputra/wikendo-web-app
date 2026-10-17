/**
 * common/utils/__tests__/quota.spec.ts — Quota split v1.3 + home wallet label test.
 * GET /api/quota v1.1 contract: anonymous 1+2, registered 2+5. Honest wallet follows remaining.
 */
import { describe, it, expect } from "vitest";
import {
  buildQuotaStatus,
  buildWalletLabel,
  parseAnonFoodUsed,
  parseAnonPlaceUsed,
} from "../quota";

describe("parseAnonPlaceUsed (cookie quota_used → 0|1)", () => {
  it("'1' = 1 (anonymous place allowance exhausted)", () => {
    expect(parseAnonPlaceUsed("1")).toBe(1);
  });

  it("undefined = 0 (not used yet)", () => {
    expect(parseAnonPlaceUsed(undefined)).toBe(0);
  });

  it("'0' = 0", () => {
    expect(parseAnonPlaceUsed("0")).toBe(0);
  });

  it("bogus value = 0 (safe, doesn't block)", () => {
    expect(parseAnonPlaceUsed("ngaco")).toBe(0);
  });
});

describe("parseAnonFoodUsed (cookie food_quota_used → 0|1|2)", () => {
  it("undefined = 0", () => {
    expect(parseAnonFoodUsed(undefined)).toBe(0);
  });

  it("'1' = 1", () => {
    expect(parseAnonFoodUsed("1")).toBe(1);
  });

  it("'2' = 2 (anonymous food allowance exhausted)", () => {
    expect(parseAnonFoodUsed("2")).toBe(2);
  });

  it("'99' clamped to 2 (anti cookie cheating)", () => {
    expect(parseAnonFoodUsed("99")).toBe(2);
  });

  it("bogus value = 0", () => {
    expect(parseAnonFoodUsed("ngaco")).toBe(0);
  });
});

describe("buildQuotaStatus (place+food split, GET /api/quota v1.1 contract)", () => {
  it("anonymous fresh: place 0/1 + food 0/2 + login_cta", () => {
    expect(
      buildQuotaStatus({ placeUsed: 0, foodUsed: 0, isLoggedIn: false }),
    ).toEqual({
      place: { used: 0, limit: 1, remaining: 1 },
      food: { used: 0, limit: 2, remaining: 2 },
      is_logged_in: false,
      reset_at: null,
      login_cta: "Login gratis → buka 2 tempat + 5 makan/hari",
    });
  });

  it("anonymous place exhausted: place remaining 0, food keeps going (not mixed)", () => {
    const s = buildQuotaStatus({
      placeUsed: 1,
      foodUsed: 1,
      isLoggedIn: false,
    });
    expect(s.place.remaining).toBe(0);
    expect(s.food).toEqual({ used: 1, limit: 2, remaining: 1 });
  });

  it("registered: place limit 2 + food limit 5, no login_cta", () => {
    expect(
      buildQuotaStatus({
        placeUsed: 1,
        foodUsed: 3,
        isLoggedIn: true,
        resetAt: "RESET",
      }),
    ).toEqual({
      place: { used: 1, limit: 2, remaining: 1 },
      food: { used: 3, limit: 5, remaining: 2 },
      is_logged_in: true,
      reset_at: "RESET",
    });
  });
});

describe("buildWalletLabel (QuotaStatus → home wallet label)", () => {
  it('anonymous fresh: headline "1 tempat • 2 makan", full chip, not exhausted', () => {
    const s = buildQuotaStatus({
      placeUsed: 0,
      foodUsed: 0,
      isLoggedIn: false,
    });
    expect(buildWalletLabel(s)).toEqual({
      headline: "1 tempat • 2 makan",
      placeChip: "1/1 tempat",
      foodChip: "2/2 makan",
      exhausted: false,
    });
  });

  it("anonymous place exhausted + food 1 remaining: headline follows remaining, not yet exhausted", () => {
    const s = buildQuotaStatus({
      placeUsed: 1,
      foodUsed: 1,
      isLoggedIn: false,
    });
    const w = buildWalletLabel(s);
    expect(w.headline).toBe("0 tempat • 1 makan");
    expect(w.placeChip).toBe("0/1 tempat");
    expect(w.foodChip).toBe("1/2 makan");
    expect(w.exhausted).toBe(false);
  });

  it('anonymous fully exhausted: headline "0 tempat • 0 makan" + exhausted true (login CTA moment)', () => {
    const s = buildQuotaStatus({
      placeUsed: 1,
      foodUsed: 2,
      isLoggedIn: false,
    });
    const w = buildWalletLabel(s);
    expect(w.headline).toBe("0 tempat • 0 makan");
    expect(w.exhausted).toBe(true);
  });

  it('registered: limit follows 2+5 (chip "1/2 tempat", "2/5 makan")', () => {
    const s = buildQuotaStatus({
      placeUsed: 1,
      foodUsed: 3,
      isLoggedIn: true,
      resetAt: "RESET",
    });
    const w = buildWalletLabel(s);
    expect(w.headline).toBe("1 tempat • 2 makan");
    expect(w.placeChip).toBe("1/2 tempat");
    expect(w.foodChip).toBe("2/5 makan");
    expect(w.exhausted).toBe(false);
  });
});
