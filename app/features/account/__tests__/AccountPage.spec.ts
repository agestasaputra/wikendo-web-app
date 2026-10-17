import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * AccountPage.spec.ts — 2-state Account Hub mirroring AS6 (Addendum docs/24 E1).
 */
const ACC = readSource(
  "features/account/AccountPage.vue",
  "common/components/AppSpinner.vue",
);

describe("E1 account hub 2-state mirroring AS6", () => {
  it("uses 2-state AuthStore (isLoggedIn + displayName)", () => {
    expect(ACC).toContain("useAuthStore");
    expect(ACC).toContain("isLoggedIn");
    expect(ACC).toContain("displayName");
  });

  it("anon: Login CTA → /login + Daftar → /register + 2+5 note", () => {
    expect(ACC).toContain("/login");
    expect(ACC).toContain("/register");
    expect(ACC).toMatch(/2.*5|5.*2|gratis/i);
  });

  it("logged in: initial avatar + email + red Keluar with spinner+guard", () => {
    expect(ACC).toMatch(/initial|avatar/i);
    expect(ACC).toContain("Keluar");
    expect(ACC).toContain("animate-spin");
    expect(ACC).toContain(":disabled");
    expect(ACC).toMatch(/if\s*\(\s*loggingOut|if\s*\(\s*loading/i);
    expect(ACC).toContain("signOut");
  });

  it("4 hub rows: Riwayat + Wishlist Segera + WA + Tentang", () => {
    expect(ACC).toContain("Riwayat");
    expect(ACC).toContain("Wishlist");
    expect(ACC).toContain("Segera");
    expect(ACC).toMatch(/wa\.me|Hubungi/i);
    expect(ACC).toMatch(/Tentang|tentang/i);
  });
});
