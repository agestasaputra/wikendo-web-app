import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * AppHeader.spec.ts — Header global 2-state AS6 wallet-card (Addendum 22) + layout app.vue.
 * Gabungan header-layout (9 Okt: lebar = content, menu nav dihapus, 🔔 di kanan) +
 * auth-state-home (avatar + dropdown + logout real). Dibaca sebagai teks: NOL network, deterministik di CI.
 */
const HEADER = readSource("common/components/AppHeader.vue");
const APP = readSource("app.vue");

describe("header global (AppHeader.vue)", () => {
  it("lebar header = content (max-w-md, bukan max-w-4xl)", () => {
    expect(HEADER).toContain("max-w-md");
    expect(HEADER).not.toContain("max-w-4xl");
  });

  it("menu nav Tempat/Makan/Mall dihapus dari header", () => {
    expect(HEADER).not.toContain('to="/quiz"');
    expect(HEADER).not.toContain('to="/makan"');
    expect(HEADER).not.toContain('to="/mall"');
  });

  it("anon: tombol Login + Register; login: icon notifikasi 🔔 di kanan", () => {
    expect(HEADER).toContain("🔔");
    expect(HEADER).toContain("Login");
    expect(HEADER).toContain("Register");
  });
});

describe("auth-state-home — header 2-state (avatar + dropdown)", () => {
  it("pakai AuthStore (bukan isLoggedIn hantu)", () => {
    expect(HEADER).toContain("useAuthStore");
  });

  it("after-login: avatar initial + Bell tetap ada", () => {
    expect(HEADER).toMatch(/avatar|displayName|initial/i);
  });

  it("dropdown mini: email display + Riwayat + Wishlist + Keluar", () => {
    expect(HEADER).toContain("Riwayat");
    expect(HEADER).toContain("Wishlist");
    expect(HEADER).toMatch(/Keluar|Logout|signOut/i);
  });

  it("logout real: signOut + balik ke /", () => {
    expect(HEADER).toContain("signOut");
    expect(HEADER).toMatch(/push\(["']\/["']\)/);
  });
});

describe("app.vue — layout global tipis", () => {
  it("memasang AppHeader + NuxtPage + BottomNav + init session Supabase", () => {
    expect(APP).toContain("<AppHeader");
    expect(APP).toContain("<NuxtPage");
    expect(APP).toContain("<BottomNav");
    expect(APP).toContain("auth.init()");
  });

  it("anti-ketutup nav fixed: pb-24 + footer id tentang untuk anchor Akun", () => {
    expect(APP).toMatch(/pb-24|padding-bottom|pb-20|pb-28/i);
    expect(APP).toMatch(/id=.tentang.|#tentang/);
  });
});
