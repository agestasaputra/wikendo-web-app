import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * ButtonLoading.spec.ts — Spinner + disable semua tombol auth yang request API (10 Okt 2026).
 * KENAPA: cegah double-klik (double signUp = email ganda, double resend = spam, double OAuth = popup ganda)
 * + UX feedback. Scope: register (Daftar+Google), login (Masuk+Google+Lupa?), check-email (Kirim ulang).
 * Idle state tetap 1:1 slicing (spinner cuma muncul pas loading, via v-if).
 */
const REGISTER = readSource(
  "features/auth/RegisterPage.vue",
  "features/auth/components/GoogleButton.vue",
);
const LOGIN = readSource(
  "features/auth/LoginPage.vue",
  "features/auth/components/GoogleButton.vue",
);
const CHECK = readSource("features/auth/CheckEmailPage.vue");
const GOOGLE_COMPOSABLE = readSource(
  "features/auth/composables/useGoogleSignIn.ts",
);

function spinCount(s: string): number {
  return (s.match(/<AppSpinner/g) || []).length;
}

describe("auth buttons — spinner + disabled (anti double-submit)", () => {
  it("register: CTA Daftar punya spinner + disabled saat loading", () => {
    expect(REGISTER).toContain(":disabled=");
    expect(REGISTER).toContain("Tunggu…");
    expect(REGISTER).toContain("Daftar →");
    expect(spinCount(REGISTER)).toBeGreaterThanOrEqual(2);
  });

  it("register: tombol Google punya loading sendiri + disabled (anti double OAuth)", () => {
    expect(REGISTER).toContain("googleLoading");
    expect(REGISTER).toContain(':disabled="loading || googleLoading"');
    expect(REGISTER).toContain("Lanjutkan dengan Google");
  });

  it("register: handler jaga double-submit via early-return guard", () => {
    expect(REGISTER).toContain("if (loading.value) return");
    expect(GOOGLE_COMPOSABLE).toContain("googleLoading.value = true");
  });

  it("login: Masuk punya spinner + disabled saat loading", () => {
    expect(LOGIN).toContain(":disabled=");
    expect(LOGIN).toContain("Tunggu…");
    expect(LOGIN).toContain("Masuk →");
    expect(spinCount(LOGIN)).toBeGreaterThanOrEqual(3);
  });

  it("login: tombol Google + Lupa? punya loading sendiri + disabled", () => {
    expect(LOGIN).toContain("googleLoading");
    expect(LOGIN).toContain("forgotLoading");
    expect(LOGIN).toContain("Lupa?");
    expect(LOGIN).toContain("Lanjutkan dengan Google");
  });

  it("check-email: Kirim ulang punya spinner + disabled saat mengirim", () => {
    expect(CHECK).toContain(':disabled="loading"');
    expect(CHECK).toContain("Mengirim…");
    expect(CHECK).toContain("Kirim ulang");
    expect(spinCount(CHECK)).toBeGreaterThanOrEqual(1);
  });
});
