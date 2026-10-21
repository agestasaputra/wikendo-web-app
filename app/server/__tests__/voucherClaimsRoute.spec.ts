/**
 * voucherClaimsRoute.spec.ts — P0 read model for "Sudah diklaim" (GET /api/voucher/claims).
 *
 * WHAT: file-assert the route contract: 401 for anon (never an empty list = a lie), mall_slug
 *   query → claimed codes for TODAY WIB of the caller.
 * WHY 401 not []: an empty array for an anonymous user would render "Klaim" → tap → 401 → bad UX.
 *   A 401 lets the page skip the fetch and show the login wall copy instead (Wall #4).
 * WHY file-assert (repo convention): no dev-server dependency, deterministic in CI.
 */
import { describe, it, expect } from "vitest";
import { readSource, sourceExists } from "~/test/utils";

const ROUTE = readSource("server/api/voucher/claims.get.ts");
const UTIL = readSource("server/utils/voucherClaimedList.ts");

describe("GET /api/voucher/claims — authed claimed-codes read model", () => {
  it("route file exists and is registered as a GET handler", () => {
    expect(sourceExists("server/api/voucher/claims.get.ts")).toBe(true);
    expect(ROUTE).toContain("defineEventHandler");
  });

  it("401 for anonymous (requireBearerToken), NOT an empty list", () => {
    expect(ROUTE).toContain("requireBearerToken");
    expect(ROUTE).toContain("requireUserId");
    expect(ROUTE).toContain("supabaseAdmin");
  });

  it("returns { codes } and scopes to mall_slug when given", () => {
    expect(ROUTE).toContain("mall_slug");
    expect(ROUTE).toContain("codes");
    expect(ROUTE).toContain("listClaimedCodes");
  });

  it("delegates to the shared util (thin route, ≤ 50 lines)", () => {
    expect(ROUTE).toContain("listClaimedCodesByMallSlug");
    expect(ROUTE.length).toBeLessThan(2500);
    expect(UTIL).toContain("listClaimedCodesByMallSlug");
  });

  it("reuses todayWIB from the claim route (one date source for write + read)", () => {
    expect(UTIL).toContain("todayWIB");
    expect(UTIL).toContain('from "./voucherClaim"');
  });
});
