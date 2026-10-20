import { describe, it, expect } from "vitest";
import { pageTitle } from "../pageTitle";

/**
 * pageTitle.spec.ts — Centre title shown in TopNav so the user knows which page they are on.
 * WHY pure: the title is a string → no router/DB/browser needed, deterministic in CI.
 * Rule: "/" (Home) returns null so TopNav renders NO title there (the logo is the identity).
 */
describe("pageTitle — centre title in TopNav", () => {
  it("home → null, so TopNav renders no title on the home page", () => {
    expect(pageTitle("/")).toBeNull();
    expect(pageTitle("/?ref=wa")).toBeNull();
    expect(pageTitle("")).toBeNull();
  });

  it("quiz + result routes name the entity (place vs food)", () => {
    expect(pageTitle("/place")).toBe("Cari Tempat");
    expect(pageTitle("/result-place")).toBe("Rekomendasi Tempat");
    expect(pageTitle("/food")).toBe("Cari Makan");
    expect(pageTitle("/result-food")).toBe("Rekomendasi Makan");
  });

  it("tab routes match the BottomNav labels (no second dialect)", () => {
    expect(pageTitle("/mall")).toBe("Mall");
    expect(pageTitle("/history")).toBe("Riwayat");
    expect(pageTitle("/account")).toBe("Akun");
  });

  it("auth + legal routes", () => {
    expect(pageTitle("/login")).toBe("Masuk");
    expect(pageTitle("/register")).toBe("Daftar");
    expect(pageTitle("/check-email")).toBe("Cek Email");
    expect(pageTitle("/forgot-password")).toBe("Lupa Password");
    expect(pageTitle("/reset-password")).toBe("Reset Password");
    expect(pageTitle("/privacy")).toBe("Kebijakan Privasi");
    expect(pageTitle("/terms")).toBe("Syarat & Ketentuan");
  });

  it("mall detail → the mall name, never the raw slug", () => {
    expect(pageTitle("/mall/grand-indonesia")).toBe("Grand Indonesia");
    expect(pageTitle("/mall/pondok-indah-mall")).toBe("Pondok Indah Mall");
    expect(pageTitle("/mall/unknown-mall")).toBe("Unknown Mall");
  });

  it("tolerates a trailing slash / query string", () => {
    expect(pageTitle("/place/")).toBe("Cari Tempat");
    expect(pageTitle("/mall/grand-indonesia?tab=promo")).toBe(
      "Grand Indonesia",
    );
  });

  it("a future route still gets a readable title (no blank header)", () => {
    expect(pageTitle("/event")).toBe("Event");
    expect(pageTitle("/event/lineup")).toBe("Event");
  });
});
