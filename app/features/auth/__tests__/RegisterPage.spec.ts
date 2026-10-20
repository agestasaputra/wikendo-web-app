import { describe, it, expect } from "vitest";
import { readSource, rootTag } from "~/test/utils";

/**
 * RegisterPage.spec.ts — 100% /register slicing per image (Oct 10 2026) + Option B magic-link (Agesta lock Oct 10).
 * WHAT: read RegisterPage + auth components as text. TAKEOUT Oct 10: Nama field removed (Email + Password only).
 * Option B: Daftar → /check-email?email= → click 1 link → HOME. Google OAuth stays immediate.
 */
const R = readSource(
  "features/auth/RegisterPage.vue",
  "features/auth/components/AuthBanner.vue",
  "features/auth/components/GoogleButton.vue",
  "features/auth/components/PasswordField.vue",
  "features/auth/utils/passwordStrength.ts",
);
const PAGE = readSource("features/auth/RegisterPage.vue");
const WIRING = readSource(
  "features/auth/RegisterPage.vue",
  "features/auth/composables/useGoogleSignIn.ts",
);

describe("register revamp 100% image — structure + exact text", () => {
  it("mobile container max-w-md; canvas comes from PAGE_BG (no local background)", () => {
    expect(R).toContain("max-w-md mx-auto px-4 pb-10");
    expect(R).not.toContain("#f5f5f4");
    expect(rootTag(R)).not.toMatch(/background/i);
  });

  it("no duplicate local header (global header already in TopNav, image starts from the banner)", () => {
    expect(R).not.toContain("<header");
  });

  it("black banner: DAFTAR GRATIS + 2 • 5 numbers + quota full + voucher", () => {
    expect(R).toContain("DAFTAR GRATIS");
    expect(R).toContain("2 • 5");
    expect(R).toContain("quota full + voucher");
  });

  it("Lanjutkan dengan Google button (official gray outline + ATAU divider, Option A board v10)", () => {
    expect(R).toContain("Lanjutkan dengan Google");
    expect(R).toContain("rounded-full");
    expect(R).toContain("#dadce0");
    expect(R).toContain("ATAU");
  });

  it("Email + Password fields ONLY (Nama taken out): exact placeholder + left icon", () => {
    expect(R).not.toContain('placeholder="Nama"');
    expect(R).not.toContain("👤");
    expect(R).not.toMatch(/nama\s*=\s*ref\(/);
    expect(R).not.toContain("nama:");
    expect(R).toContain('placeholder="Email"');
    expect(R).toContain('placeholder="Password"');
    expect(R).toContain("✉️");
    expect(R).toContain("🔒");
  });

  it("strength meter below the password field: • separator + word label (not cramped inline)", () => {
    expect(R).toContain("strengthLabel");
    expect(R).toContain("•");
  });

  it("checkbox: Setuju Syarat & Privasi (checked by default like the image)", () => {
    expect(R).toContain("Setuju Syarat & Privasi");
    expect(R).toContain("checkbox");
  });

  it("main black CTA: Daftar → (right arrow)", () => {
    expect(R).toContain("Daftar →");
    expect(R).toContain("#0c0a09");
  });
});

describe("register revamp — banner 1:1 R1 (token lock v9)", () => {
  it("ink banner #0C0A09 + ember left strip #EA580C + 12px radius (not rose/rounded-3xl)", () => {
    expect(R).toContain("#0c0a09");
    expect(R).toContain("#ea580c");
    expect(R).toContain("border-left");
    expect(R).toContain("border-radius:12px");
    expect(R).not.toContain("rounded-3xl");
    expect(R).not.toContain("#e11d48");
    expect(R).not.toContain("bg-orange-600");
  });

  it("2 • 5 numbers in light lime #D9F99D 17px (not white 24px)", () => {
    expect(R).toContain("#d9f99d");
    expect(R).toContain("17px");
  });

  it("no local 10-second footer (image bottom after CTA is empty, footer follows global app.vue)", () => {
    expect(R).not.toContain("10 detik");
  });
});

describe("register revamp — app feature wiring (not a mock)", () => {
  it("email+password signup via Supabase signUp + check-email redirect (Option B, not straight to /)", () => {
    expect(PAGE).toContain("signUp");
    expect(PAGE).toContain("useSupabaseBrowser");
    expect(PAGE).toContain("/check-email");
  });

  it("Google button via Supabase signInWithOAuth provider google", () => {
    expect(WIRING).toContain("signInWithOAuth");
    expect(WIRING).toContain("google");
  });

  it("inline error (not alert); font is owned globally by tailwind.css", () => {
    expect(PAGE).toContain("errorMsg");
    const css = readSource("assets/css/tailwind.css");
    expect(css).toContain("Plus Jakarta Sans");
  });
});

describe("option B magic-link — register redirects to check-email", () => {
  it("signUp uses emailRedirectTo to HOME (verification link back to /)", () => {
    expect(PAGE).toContain("signUp");
    expect(PAGE).toContain("emailRedirectTo");
  });

  it("signup success → /check-email?email= (NOT straight to /)", () => {
    expect(PAGE).toContain("/check-email");
    expect(PAGE).toMatch(/path:\s*["']\/check-email["']/);
    // handleRegister must no longer redirect straight to home
    expect(PAGE).not.toMatch(/handleRegister[\s\S]*router\.push\(["']\/["']\)/);
  });

  it("Google OAuth stays immediate (no check-email, Google already verifies)", () => {
    expect(WIRING).toContain("signInWithOAuth");
    expect(WIRING).toContain("google");
  });
});
