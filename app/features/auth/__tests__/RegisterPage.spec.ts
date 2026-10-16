import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * RegisterPage.spec.ts — Slicing 100% /register ikut image (10 Okt 2026) + Opsi B magic-link (lock Agesta 10 Okt).
 * APA: baca RegisterPage + komponen auth sebagai teks. TAKEOUT 10 Okt: field Nama dihapus (Email + Password saja).
 * Opsi B: Daftar → /check-email?email= → klik 1 link → HOME. Google OAuth tetap langsung.
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

describe("register revamp 100% image — struktur + teks persis", () => {
  it("container mobile max-w-md + background paper #F5F5F4 (bukan body/root)", () => {
    expect(R).toContain("max-w-md mx-auto px-4 pb-10");
    expect(R).toContain("#f5f5f4");
  });

  it("tanpa header lokal duplikat (header global sudah di AppHeader, image mulai dari banner)", () => {
    expect(R).not.toContain("<header");
  });

  it("banner hitam: DAFTAR GRATIS + angka 2 • 5 + quota full + voucher", () => {
    expect(R).toContain("DAFTAR GRATIS");
    expect(R).toContain("2 • 5");
    expect(R).toContain("quota full + voucher");
  });

  it("tombol Lanjutkan dengan Google (outline abu resmi + divider ATAU, Opsi A board v10)", () => {
    expect(R).toContain("Lanjutkan dengan Google");
    expect(R).toContain("rounded-full");
    expect(R).toContain("#dadce0");
    expect(R).toContain("ATAU");
  });

  it("field Email + Password SAJA (Nama di-takeout): placeholder persis + ikon kiri", () => {
    expect(R).not.toContain('placeholder="Nama"');
    expect(R).not.toContain("👤");
    expect(R).not.toMatch(/nama\s*=\s*ref\(/);
    expect(R).not.toContain("nama:");
    expect(R).toContain('placeholder="Email"');
    expect(R).toContain('placeholder="Password"');
    expect(R).toContain("✉️");
    expect(R).toContain("🔒");
  });

  it("meter kekuatan di bawah field password: • pemisah + label kata (bukan inline sesak)", () => {
    expect(R).toContain("strengthLabel");
    expect(R).toContain("•");
  });

  it("checkbox: Setuju Syarat & Privasi (checked by default kayak image)", () => {
    expect(R).toContain("Setuju Syarat & Privasi");
    expect(R).toContain("checkbox");
  });

  it("CTA utama hitam: Daftar → (panah kanan)", () => {
    expect(R).toContain("Daftar →");
    expect(R).toContain("#0c0a09");
  });
});

describe("register revamp — banner 1:1 R1 (token lock v9)", () => {
  it("banner ink #0C0A09 + strip kiri ember #EA580C + radius 12px (bukan rose/rounded-3xl)", () => {
    expect(R).toContain("#0c0a09");
    expect(R).toContain("#ea580c");
    expect(R).toContain("border-left");
    expect(R).toContain("border-radius:12px");
    expect(R).not.toContain("rounded-3xl");
    expect(R).not.toContain("#e11d48");
    expect(R).not.toContain("bg-orange-600");
  });

  it("angka 2 • 5 warna lime-muda #D9F99D 17px (bukan putih 24px)", () => {
    expect(R).toContain("#d9f99d");
    expect(R).toContain("17px");
  });

  it("tanpa footer lokal 10-detik (image bawah CTA kosong, footer ikut global app.vue)", () => {
    expect(R).not.toContain("10 detik");
  });
});

describe("register revamp — wiring fitur app (bukan mock)", () => {
  it("daftar email+password via Supabase signUp + redirect cek-email (Opsi B, bukan langsung /)", () => {
    expect(PAGE).toContain("signUp");
    expect(PAGE).toContain("useSupabaseBrowser");
    expect(PAGE).toContain("/check-email");
  });

  it("tombol Google via Supabase signInWithOAuth provider google", () => {
    expect(WIRING).toContain("signInWithOAuth");
    expect(WIRING).toContain("google");
  });

  it("error inline (bukan alert) + font Plus Jakarta Sans", () => {
    expect(PAGE).toContain("errorMsg");
    expect(PAGE).toContain("Plus Jakarta Sans");
  });
});

describe("opsi B magic-link — register redirect ke cek-email", () => {
  it("signUp pakai emailRedirectTo ke HOME (link verifikasi balik ke /)", () => {
    expect(PAGE).toContain("signUp");
    expect(PAGE).toContain("emailRedirectTo");
  });

  it("sukses daftar → /check-email?email= (BUKAN langsung /)", () => {
    expect(PAGE).toContain("/check-email");
    expect(PAGE).toMatch(/path:\s*["']\/check-email["']/);
    // handleRegister tidak boleh lempar langsung ke home lagi
    expect(PAGE).not.toMatch(/handleRegister[\s\S]*router\.push\(["']\/["']\)/);
  });

  it("Google OAuth tetap langsung (tanpa cek-email, Google sudah verifikasi)", () => {
    expect(WIRING).toContain("signInWithOAuth");
    expect(WIRING).toContain("google");
  });
});
