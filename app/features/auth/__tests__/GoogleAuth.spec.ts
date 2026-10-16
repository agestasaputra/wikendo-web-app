import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * GoogleAuth.spec.ts — Satu pintu Google Auth (11 Okt 2026, approved "Gas fix!") + Opsi A board v10 (lock Agesta "A").
 * Satu pintu: (1) label netral SAMA "Lanjutkan dengan Google", (2) redirect SAMA hormati ?redirect=,
 * (3) checkbox Syarat dikunci: handleGoogle register wajib cek agree.
 * Opsi A: tombol outline resmi + divider ATAU + logo G 4-warna (bukan lingkaran biru "G").
 */
const GOOGLE_BUTTON = readSource("features/auth/components/GoogleButton.vue");
const COMPOSABLE = readSource("features/auth/composables/useGoogleSignIn.ts");
const PAGES: Record<string, string> = {
  "RegisterPage.vue": readSource("features/auth/RegisterPage.vue"),
  "LoginPage.vue": readSource("features/auth/LoginPage.vue"),
};

describe("Google Auth satu pintu — label netral sama", () => {
  it('GoogleButton (dipakai login + register): label "Lanjutkan dengan Google"', () => {
    expect(GOOGLE_BUTTON).toContain("Lanjutkan dengan Google");
  });

  it("label lama hilang (Daftar via / Lanjut dengan)", () => {
    for (const s of [GOOGLE_BUTTON, ...Object.values(PAGES)]) {
      expect(s).not.toContain("Daftar via Google");
      expect(s).not.toMatch(/["']Lanjut dengan Google["']/);
    }
  });

  for (const [f, s] of Object.entries(PAGES)) {
    it(`${f}: memakai <GoogleButton> bersama (1 tampilan untuk login + register)`, () => {
      expect(s).toContain("<GoogleButton");
    });
  }
});

describe("Google Auth satu pintu — redirect sama (hormati ?redirect=)", () => {
  for (const [f, s] of Object.entries(PAGES)) {
    it(`${f}: baca route.query.redirect + teruskan ke useGoogleSignIn(redirect)`, () => {
      expect(s).toContain("route.query.redirect");
      expect(s).toMatch(/useGoogleSignIn\(redirect\)/);
    });
  }

  it('composable: redirectTo nempel variabel redirect (bukan hardcode "/")', () => {
    expect(COMPOSABLE).toContain("redirectTo");
    expect(COMPOSABLE).toMatch(/redirectTo:\s*buildOriginUrl\(redirect\)/);
  });

  it("login: footer Daftar preservasi ?redirect=", () => {
    const s = PAGES["LoginPage.vue"] ?? "";
    expect(s).toContain("/register");
    expect(s).toMatch(/redirect/);
  });
});

describe("Google Auth register — checkbox Syarat dikunci", () => {
  it("register: handleGoogle cek agree sebelum OAuth", () => {
    const s = PAGES["RegisterPage.vue"] ?? "";
    expect(s).toContain("handleGoogle");
    expect(s).toContain("agree");
    expect(s).toMatch(/if\s*\(\s*!agree\.value\s*\)/);
  });
});

describe("Opsi A — tombol Google outline + divider ATAU (register + login selaras)", () => {
  it("tombol outline abu #DADCE0 (bukan solid-putih kembaran form)", () => {
    expect(GOOGLE_BUTTON).toContain("#dadce0");
  });

  it('logo G 4-warna resmi (kuning #FBBC05 ikut, bukan lingkaran biru "G" imitasi)', () => {
    expect(GOOGLE_BUTTON).toContain("#fbbc05");
    expect(GOOGLE_BUTTON).not.toContain(">G</span>");
  });

  it("wiring Google utuh (OAuth + loading + label idle)", () => {
    expect(COMPOSABLE).toContain("signInWithOAuth");
    expect(GOOGLE_BUTTON).toContain("Menghubungkan…");
    for (const s of Object.values(PAGES)) expect(s).toContain("googleLoading");
  });

  for (const [f, s] of Object.entries(PAGES)) {
    it(`${f}: divider ATAU antara Google dan form email + CTA hitam satu-satunya solid`, () => {
      expect(s).toContain("ATAU");
      expect(s).toContain("#0c0a09");
    });
  }
});
