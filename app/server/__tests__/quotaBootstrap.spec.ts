import { describe, it, expect } from "vitest";
import { readCode } from "~/test/utils";

/**
 * quotaBootstrap.spec.ts — RED test (TDD) for the LOGGED-IN quota bootstrap contract.
 *
 * WHAT: locks that a logged-in user never gets a phantom 403 because their quota rows are missing.
 * WHY: production evidence 19 Oct 2026 — both real accounts (atsegasaputra@, siskadptr@) had
 *   `user_quota = null`, `mall_search_quota = null` and NO user_profiles row. `initialize_new_user()`
 *   exists in the schema but NOTHING ever called it and there is no trigger on auth.users.
 *   `check_and_increment_quota()` does `SELECT ... INTO` with no row → v_quota_limit NULL →
 *   `v_quota_used >= v_quota_limit` is NULL → no RETURN → RPC returns 0 rows →
 *   `result?.allowed ?? false` = false → 403 LOGIN_REQUIRED on the very first logged-in quiz.
 * EXAMPLE: logged-in place recommend -> initialize_new_user (idempotent) -> quota increment works.
 */
const PLACE = readCode("server/api/place/recommend.post.ts");
const FOOD = readCode("server/api/food/recommend.post.ts");
const QUOTA = readCode("server/api/quota.get.ts");

describe("place recommend bootstraps the quota row before incrementing", () => {
  it("calls initialize_new_user for the logged-in user (idempotent, ON CONFLICT DO NOTHING)", () => {
    expect(PLACE).toContain("initialize_new_user");
  });

  it("bootstraps BEFORE check_and_increment_quota (otherwise the RPC returns 0 rows -> 403)", () => {
    const bootstrapAt = PLACE.indexOf("initialize_new_user");
    const quotaAt = PLACE.indexOf("check_and_increment_quota");
    expect(bootstrapAt).toBeGreaterThan(-1);
    expect(quotaAt).toBeGreaterThan(-1);
    expect(bootstrapAt).toBeLessThan(quotaAt);
  });

  it("does not treat a 0-row RPC result as a hard 403 without a clear reason", () => {
    // the endpoint must surface the real DB message instead of a silent quota-exhausted wall
    expect(PLACE).toContain("QUOTA_CHECK_ERROR");
  });
});

describe("food recommend uses a WIB date + composite upsert (user_id, date)", () => {
  it("derives the quota date in Asia/Jakarta, not UTC", () => {
    expect(FOOD).toMatch(/todayWIB|Asia\/Jakarta/);
  });

  it("upserts with onConflict user_id,date (PK is composite — .eq() after upsert is invalid)", () => {
    expect(FOOD).toContain("onConflict");
    expect(FOOD).toMatch(/user_id,date|user_id,\s*date/);
  });

  it("reads today's row only (date filter — otherwise .single() breaks on day 2)", () => {
    expect(FOOD).toMatch(/\.eq\(\s*["']date["']/);
  });

  it("bootstraps the first row for a logged-in user with no quota yet", () => {
    expect(FOOD).toMatch(/initialize_new_user|upsert/);
  });
});

describe("food quota is only consumed by a SUCCESSFUL generate", () => {
  it("generates candidates BEFORE incrementing (a 404 'no tenant' must not burn a slot)", () => {
    // Candidates + ranking moved into rank(); the handler must CALL it before consumeSlot().
    const rankAt = FOOD.indexOf("await rank(db, body)");
    const incAt = FOOD.indexOf("await consumeSlot(");
    expect(rankAt).toBeGreaterThan(-1);
    expect(incAt).toBeGreaterThan(-1);
    expect(rankAt).toBeLessThan(incAt);
    // and rank() really fetches candidates + asks the LLM, in that order
    const RANKER = readCode("server/utils/foodCandidates.ts");
    expect(RANKER).toContain("fetchFoodCandidates");
  });

  it("ranks BEFORE incrementing too (an LLM failure must not burn a slot)", () => {
    const rankFn = FOOD.slice(FOOD.indexOf("async function rank"));
    expect(rankFn.indexOf("fetchFoodCandidates")).toBeLessThan(
      rankFn.indexOf("rankTenants"),
    );
    expect(FOOD.indexOf("await rank(db, body)")).toBeLessThan(
      FOOD.indexOf("await consumeSlot("),
    );
  });
});

describe("place recommend refunds the slot when the LLM fails after the atomic increment", () => {
  it("has a best-effort refund wired into the generate failure path", () => {
    expect(PLACE).toContain("refundPlaceQuota");
    expect(PLACE).toMatch(/catch\s*\(\w+\)\s*\{[^}]*refundPlaceQuota/);
  });
});

describe("GET /api/quota reads today's food row safely", () => {
  it("filters mall_search_quota by date and tolerates a missing row", () => {
    expect(QUOTA).toMatch(/\.eq\(\s*["']date["']/);
    expect(QUOTA).toMatch(/maybeSingle/);
  });
});
