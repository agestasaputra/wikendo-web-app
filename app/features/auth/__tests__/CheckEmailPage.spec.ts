import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * CheckEmailPage.spec.ts — Opsi B magic-link: halaman /check-email (lock Agesta 10 Okt 2026, "Gas B").
 * KENAPA: signUp langsung masuk = bot lolos + typo email = reset gagal.
 * Magic-link: Daftar → Cek email → klik 1 link → HOME.
 */
const C = readSource(
  "features/auth/CheckEmailPage.vue",
  "features/auth/components/AuthBanner.vue",
);

describe("opsi B magic-link — halaman /check-email", () => {
  it("judul Cek email + tampilkan email dari query + font + paper 1:1 register", () => {
    expect(C).toContain("Cek email");
    expect(C).toContain("route.query.email");
    expect(C).toContain("Plus Jakarta Sans");
    expect(C).toContain("#f5f5f4");
    expect(C).toContain("max-w-md mx-auto px-4 pb-10");
  });

  it("tanpa header lokal (ikut global AppHeader) + ada link balik login", () => {
    expect(C).not.toContain("<header");
    expect(C).toContain("/login");
  });

  it("tombol Kirim ulang via resend type signup + pesan sukses/error inline", () => {
    expect(C).toContain("Kirim ulang");
    expect(C).toContain("resend");
    expect(C).toMatch(/["']signup["']/);
    expect(C).toContain("errorMsg");
    expect(C).toContain("successMsg");
  });

  it("banner ink 1:1 register (strip ember + radius 12 + angka lime)", () => {
    expect(C).toContain("#0c0a09");
    expect(C).toContain("#ea580c");
    expect(C).toContain("border-radius:12px");
    expect(C).toContain("#d9f99d");
  });
});
