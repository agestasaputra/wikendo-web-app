import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * PasswordField.spec.ts — Peek-password toggle + strength meter below the field (Oct 11 2026).
 * WHY: Agesta request — users must be able to check typos before submit (fewer failed logins),
 * + inline meter inside a cramped pill → moved below the field as a bar + word label.
 * Industry-standard pattern: toggle at the right edge inside the field, type="button" (anti submit), aria-label (a11y).
 * Meter ONLY in register (create password); login just needs the toggle (recall password).
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

describe("password toggle — login + register (professional SVG, no emoji/dot)", () => {
  for (const [f, s] of [
    ["LoginPage", LOGIN],
    ["RegisterPage", REGISTER],
  ] as const) {
    it(`${f}: uses <PasswordField> with showPassword state + dynamic input type`, () => {
      expect(s).toContain("<PasswordField");
      expect(s).toContain("showPassword");
      expect(s).toContain(":type=\"showPassword ? 'text' : 'password'");
    });
  }

  it("toggle button type=button + aria-label (anti submit + a11y)", () => {
    expect(FIELD).toContain('type="button"');
    expect(FIELD).toContain("Tampilkan password");
    expect(FIELD).toContain("Sembunyikan password");
    expect(FIELD).toContain("showPassword = !showPassword");
  });

  it("professional eye/eye-slash SVG icons (no 👁️/🙈 emoji)", () => {
    expect(FIELD).not.toContain("👁");
    expect(FIELD).not.toContain("🙈");
    // Heroicons outline eye + eye-slash (stroke currentColor) — unique path marker
    expect(FIELD).toContain("M2.036 12.322");
    expect(FIELD).toContain("M3.98 8.223");
  });

  it("• separator dot next to the eye button removed + placeholder kept", () => {
    expect(FIELD).not.toContain('<span class="text-gray-300 text-sm">•</span>');
    expect(FIELD).toContain('placeholder="Password"');
  });

  it("login: Lupa? still present + underline (trailing slot, not replacing)", () => {
    expect(LOGIN).toContain("Lupa?");
    expect(LOGIN).toContain("underline");
    expect(LOGIN).toContain("#trailing");
  });
});

describe("strength meter — register only, below the field", () => {
  it("register: old inline meter in the pill removed (5-box v-for gone)", () => {
    expect(REGISTER).not.toContain('v-for="i in 5"');
  });

  it("register: bar + word label below the field (Lemah/Sedang/Kuat/Sangat kuat)", () => {
    expect(REGISTER).toContain("strengthLabel");
    expect(REGISTER).toContain("Lemah");
    expect(REGISTER).toContain("Sangat kuat");
  });

  it("register: red→green scale colors + appears only after typing", () => {
    expect(REGISTER).toContain("strengthColor");
    expect(REGISTER).toContain('v-if="password.length"');
  });

  it("login: NO meter (recall ≠ create password)", () => {
    expect(LOGIN).not.toContain("strengthLabel");
    expect(LOGIN).not.toContain('v-for="i in 5"');
  });
});
