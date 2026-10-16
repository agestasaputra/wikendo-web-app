import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * PasswordField.spec.ts — Toggle intip password + meter kekuatan di bawah field (11 Okt 2026).
 * KENAPA: request Agesta — user harus bisa cek typo sebelum submit (turunin gagal login),
 * + meter inline di dalam pill sesak → pindah bawah field jadi bar + label kata.
 * Pattern standar industri: toggle ujung kanan dalam field, type="button" (anti submit), aria-label (a11y).
 * Meter HANYA di register (create password); login cukup toggle (recall password).
 */
const FIELD = readSource("features/auth/components/PasswordField.vue");
const LOGIN = readSource(
  "features/auth/LoginPage.vue",
  "features/auth/components/PasswordField.vue",
);
const REGISTER = readSource(
  "features/auth/RegisterPage.vue",
  "features/auth/components/PasswordField.vue",
  "features/auth/utils/passwordStrength.ts",
);

describe("password toggle — login + register (SVG profesional, tanpa emoji/dot)", () => {
  for (const [f, s] of [
    ["LoginPage", LOGIN],
    ["RegisterPage", REGISTER],
  ] as const) {
    it(`${f}: pakai <PasswordField> dengan state showPassword + input type dinamis`, () => {
      expect(s).toContain("<PasswordField");
      expect(s).toContain("showPassword");
      expect(s).toContain(":type=\"showPassword ? 'text' : 'password'");
    });
  }

  it("tombol toggle type=button + aria-label (anti submit + a11y)", () => {
    expect(FIELD).toContain('type="button"');
    expect(FIELD).toContain("Tampilkan password");
    expect(FIELD).toContain("Sembunyikan password");
    expect(FIELD).toContain("showPassword = !showPassword");
  });

  it("ikon SVG eye/eye-slash profesional (tanpa emoji 👁️/🙈)", () => {
    expect(FIELD).not.toContain("👁");
    expect(FIELD).not.toContain("🙈");
    // Heroicons outline eye + eye-slash (stroke currentColor) — marker path unik
    expect(FIELD).toContain("M2.036 12.322");
    expect(FIELD).toContain("M3.98 8.223");
  });

  it("dot pemisah • di sebelah tombol mata dihapus + placeholder tetap", () => {
    expect(FIELD).not.toContain('<span class="text-gray-300 text-sm">•</span>');
    expect(FIELD).toContain('placeholder="Password"');
  });

  it("login: Lupa? tetap ada + underline (slot trailing, bukan gantiin)", () => {
    expect(LOGIN).toContain("Lupa?");
    expect(LOGIN).toContain("underline");
    expect(LOGIN).toContain("#trailing");
  });
});

describe("strength meter — register saja, di bawah field", () => {
  it("register: meter lama inline di pill dibongkar (5 kotak v-for hilang)", () => {
    expect(REGISTER).not.toContain('v-for="i in 5"');
  });

  it("register: bar + label kata di bawah field (Lemah/Sedang/Kuat/Sangat kuat)", () => {
    expect(REGISTER).toContain("strengthLabel");
    expect(REGISTER).toContain("Lemah");
    expect(REGISTER).toContain("Sangat kuat");
  });

  it("register: warna skala merah→hijau + cuma muncul setelah ngetik", () => {
    expect(REGISTER).toContain("strengthColor");
    expect(REGISTER).toContain('v-if="password.length"');
  });

  it("login: TIDAK ada meter (recall ≠ create password)", () => {
    expect(LOGIN).not.toContain("strengthLabel");
    expect(LOGIN).not.toContain('v-for="i in 5"');
  });
});
