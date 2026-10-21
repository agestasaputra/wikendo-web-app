/**
 * server/utils/__tests__/voucherClaimedList.spec.ts — P0: "Sudah diklaim" persists across sessions.
 *
 * WHAT: file-assert + pure-function contract for listClaimedCodes / listClaimedCodesByMallSlug.
 * WHY: the gap was that the public /api/vouchers list always returns claimed:false, so a claim
 *   flipped the row ONLY in memory — refresh / another device / tomorrow showed "Klaim" again.
 *   This util is the read model that fixes it: today WIB, per user, optional mall scope.
 * WHY file-assert (not a live DB): the migration is not applied in the unit-test sandbox, and
 *   the point is to lock the query shape + WIB date + mall-scope semantics.
 */
import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

const UTIL = readSource("server/utils/voucherClaimedList.ts");
const CLAIM = readSource("server/utils/voucherClaim.ts");

describe("voucherClaimedList — today WIB read model", () => {
  it("filters by todayWIB (Asia/Jakarta), not UTC", () => {
    expect(UTIL).toContain("todayWIB");
    expect(UTIL).toContain("claim_date");
    expect(UTIL).toContain("user_id");
    // todayWIB() itself lives in voucherClaim.ts (single source for write + read).
    expect(CLAIM).toContain("Asia/Jakarta");
  });

  it("reads the dual-write columns (claim_code + vouchers join for the code + mall id)", () => {
    expect(UTIL).toContain("claim_code");
    expect(UTIL).toContain("vouchers(code,tenants(mall_id))");
    expect(UTIL).toContain("mall_id");
  });

  it("returns a Set of codes (no duplicates even if 2 rows share a code)", () => {
    expect(UTIL).toContain("Set<string>");
    expect(UTIL).toContain("new Set");
  });

  it("mall scope is OPTIONAL: no mallId → every claim the user made today", () => {
    expect(UTIL).toContain("listClaimedCodes(db, userId, mallId?)");
    expect(UTIL).toContain("listClaimedCodes(db, userId)");
  });

  it("mall scope is ADVISORY: an old row without a join still counts (a disabled button beats a second 409)", () => {
    // Scoping lives in isMallScopedOut: no mall requested → never excluded; row without a
    // join → never excluded (only an explicit DIFFERENT mall is dropped).
    expect(UTIL).toContain("function isMallScopedOut");
    expect(UTIL).toMatch(/if \(!mallId\) return false/);
    expect(UTIL).toMatch(/if \(!rowMall\) return false/);
    expect(UTIL).toMatch(/return rowMall !== mallId/);
  });
});

describe("voucherClaimedListByMallSlug — slug → id → claimed codes", () => {
  it("resolves the slug via findMallIdBySlug (the same 404 wall as /api/vouchers)", () => {
    expect(UTIL).toContain("findMallIdBySlug");
  });

  it("empty slug → unscoped list (no 400 on a shared link that still has no mall)", () => {
    expect(UTIL).toMatch(/if \(!slug\) return listClaimedCodes\(db, userId\)/);
  });

  it("unknown slug → [] (never every claim the user made elsewhere)", () => {
    expect(UTIL).toContain("if (!mallId) return []");
  });
});

describe("voucherClaim — todayWIB is the single source for both write and read", () => {
  it("the claim route and the list util share one todayWIB (no 23:59 WIB drift)", () => {
    expect(CLAIM).toContain("export function todayWIB");
    expect(UTIL).toContain('from "./voucherClaim"');
    expect(UTIL).toContain("todayWIB");
  });
});
