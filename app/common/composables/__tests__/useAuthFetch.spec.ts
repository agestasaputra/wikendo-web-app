import { describe, it, expect } from "vitest";
import { readSource, sourceExists } from "~/test/utils";

/**
 * useAuthFetch.spec.ts — RED test (TDD) for the CLIENT auth-fetch contract.
 *
 * WHAT: locks that every quiz recommend call carries the Supabase Bearer token.
 * WHY: production evidence 19 Oct 2026 — 106/106 generations rows had user_id = NULL even
 *   for logged-in users (latest row 11:32 WIB, AFTER the server-side Bearer fix shipped at
 *   10:47). The server supports Bearer, but the RESULT PAGES never sent it: the browser
 *   session lives in localStorage, not in a cookie. So the server resolved userId = null
 *   and every quiz row became an orphan that a logged-in history can never read.
 * EXAMPLE: createAuthFetch() → $fetch whose requests carry `Authorization: Bearer <token>`.
 */
const HELPER = "common/composables/useAuthFetch.ts";
const PLACE = readSource("features/place/PlaceResultPage.vue");
const FOOD = readSource("features/food/FoodResultPage.vue");

describe("common/composables/useAuthFetch.ts — Bearer token for client API calls", () => {
  it("exists as one shared composable (not copy-pasted per page)", () => {
    expect(sourceExists(HELPER)).toBe(true);
  });

  it("reads the session access_token from the Supabase browser client", () => {
    const SRC = readSource(HELPER);
    expect(SRC).toContain("useSupabaseBrowser");
    expect(SRC).toContain("getSession");
    expect(SRC).toContain("access_token");
  });

  it("attaches the Authorization: Bearer header on every request", () => {
    const SRC = readSource(HELPER);
    expect(SRC).toMatch(/authorization/i);
    expect(SRC).toMatch(/Bearer/);
    expect(SRC).toContain("onRequest");
  });

  it("is SSR-safe: no window/localStorage access when rendering on the server", () => {
    const SRC = readSource(HELPER);
    expect(SRC).toContain("typeof window");
    // never throws when the session is missing → anonymous requests still work
    expect(SRC).toMatch(/catch/);
  });
});

describe("quiz result pages send the Bearer token (orphan-row fix)", () => {
  it("place result passes $fetch: authFetch to useFetch", () => {
    expect(PLACE).toContain("useAuthFetch");
    expect(PLACE).toMatch(/\$fetch\s*:\s*authFetch/);
  });

  it("food result passes $fetch: authFetch to useFetch", () => {
    expect(FOOD).toContain("useAuthFetch");
    expect(FOOD).toMatch(/\$fetch\s*:\s*authFetch/);
  });
});

describe("quota wallet call sites send the Bearer token", () => {
  it("BottomNav + HomePage build the fetcher from useAuthFetch (browser) / forward cookies on SSR", () => {
    // Browser: useAuthFetch() carries `Authorization: Bearer …` (the session lives in
    // localStorage). Server: useRequestFetch() forwards the httpOnly session_id cookie, or the
    // anonymous gate would count a brand-new device on every SSR render. Both pages must pass
    // the resulting fetcher to useFetch — that is the contract this test locks.
    for (const page of [
      "common/components/BottomNav.vue",
      "features/home/HomePage.vue",
    ]) {
      const SRC = readSource(page);
      expect(SRC).toContain("useAuthFetch");
      expect(SRC).toContain("useRequestFetch");
      expect(SRC).toMatch(/\$fetch\s*:\s*(authFetch|quotaFetch)/);
    }
  });

  it("LoginPage passes $fetch: authFetch", () => {
    expect(readSource("features/auth/LoginPage.vue")).toMatch(
      /\$fetch\s*:\s*authFetch/,
    );
  });

  it("the shared quota cache refreshes when auth flips (BottomNav watcher)", () => {
    const NAV = readSource("common/components/BottomNav.vue");
    expect(NAV).toContain("refreshNuxtData");
    expect(NAV).toMatch(/watch\(\s*\(\)\s*=>\s*auth\.isLoggedIn/);
  });
});
