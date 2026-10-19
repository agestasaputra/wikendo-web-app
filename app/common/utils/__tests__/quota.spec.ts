/**
 * common/utils/__tests__/quota.spec.ts — Quota split v1.4 + home wallet label test.
 * GET /api/quota contract: anonymous 1+1 (max 1 per quiz type), registered 2+5.
 * WHY no cookie parsing here: anon usage is counted on the server from `generations`
 * (session_id httpOnly + IP soft cap), so a client-writable cookie is no longer trusted.
 */
import { describe, it, expect } from "vitest";
import { buildQuotaStatus, buildWalletLabel } from "../quota";

const LOGIN_CTA =
  "Login gratis: 2 tempat + 5 makan per hari + riwayat lintas device";

describe("buildQuotaStatus (place+food split, GET /api/quota v1.4 contract)", () => {
  it("anonymous fresh: place 0/1 + food 0/1 + login_cta", () => {
    expect(
      buildQuotaStatus({ placeUsed: 0, foodUsed: 0, isLoggedIn: false }),
    ).toEqual({
      place: { used: 0, limit: 1, remaining: 1 },
      food: { used: 0, limit: 1, remaining: 1 },
      is_logged_in: false,
      reset_at: null,
      login_cta: LOGIN_CTA,
    });
  });

  it("anonymous place exhausted: place remaining 0, food keeps going (not mixed)", () => {
    const s = buildQuotaStatus({
      placeUsed: 1,
      foodUsed: 0,
      isLoggedIn: false,
    });
    expect(s.place.remaining).toBe(0);
    expect(s.food).toEqual({ used: 0, limit: 1, remaining: 1 });
  });

  it("anonymous trial spent (1 place + 1 food): both 0, never negative", () => {
    const s = buildQuotaStatus({
      placeUsed: 3,
      foodUsed: 4,
      isLoggedIn: false,
    });
    expect(s.place.remaining).toBe(0);
    expect(s.food.remaining).toBe(0);
    expect(s.place.used).toBe(3); // honest: shows what was counted, remaining clamps
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
  it('anonymous fresh: headline "1 tempat • 1 makan", full chip, not exhausted', () => {
    const s = buildQuotaStatus({
      placeUsed: 0,
      foodUsed: 0,
      isLoggedIn: false,
    });
    expect(buildWalletLabel(s)).toEqual({
      headline: "1 tempat • 1 makan",
      placeChip: "1/1 tempat",
      foodChip: "1/1 makan",
      exhausted: false,
    });
  });

  it("anonymous place exhausted + food 1 remaining: headline follows remaining, not yet exhausted", () => {
    const s = buildQuotaStatus({
      placeUsed: 1,
      foodUsed: 0,
      isLoggedIn: false,
    });
    const w = buildWalletLabel(s);
    expect(w.headline).toBe("0 tempat • 1 makan");
    expect(w.placeChip).toBe("0/1 tempat");
    expect(w.foodChip).toBe("1/1 makan");
    expect(w.exhausted).toBe(false);
  });

  it('anonymous fully exhausted: headline "0 tempat • 0 makan" + exhausted true (login CTA moment)', () => {
    const s = buildQuotaStatus({
      placeUsed: 1,
      foodUsed: 1,
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
