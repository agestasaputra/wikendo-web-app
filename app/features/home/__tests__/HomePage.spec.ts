import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * HomePage.spec.ts — Home: pembeda before/after login (Addendum docs/22) + entrypoint Mall (M1+M3, 9 Okt).
 * Dibaca sebagai teks: NOL network, deterministik di CI.
 */
const HOME = readSource("features/home/HomePage.vue");

describe("auth-state-home — greeting + hero index login-aware", () => {
  it("HomePage pakai AuthStore", () => {
    expect(HOME).toContain("useAuthStore");
  });

  it("greeting dinamis: Halo {nama} + fallback teman Wikendo", () => {
    expect(HOME).toContain("teman Wikendo");
    expect(HOME).toMatch(
      /Halo[\s\S]{0,80}displayName|displayName[\s\S]{0,80}Halo/i,
    );
  });

  it("hero sub login-aware: Sisa kamu + teks anon tetap", () => {
    expect(HOME).toContain("login buka 2 + 5");
    expect(HOME).toContain("Sisa kamu");
  });
});

describe("sapaan Home", () => {
  it("icon 🔔 sudah pindah ke header global (tidak duplikat di Home)", () => {
    expect(HOME).not.toContain("🔔");
  });
});

describe("entrypoint Mall di Home (M1+M3)", () => {
  it("M1: ikon Mall 🏬 ber-link /mall (Event mati diganti)", () => {
    expect(HOME).toContain('to="/mall"');
    expect(HOME).toContain("🏬");
    expect(HOME).not.toContain(">Event<");
    expect(HOME).not.toContain("🎡");
  });

  it("M3: kartu Mall Terdekat ada (count + tanpa login) + link /mall", () => {
    expect(HOME).toContain("Mall Terdekat");
    expect(HOME).toContain("5 mall");
    expect(HOME).toContain("200 tenant");
    expect(HOME).toContain("tanpa login");
  });

  it("minimal 2 pintu /mall (M1 ikon + M3 kartu)", () => {
    const n = (HOME.match(/to="\/mall"/g) || []).length;
    expect(n).toBeGreaterThanOrEqual(2);
  });
});
