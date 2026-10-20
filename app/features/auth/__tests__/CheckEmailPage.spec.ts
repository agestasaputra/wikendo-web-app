import { describe, it, expect } from "vitest";
import { readSource, rootTag } from "~/test/utils";

/**
 * CheckEmailPage.spec.ts — Option B magic-link: /check-email page (Agesta lock Oct 10 2026, "Gas B").
 * WHY: instant signUp entry = bots slip through + email typo = failed reset.
 * Magic-link: Daftar → Cek email → click 1 link → HOME.
 */
const C = readSource(
  "features/auth/CheckEmailPage.vue",
  "features/auth/components/AuthBanner.vue",
);

describe("option B magic-link — /check-email page", () => {
  it("Cek email title + shows email from query + canvas from PAGE_BG", () => {
    expect(C).toContain("Cek email");
    expect(C).toContain("route.query.email");
    expect(rootTag(C)).not.toMatch(/background/i);
    expect(C).toContain("max-w-md mx-auto px-4 pb-10");
  });

  it("no local header (follows global AppHeader) + back-to-login link present", () => {
    expect(C).not.toContain("<header");
    expect(C).toContain("/login");
  });

  it("Kirim ulang button via resend type signup + inline success/error message", () => {
    expect(C).toContain("Kirim ulang");
    expect(C).toContain("resend");
    expect(C).toMatch(/["']signup["']/);
    expect(C).toContain("errorMsg");
    expect(C).toContain("successMsg");
  });

  it("ink banner matching register 1:1 (ember strip + 12 radius + lime numbers)", () => {
    expect(C).toContain("#0c0a09");
    expect(C).toContain("#ea580c");
    expect(C).toContain("border-radius:12px");
    expect(C).toContain("#d9f99d");
  });
});
