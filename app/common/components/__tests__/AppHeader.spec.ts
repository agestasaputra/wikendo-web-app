import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * AppHeader.spec.ts — Global 2-state header AS6 wallet-card (Addendum 22) + app.vue layout.
 * Combines header-layout (Oct 9: width = content, nav menu removed, 🔔 on the right) +
 * auth-state-home (avatar + dropdown + real logout). Read as text: ZERO network, deterministic in CI.
 */
const HEADER = readSource("common/components/AppHeader.vue");
const APP = readSource("app.vue");

describe("global header (AppHeader.vue)", () => {
  it("header width = content (max-w-md, not max-w-4xl)", () => {
    expect(HEADER).toContain("max-w-md");
    expect(HEADER).not.toContain("max-w-4xl");
  });

  it("nav menu Place/Food/Mall removed from the header", () => {
    expect(HEADER).not.toContain('to="/quiz"');
    expect(HEADER).not.toContain('to="/food"');
    expect(HEADER).not.toContain('to="/mall"');
  });

  it("anonymous: Login + Register buttons; logged in: notification icon 🔔 on the right", () => {
    expect(HEADER).toContain("🔔");
    expect(HEADER).toContain("Login");
    expect(HEADER).toContain("Register");
  });
});

describe("auth-state-home — 2-state header (avatar + dropdown)", () => {
  it("uses AuthStore (not a ghost isLoggedIn)", () => {
    expect(HEADER).toContain("useAuthStore");
  });

  it("after-login: avatar initial + Bell still present", () => {
    expect(HEADER).toMatch(/avatar|displayName|initial/i);
  });

  it("mini dropdown: email display + History + Wishlist + Logout", () => {
    expect(HEADER).toContain("Riwayat");
    expect(HEADER).toContain("Wishlist");
    expect(HEADER).toMatch(/Keluar|Logout|signOut/i);
  });

  it("real logout: signOut + back to /", () => {
    expect(HEADER).toContain("signOut");
    expect(HEADER).toMatch(/push\(["']\/["']\)/);
  });
});

describe("app.vue — thin global layout", () => {
  it("mounts AppHeader + NuxtPage + BottomNav + Supabase session init", () => {
    expect(APP).toContain("<AppHeader");
    expect(APP).toContain("<NuxtPage");
    expect(APP).toContain("<BottomNav");
    expect(APP).toContain("auth.init()");
  });

  it("anti-overlap for fixed nav: pb-24 + footer id tentang for the Account anchor", () => {
    expect(APP).toMatch(/pb-24|padding-bottom|pb-20|pb-28/i);
    expect(APP).toMatch(/id=.tentang.|#tentang/);
  });
});
