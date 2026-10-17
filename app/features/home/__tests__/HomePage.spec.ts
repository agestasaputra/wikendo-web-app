import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * HomePage.spec.ts — Home: before/after login distinction (Addendum docs/22) + Mall entrypoint (M1+M3, Oct 9).
 * Read as text: ZERO network, deterministic in CI.
 */
const HOME = readSource("features/home/HomePage.vue");

describe("auth-state-home — greeting + hero index login-aware", () => {
  it("HomePage uses AuthStore", () => {
    expect(HOME).toContain("useAuthStore");
  });

  it("dynamic greeting: 'Halo {nama}' + 'teman Wikendo' fallback", () => {
    expect(HOME).toContain("teman Wikendo");
    expect(HOME).toMatch(
      /Halo[\s\S]{0,80}displayName|displayName[\s\S]{0,80}Halo/i,
    );
  });

  it("login-aware hero sub: 'Sisa kamu' + anonymous text unchanged", () => {
    expect(HOME).toContain("login buka 2 + 5");
    expect(HOME).toContain("Sisa kamu");
  });
});

describe("Home greeting", () => {
  it("🔔 icon moved to the global header (not duplicated on Home)", () => {
    expect(HOME).not.toContain("🔔");
  });
});

describe("Mall entrypoint on Home (M1+M3)", () => {
  it("M1: 🏬 Mall icon links to /mall (dead Event replaced)", () => {
    expect(HOME).toContain('to="/mall"');
    expect(HOME).toContain("🏬");
    expect(HOME).not.toContain(">Event<");
    expect(HOME).not.toContain("🎡");
  });

  it("M3: 'Mall Terdekat' card present (count + no login) + /mall link", () => {
    expect(HOME).toContain("Mall Terdekat");
    expect(HOME).toContain("5 mall");
    expect(HOME).toContain("200 tenant");
    expect(HOME).toContain("tanpa login");
  });

  it("at least 2 doors to /mall (M1 icon + M3 card)", () => {
    const n = (HOME.match(/to="\/mall"/g) || []).length;
    expect(n).toBeGreaterThanOrEqual(2);
  });
});
