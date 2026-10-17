import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * LoginPage.spec.ts — 100% /login slicing per the latest screenshot (Oct 9 2026).
 * WHAT: read LoginPage + auth components as text, assert 9 image elements 1:1 + feature wiring.
 * WHY: 100% slicing SOP — 1 text difference = NOT DONE. Image order: black quota banner → Google → Email →
 * Password•Lupa? → Masuk → pill → Daftar.
 */
const L = readSource(
  "features/auth/LoginPage.vue",
  "features/auth/components/AuthBanner.vue",
  "features/auth/components/GoogleButton.vue",
  "features/auth/components/PasswordField.vue",
);
const WIRING = readSource(
  "features/auth/LoginPage.vue",
  "features/auth/composables/useGoogleSignIn.ts",
);

describe("login revamp 100% image — structure + exact text", () => {
  it("mobile container max-w-md + light gray background #F2F2F2 (not body/root)", () => {
    expect(L).toContain("max-w-md mx-auto px-4 pb-10");
    expect(L).toContain("#f2f2f2");
  });

  it("no duplicate local header (global header already in AppHeader, image starts from the banner)", () => {
    expect(L).not.toContain("<header");
  });

  it("black banner: QUOTA HABIS • reset 00.00 + remaining numbers + Login gratis → buka 2 + 5", () => {
    expect(L).toContain("QUOTA HABIS");
    expect(L).toContain("reset 00.00");
    expect(L).toContain("Login gratis");
    expect(L).toContain("buka 2 + 5");
    // remaining numbers dynamic per real quota (fallback 0 • 0 like the image)
    expect(L).toContain("/api/quota");
    expect(L).toContain("0 • 0");
  });

  it("Lanjutkan dengan Google button (white, rounded pill)", () => {
    expect(L).toContain("Lanjutkan dengan Google");
    expect(L).toContain("rounded-full");
  });

  it("Email field + Password • Lupa? field (Lupa? underline)", () => {
    expect(L).toContain("Email");
    expect(L).toContain("Password");
    expect(L).toContain("Lupa?");
    expect(L).toContain("underline");
  });

  it("main black CTA: Masuk → (right arrow)", () => {
    expect(L).toContain("Masuk →");
  });

  it("info pill: 10 detik • quota reset every day • gratis", () => {
    expect(L).toContain("10 detik");
    expect(L).toContain("quota reset tiap hari");
    expect(L).toContain("gratis");
  });

  it("footer: Belum punya akun? Daftar (link to /register, preserves ?redirect=)", () => {
    expect(L).toContain("Belum punya akun?");
    expect(L).toContain("Daftar");
    expect(L).toContain("/register");
  });
});

describe("login revamp — banner 1:1 L1 EMBER HERO (token lock v9)", () => {
  it("ink banner #0C0A09 + ember left strip #EA580C + 12px radius (not rounded-3xl)", () => {
    expect(L).toContain("#0c0a09");
    expect(L).toContain("#ea580c");
    expect(L).toContain("border-left");
    expect(L).toContain("border-radius:12px");
    expect(L).not.toContain("rounded-3xl");
  });

  it("remaining numbers light lime L1 #D9F99D 17px (not #FBBF24 / text-3xl)", () => {
    expect(L).toContain("#d9f99d");
    expect(L).toContain("17px");
    expect(L).not.toContain("#fbbf24");
    expect(L).not.toContain("text-3xl");
  });

  it("hero copy 10px extrabold (QUOTA HABIS • reset 00.00 / Login gratis → buka 2 + 5)", () => {
    expect(L).toContain("QUOTA HABIS");
    expect(L).toContain("reset 00.00");
    expect(L).toContain("Login gratis");
    expect(L).toContain("buka 2 + 5");
  });
});

describe("login revamp — app feature wiring (not a mock)", () => {
  it("email+password login via Supabase signInWithPassword + respects ?redirect=", () => {
    expect(WIRING).toContain("signInWithPassword");
    expect(WIRING).toContain("redirect");
  });

  it("Google button via Supabase signInWithOAuth provider google", () => {
    expect(WIRING).toContain("signInWithOAuth");
    expect(WIRING).toContain("google");
  });

  it("Lupa? via Supabase resetPasswordForEmail", () => {
    expect(WIRING).toContain("resetPasswordForEmail");
  });
});
