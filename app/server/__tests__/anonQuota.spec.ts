/**
 * anonQuota.spec.ts — RED (TDD) for the server-side anonymous quota gate.
 *
 * WHY: anonymous quota lived in COOKIES the client could delete (`quota_used`,
 *   `food_quota_used`) → clearing cookies reset the counter and a `curl` loop got
 *   unlimited LLM calls. The gate must live on the SERVER, keyed by an httpOnly
 *   identifier the client cannot forge.
 *
 * WHAT the implementation must satisfy:
 *   1. Pure limit policy (FOOD anon = 1, total anon trial = 2) + refusal copy that SELLS
 *      the login (never "kuota habis" alone).
 *   2. A store that reads today's usage from the existing `generations` ledger:
 *      session_id + quiz_input->>type + created_at >= WIB midnight — plus an
 *      IP-hash SOFT cap from `analytics_events`.
 *   3. Both recommend endpoints import the gate and set NO client-readable quota cookies.
 */
import { readCode, readSource } from "~/test/utils";
import { describe, expect, it } from "vitest";

const FREE_TRIAL_TOTAL = 2;
const ANON_FOOD_LIMIT = 1;
const ANON_PLACE_LIMIT = 1;
/** A warung/cafe/hotspot shares one public IP (CGNAT) → the IP gate must stay generous. */
const IP_MULTIPLIER = 25;

type PolicyModule = {
  ANON_FOOD_LIMIT: number;
  ANON_PLACE_LIMIT: number;
  FREE_TRIAL_TOTAL: number;
  IP_MULTIPLIER: number;
  remaining: (used: number, limit: number) => number;
  canUse: (
    kind: "place" | "food",
    usage: { place: number; food: number; ipTotal: number },
  ) => boolean;
  loginWallMessage: () => string;
  hashIp: (ip: string, salt: string) => string;
};

/** Dynamic import (ESM): `require` does not exist in a Vitest module. */
async function policy(): Promise<PolicyModule> {
  return (await import("../utils/anonQuotaPolicy")) as PolicyModule;
}

describe("anon quota policy (pure)", () => {
  it("food anon limit dropped from 2 to 1 (Agesta decision 19 Oct)", async () => {
    const mod = await policy();
    expect(mod.ANON_FOOD_LIMIT).toBe(ANON_FOOD_LIMIT);
    expect(mod.ANON_PLACE_LIMIT).toBe(ANON_PLACE_LIMIT);
    expect(mod.FREE_TRIAL_TOTAL).toBe(FREE_TRIAL_TOTAL);
    expect(mod.IP_MULTIPLIER).toBe(IP_MULTIPLIER);
  });

  it("remaining = limit - used, never negative", async () => {
    const mod = await policy();
    expect(mod.remaining(0, 2)).toBe(2);
    expect(mod.remaining(1, 2)).toBe(1);
    expect(mod.remaining(3, 2)).toBe(0);
    expect(mod.remaining(-5, 2)).toBe(2);
  });

  it("a device may use the free trial on EITHER quiz type, but only 2 in total", async () => {
    const mod = await policy();
    // fresh device
    expect(mod.canUse("place", { place: 0, food: 0, ipTotal: 0 })).toBe(true);
    expect(mod.canUse("food", { place: 0, food: 0, ipTotal: 0 })).toBe(true);
    // 1 place used → food still allowed (total 1 of 2)
    expect(mod.canUse("food", { place: 1, food: 0, ipTotal: 1 })).toBe(true);
    // 2 used (1+1) → both refused
    expect(mod.canUse("place", { place: 1, food: 1, ipTotal: 2 })).toBe(false);
    expect(mod.canUse("food", { place: 1, food: 1, ipTotal: 2 })).toBe(false);
    // per-type cap also holds
    expect(mod.canUse("place", { place: 1, food: 0, ipTotal: 1 })).toBe(false);
    expect(mod.canUse("food", { place: 0, food: 1, ipTotal: 1 })).toBe(false);
    // IP soft cap blocks even a fresh device once the IP is saturated
    expect(
      mod.canUse("place", {
        place: 0,
        food: 0,
        ipTotal: FREE_TRIAL_TOTAL * IP_MULTIPLIER,
      }),
    ).toBe(false);
    // ...but one request under the cap still passes (soft, not a hair trigger)
    expect(
      mod.canUse("place", {
        place: 0,
        food: 0,
        ipTotal: FREE_TRIAL_TOTAL * IP_MULTIPLIER - 1,
      }),
    ).toBe(true);
  });

  it("refusal copy sells the login instead of punishing (copy wall)", async () => {
    const mod = await policy();
    const msg = mod.loginWallMessage();
    expect(msg).toMatch(/login gratis/i);
    expect(msg).toMatch(/2 tempat/i);
    expect(msg).toMatch(/5 makan/i);
    expect(msg).toMatch(/riwayat/i);
    expect(msg).toMatch(/lintas device/i);
    expect(msg).not.toMatch(/^kuota (place|makan) anda habis/i);
  });

  it("IP hash is salted + stable + never the raw IP", async () => {
    const mod = await policy();
    const a = mod.hashIp("1.2.3.4", "salt-a");
    const b = mod.hashIp("1.2.3.4", "salt-a");
    const c = mod.hashIp("1.2.3.4", "salt-b");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).not.toContain("1.2.3.4");
    expect(a.length).toBe(64); // sha-256 hex
  });
});

describe("anon quota store reads the existing ledger (no DDL needed)", () => {
  it("today start is WIB midnight, not UTC midnight", async () => {
    const mod = await import("../utils/anonQuotaStore");
    // 2026-10-19T01:30Z = 08:30 WIB on the 19th → WIB day starts 2026-10-18T17:00Z
    expect(mod.wibDayStart(new Date("2026-10-19T01:30:00Z"))).toBe(
      "2026-10-18T17:00:00.000Z",
    );
  });

  it("reads usage with session_id + quiz_input type + created_at window", () => {
    const src = readSource("server/utils/anonQuotaStore.ts");
    expect(src).toContain("generations");
    expect(src).toContain("session_id");
    expect(src).toContain("quiz_input->>type");
    expect(src).toContain("created_at");
    expect(src).toContain("user_id");
    // must scope to anonymous rows only
    expect(src).toMatch(/is\(\s*"user_id"\s*,\s*null\s*\)/);
  });

  it("IP soft cap is read from analytics_events by salted hash", () => {
    const src = readSource("server/utils/anonQuotaStore.ts");
    expect(src).toContain("analytics_events");
    expect(src).toContain("ip_hash");
    expect(src).toContain("event_type");
  });
});

describe("recommend endpoints use the server gate, not client cookies", () => {
  it("place/recommend gates anon via the shared anonGate + sets no quota cookie", () => {
    const src = readCode("server/api/place/recommend.post.ts");
    // The gate itself (usage read + policy) lives in anonGate — the endpoint must DELEGATE,
    // not re-implement. Asserting the helper's own imports keeps the policy single-sourced.
    expect(src).toContain("anonGate(");
    expect(src).not.toMatch(/setCookie\([^)]*"quota_used"/);
    // the response must carry the real limit so the UI never hardcodes "1/1"
    expect(src).toContain("quota_limit");
  });

  it("the gate is the ONE place that reads usage and applies the policy", () => {
    const gate = readCode("server/utils/anonGate.ts");
    expect(gate).toContain("getAnonUsage");
    expect(gate).toContain("canUse");
    expect(gate).toContain("loginWallMessage");
  });

  it("food/recommend gates anon via the shared anonGate + sets no quota cookie", () => {
    const src = readCode("server/api/food/recommend.post.ts");
    expect(src).toContain("anonGate(");
    expect(src).not.toMatch(/setCookie\([^)]*"food_quota_used"/);
    expect(src).not.toMatch(/ANON_FOOD_LIMIT\s*=\s*2/);
    expect(src).toContain("quota_limit");
  });

  it("quota.get reports anon usage from the server, not cookies", () => {
    const src = readCode("server/api/quota.get.ts");
    expect(src).not.toMatch(/parseAnonPlaceUsed|parseAnonFoodUsed/);
    expect(src).toContain("getAnonUsage");
    expect(src).toContain("ensureSessionId");
  });
});
