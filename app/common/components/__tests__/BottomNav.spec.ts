import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * BottomNav.spec.ts — Gas E1 BottomNav Home-Mall-Quiz+-History-Account (Addendum docs/24).
 * Pinned: 5 tabs + Quiz+ sheet with 2 honest quota intents. Read as text (nav + sheet = 2 components).
 * v1.4: the sheet must render the REAL limit from GET /api/quota (anon 1•1, member 2•5)
 * instead of a hardcoded "2/hari / 5/hari" that lies to anonymous users.
 */
const NAV = readSource(
  "common/components/BottomNav.vue",
  "common/components/QuizPlusSheet.vue",
);

describe("E1 BottomNav component 5-tab", () => {
  it("5 tabs: Home + Mall + Quiz+ + History + Account", () => {
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

  it("Quiz+ center is NOT a route (opens a sheet, not a direct NuxtLink to /quiz or /food)", () => {
    expect(NAV).toMatch(/<button/i);
    expect(NAV).toMatch(/sheet|showSheet|sheetOpen/i);
  });
});

describe("E1 Quiz+ sheet with 2 honest quota intents", () => {
  it("2-card sheet: Find Place → /quiz + Find Food → /food", () => {
    expect(NAV).toContain("/quiz");
    expect(NAV).toContain("/food");
    expect(NAV).toMatch(/Cari Tempat|Tempat/i);
    expect(NAV).toMatch(/Cari Makan|Makan/i);
  });

  it("honest quota: renders the real remaining/limit from the API, not a hardcoded 2/hari", () => {
    expect(NAV).toMatch(/placeLeft[\s\S]{0,40}placeLimit/);
    expect(NAV).toMatch(/foodLeft[\s\S]{0,40}foodLimit/);
    expect(NAV).not.toMatch(/2\/hari/);
    expect(NAV).not.toMatch(/5\/hari/);
  });

  it("anonymous gets the login upsell inside the sheet", () => {
    expect(NAV).toMatch(/Login gratis/i);
    expect(NAV).toMatch(/riwayat/i);
    expect(NAV).toContain("isLoggedIn");
  });

  it("exhausted honestly disabled Come back tomorrow 00.00", () => {
    expect(NAV).toMatch(/Besok lagi|00\.00/);
    expect(NAV).toContain(":disabled");
  });

  it("close via backdrop/X + aria-label", () => {
    expect(NAV).toMatch(/backdrop|@click.*close|showSheet\s*=\s*false/i);
    expect(NAV).toMatch(/aria-label/);
  });
});
