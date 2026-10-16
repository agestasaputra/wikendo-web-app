import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * LoginPage.spec.ts — Slicing 100% halaman /login ikut screenshot terakhir (9 Okt 2026).
 * APA: baca LoginPage + komponen auth sebagai teks, assert 9 elemen image 1:1 + wiring fitur.
 * KENAPA: SOP slicing 100% — beda 1 teks = BELUM DONE. Urutan image: banner hitam quota → Google → Email →
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

describe("login revamp 100% image — struktur + teks persis", () => {
  it("container mobile max-w-md + background abu muda #F2F2F2 (bukan body/root)", () => {
    expect(L).toContain("max-w-md mx-auto px-4 pb-10");
    expect(L).toContain("#f2f2f2");
  });

  it("tanpa header lokal duplikat (header global sudah di AppHeader, image mulai dari banner)", () => {
    expect(L).not.toContain("<header");
  });

  it("banner hitam: QUOTA HABIS • reset 00.00 + angka sisa + Login gratis → buka 2 + 5", () => {
    expect(L).toContain("QUOTA HABIS");
    expect(L).toContain("reset 00.00");
    expect(L).toContain("Login gratis");
    expect(L).toContain("buka 2 + 5");
    // angka sisa dinamis ikut quota real (fallback 0 • 0 kayak image)
    expect(L).toContain("/api/quota");
    expect(L).toContain("0 • 0");
  });

  it("tombol Lanjutkan dengan Google (putih, rounded pill)", () => {
    expect(L).toContain("Lanjutkan dengan Google");
    expect(L).toContain("rounded-full");
  });

  it("field Email + field Password • Lupa? (Lupa? underline)", () => {
    expect(L).toContain("Email");
    expect(L).toContain("Password");
    expect(L).toContain("Lupa?");
    expect(L).toContain("underline");
  });

  it("CTA utama hitam: Masuk → (panah kanan)", () => {
    expect(L).toContain("Masuk →");
  });

  it("pill info: 10 detik • quota reset tiap hari • gratis", () => {
    expect(L).toContain("10 detik");
    expect(L).toContain("quota reset tiap hari");
    expect(L).toContain("gratis");
  });

  it("footer: Belum punya akun? Daftar (link ke /register, preservasi ?redirect=)", () => {
    expect(L).toContain("Belum punya akun?");
    expect(L).toContain("Daftar");
    expect(L).toContain("/register");
  });
});

describe("login revamp — banner 1:1 L1 EMBER HERO (token lock v9)", () => {
  it("banner ink #0C0A09 + strip kiri ember #EA580C + radius 12px (bukan rounded-3xl)", () => {
    expect(L).toContain("#0c0a09");
    expect(L).toContain("#ea580c");
    expect(L).toContain("border-left");
    expect(L).toContain("border-radius:12px");
    expect(L).not.toContain("rounded-3xl");
  });

  it("angka sisa warna lime-muda L1 #D9F99D 17px (bukan #FBBF24 / text-3xl)", () => {
    expect(L).toContain("#d9f99d");
    expect(L).toContain("17px");
    expect(L).not.toContain("#fbbf24");
    expect(L).not.toContain("text-3xl");
  });

  it("copy hero 10px extrabold (QUOTA HABIS • reset 00.00 / Login gratis → buka 2 + 5)", () => {
    expect(L).toContain("QUOTA HABIS");
    expect(L).toContain("reset 00.00");
    expect(L).toContain("Login gratis");
    expect(L).toContain("buka 2 + 5");
  });
});

describe("login revamp — wiring fitur app (bukan mock)", () => {
  it("login email+password via Supabase signInWithPassword + hormati ?redirect=", () => {
    expect(WIRING).toContain("signInWithPassword");
    expect(WIRING).toContain("redirect");
  });

  it("tombol Google via Supabase signInWithOAuth provider google", () => {
    expect(WIRING).toContain("signInWithOAuth");
    expect(WIRING).toContain("google");
  });

  it("Lupa? via Supabase resetPasswordForEmail", () => {
    expect(WIRING).toContain("resetPasswordForEmail");
  });
});
