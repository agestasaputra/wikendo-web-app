import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";
import { pageTitle } from "~/common/utils/pageTitle";

/**
 * TopNav.spec.ts — Global 2-state header AS6 wallet-card (Addendum 22) + app.vue layout.
 * Combines header-layout (Oct 9: width = content, nav menu removed, 🔔 on the right) +
 * auth-state-home (avatar + dropdown + real logout). Read as text: ZERO network, deterministic in CI.
 */
const HEADER = readSource("common/components/TopNav.vue");
const APP = readSource("app.vue");

describe("global header (TopNav.vue)", () => {
  it("header width = content (max-w-md, not max-w-4xl)", () => {
    expect(HEADER).toContain("max-w-md");
    expect(HEADER).not.toContain("max-w-4xl");
  });

  it("nav menu Place/Food/Mall removed from the header", () => {
    expect(HEADER).not.toContain('to="/place"');
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
  it("mounts TopNav + NuxtPage + BottomNav + Supabase session init", () => {
    expect(APP).toContain("<TopNav");
    expect(APP).toContain("<NuxtPage");
    expect(APP).toContain("<BottomNav");
    expect(APP).toContain("auth.init()");
  });

  it("BottomNav is sticky in the flex column (page stretches to its top, no padding hack)", () => {
    expect(APP).toMatch(/flex-col/);
    expect(APP).toMatch(/flex-1/);
    expect(readSource("common/components/BottomNav.vue")).toMatch(
      /sticky bottom-0/,
    );
  });
});

describe("TopNav centre title (which page am I on?)", () => {
  it("renders a centred title driven by the pure pageTitle(path) helper", () => {
    expect(HEADER).toContain("pageTitle");
    expect(HEADER).toContain('v-if="title"');
    expect(HEADER).toContain("text-center");
  });

  it("is NOT rendered on the home page (title = null there)", () => {
    // The home page keeps the logo as its identity — no label above the hero.
    expect(pageTitle("/")).toBeNull();
  });

  it("never becomes a second <h1> next to the page content's own <h1>", () => {
    // Strip HTML comments first: the doc comment may legitimately mention "<h1>" while the markup must not use it.
    const markup = readSource("common/components/TopNav.vue").replace(
      /<!--[\s\S]*?-->/g,
      "",
    );
    expect(markup).not.toContain("<h1");
    expect(markup).toContain("<p");
  });

  it("long mall names are truncated, not pushed into the bell", () => {
    expect(HEADER).toContain("truncate");
  });

  it("the 3-slot grid keeps the title optically centred between back button and bell", () => {
    expect(HEADER).toMatch(/grid-cols-\[/);
    expect(HEADER).toContain("justify-self-end");
  });
});

describe("TopNav left slot (logo vs back button)", () => {
  it("shows the logo on the index page only (isHomePath)", () => {
    expect(HEADER).toContain("isHomePath");
    expect(HEADER).toMatch(/v-if="isHome"/);
    expect(HEADER).toContain("/brand-icon-day.png");
  });

  it("shows a circular back button with an arrow icon on every other page", () => {
    expect(HEADER).toMatch(/v-else[\s\S]*aria-label="Kembali"/);
    expect(HEADER).toContain("rounded-full");
    expect(HEADER).toContain("<svg");
    expect(HEADER).toContain('@click="goBack"');
  });

  it("back falls back to Home when there is no in-app history", () => {
    expect(HEADER).toContain("router.back()");
    expect(HEADER).toContain('router.push("/")');
  });
});
