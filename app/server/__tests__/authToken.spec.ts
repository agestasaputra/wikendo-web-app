/**
 * authToken.spec.ts — RED test (TDD) for the SERVER auth-token contract.
 *
 * WHAT: locks the Bearer-first / legacy-cookie-fallback token read + session_id bootstrap
 *   across every authenticated endpoint.
 * WHY: the Supabase browser client stores its session in localStorage — it NEVER sets the
 *   `sb-access-token` cookie. Endpoints that read ONLY `getCookie(event, "sb-access-token")`
 *   therefore always resolve `userId = null`, and every quiz row is written with
 *   `user_id = NULL` (orphan rows that can never show up in a logged-in history).
 *   Food recommend also never SET `session_id`, so anon rows cannot be claimed either.
 * EXAMPLE: extractAccessToken(event) → bearer header, else the legacy cookie, else "".
 */
import { describe, it, expect } from "vitest";
import { readCode, readSource, sourceExists } from "~/test/utils";

const TOKEN = readSource("server/utils/authToken.ts");
const SESSION = readSource("server/utils/sessionId.ts");

/** Files that resolve a Supabase user from an incoming request. */
const ROUTES = readCode(
  "server/api/history.get.ts",
  "server/api/quota.get.ts",
  "server/api/place/recommend.post.ts",
  "server/api/food/recommend.post.ts",
);

describe("server/utils/authToken.ts — Bearer first, cookie fallback", () => {
  it("exists and is one shared helper", () => {
    expect(sourceExists("server/utils/authToken.ts")).toBe(true);
    expect(TOKEN).toContain("export function extractAccessToken");
  });

  it("reads the Authorization header as Bearer (browser client sends this)", () => {
    expect(TOKEN).toContain("authorization");
    expect(TOKEN).toMatch(/Bearer/);
    expect(TOKEN).toContain("getHeader");
  });

  it("keeps sb-access-token as a legacy fallback (SSR / old sessions)", () => {
    expect(TOKEN).toContain("sb-access-token");
    expect(TOKEN).toContain("getCookie");
  });
});

describe("server/utils/sessionId.ts — session_id bootstrap", () => {
  it("exists and always SETS the cookie so anon rows stay claimable", () => {
    expect(sourceExists("server/utils/sessionId.ts")).toBe(true);
    expect(SESSION).toContain("export function ensureSessionId");
    expect(SESSION).toContain("setCookie");
    expect(SESSION).toContain("session_id");
    expect(SESSION).toMatch(/maxAge/);
    expect(SESSION).toContain("randomUUID");
  });
});

describe("every authenticated route uses the shared helpers", () => {
  it("no route resolves the token from the cookie alone", () => {
    expect(ROUTES).not.toMatch(
      /getCookie\(\s*event\s*,\s*["']sb-access-token["']\s*\)\s*;/,
    );
  });

  it("history + quota + place + food all resolve the user through the shared helper", () => {
    // SOC: routes no longer call extractAccessToken themselves — the token→user step lives in
    // requireUser.ts. Each route must DELEGATE (getOptionalUserId | requireAuthUser).
    const count =
      ROUTES.split("getOptionalUserId").length -
      1 +
      (ROUTES.split("requireAuthUser").length - 1);
    expect(count).toBeGreaterThanOrEqual(4);
    // ...and the helper is the only place that reads the header + calls auth.getUser
    const HELPER = readCode("server/utils/requireUser.ts");
    expect(HELPER).toContain("extractAccessToken");
    expect(HELPER).toContain("getUser");
  });

  it("both quiz endpoints call ensureSessionId (anon rows claimable)", () => {
    const count = ROUTES.split("ensureSessionId").length - 1;
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
