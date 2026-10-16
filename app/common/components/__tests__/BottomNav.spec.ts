import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * BottomNav.spec.ts — Gas E1 BottomNav Home-Mall-Quiz+-Riwayat-Akun (Addendum docs/24).
 * Kunci: 5-tab + sheet Quiz+ 2 intent quota jujur. Dibaca sebagai teks (nav + sheet = 2 komponen).
 */
const NAV = readSource(
  "common/components/BottomNav.vue",
  "common/components/QuizPlusSheet.vue",
);

describe("E1 BottomNav component 5-tab", () => {
  it("5 tab: Home + Mall + Quiz+ + Riwayat + Akun", () => {
    expect(NAV).toContain("Home");
    expect(NAV).toMatch(/\/mall|Mall/);
    expect(NAV).toMatch(/Quiz\+|QuizPlus|quiz-plus/i);
    expect(NAV).toMatch(/Riwayat|riwayat/);
    expect(NAV).toMatch(/Akun|account/);
  });

  it("max-w-md + fixed bottom + thumb-zone", () => {
    expect(NAV).toContain("max-w-md");
    expect(NAV).toMatch(/fixed|sticky/);
    expect(NAV).toMatch(/bottom-0|bottom/);
  });

  it("active state lime + dot", () => {
    expect(NAV).toMatch(/a3e635|lime/i);
  });

  it("Quiz+ center BUKAN route (buka sheet, bukan NuxtLink langsung ke /quiz atau /makan)", () => {
    expect(NAV).toMatch(/<button/i);
    expect(NAV).toMatch(/sheet|showSheet|sheetOpen/i);
  });
});

describe("E1 sheet Quiz+ 2 intent quota jujur", () => {
  it("sheet 2 kartu: Cari Tempat → /quiz + Cari Makan → /makan", () => {
    expect(NAV).toContain("/quiz");
    expect(NAV).toContain("/makan");
    expect(NAV).toMatch(/Cari Tempat|Tempat/i);
    expect(NAV).toMatch(/Cari Makan|Makan/i);
  });

  it("quota jujur: 2/hari tempat + 5/hari makan atau sisa real", () => {
    expect(NAV).toMatch(/2\/hari|2x|1\/1|x\/2/i);
    expect(NAV).toMatch(/5\/hari|5x|2\/2|x\/5/i);
  });

  it("habis disabled jujur Besok lagi 00.00", () => {
    expect(NAV).toMatch(/Besok lagi|00\.00/);
    expect(NAV).toContain(":disabled");
  });

  it("tutup backdrop/X + aria-label", () => {
    expect(NAV).toMatch(/backdrop|@click.*close|showSheet\s*=\s*false/i);
    expect(NAV).toMatch(/aria-label/);
  });
});
