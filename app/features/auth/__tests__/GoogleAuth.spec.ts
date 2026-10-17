import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * GoogleAuth.spec.ts — Single entry point for Google Auth (Oct 11 2026, approved "Gas fix!") + Option A board v10 (Agesta lock "A").
 * Single entry: (1) SAME neutral label "Lanjutkan dengan Google", (2) SAME redirect respecting ?redirect=,
 * (3) Terms checkbox locked: register handleGoogle must check agree.
 * Option A: official outline button + ATAU divider + 4-color G logo (not a blue "G" circle).
 */
const GOOGLE_BUTTON = readSource("features/auth/components/GoogleButton.vue");
const COMPOSABLE = readSource("features/auth/composables/useGoogleSignIn.ts");
const PAGES: Record<string, string> = {
  "RegisterPage.vue": readSource("features/auth/RegisterPage.vue"),
  "LoginPage.vue": readSource("features/auth/LoginPage.vue"),
};

describe("Google Auth single entry — same neutral label", () => {
  it('GoogleButton (used by login + register): label "Lanjutkan dengan Google"', () => {
    expect(GOOGLE_BUTTON).toContain("Lanjutkan dengan Google");
  });

  it("old label gone (Daftar via / Lanjut dengan)", () => {
    for (const s of [GOOGLE_BUTTON, ...Object.values(PAGES)]) {
      expect(s).not.toContain("Daftar via Google");
      expect(s).not.toMatch(/["']Lanjut dengan Google["']/);
    }
  });

  for (const [f, s] of Object.entries(PAGES)) {
    it(`${f}: uses shared <GoogleButton> (1 look for login + register)`, () => {
      expect(s).toContain("<GoogleButton");
    });
  }
});

describe("Google Auth single entry — same redirect (respects ?redirect=)", () => {
  for (const [f, s] of Object.entries(PAGES)) {
    it(`${f}: reads route.query.redirect + passes it to useGoogleSignIn(redirect)`, () => {
      expect(s).toContain("route.query.redirect");
      expect(s).toMatch(/useGoogleSignIn\(redirect\)/);
    });
  }

  it('composable: redirectTo attaches the redirect variable (not hardcoded "/")', () => {
    expect(COMPOSABLE).toContain("redirectTo");
    expect(COMPOSABLE).toMatch(/redirectTo:\s*buildOriginUrl\(redirect\)/);
  });

  it("login: Daftar footer preserves ?redirect=", () => {
    const s = PAGES["LoginPage.vue"] ?? "";
    expect(s).toContain("/register");
    expect(s).toMatch(/redirect/);
  });
});

describe("Google Auth register — Terms checkbox locked", () => {
  it("register: handleGoogle checks agree before OAuth", () => {
    const s = PAGES["RegisterPage.vue"] ?? "";
    expect(s).toContain("handleGoogle");
    expect(s).toContain("agree");
    expect(s).toMatch(/if\s*\(\s*!agree\.value\s*\)/);
  });
});

describe("Option A — Google outline button + ATAU divider (register + login aligned)", () => {
  it("gray outline button #DADCE0 (not a solid-white twin of the form)", () => {
    expect(GOOGLE_BUTTON).toContain("#dadce0");
  });

  it('official 4-color G logo (includes yellow #FBBC05, not an imitation blue "G" circle)', () => {
    expect(GOOGLE_BUTTON).toContain("#fbbc05");
    expect(GOOGLE_BUTTON).not.toContain(">G</span>");
  });

  it("full Google wiring (OAuth + loading + idle label)", () => {
    expect(COMPOSABLE).toContain("signInWithOAuth");
    expect(GOOGLE_BUTTON).toContain("Menghubungkan…");
    for (const s of Object.values(PAGES)) expect(s).toContain("googleLoading");
  });

  for (const [f, s] of Object.entries(PAGES)) {
    it(`${f}: ATAU divider between Google and email form + black CTA as the only solid`, () => {
      expect(s).toContain("ATAU");
      expect(s).toContain("#0c0a09");
    });
  }
});
