import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * HistoryPage.spec.ts — History E1 localStorage wikendo_history (Addendum docs/24)
 * + the logged-in read path (Bearer + row mapping + merge).
 *
 * WHAT: locks the /history contract: localStorage first, server page second,
 *   merged (never overwritten), rows mapped to HistoryEntry (never blank).
 * WHY: the page used to call $fetch WITHOUT the Bearer token (→ 401 swallowed silently)
 *   and assigned raw DB rows into `history.items` (→ blank titles + NaN time).
 */
const RIW = readSource("features/history/HistoryPage.vue");
const STORE = readSource(
  "common/store/HistoryStore.ts",
  "common/constants/storage.ts",
);
const ROW = readSource("common/utils/historyRow.ts");

describe("E1 history localStorage wikendo_history", () => {
  it("page reads HistoryStore + honest empty matches home 1:1", () => {
    expect(RIW).toContain("useHistoryStore");
    expect(RIW).toContain("Belum ada riwayat");
  });

  it("store uses wikendo_history key + window guard (anon/SSR safe)", () => {
    expect(STORE).toContain("wikendo_history");
    expect(STORE).toMatch(/typeof window/i);
  });
});

describe("history read path — Bearer token (the server is gated)", () => {
  it("reads the session access_token and sends Authorization: Bearer", () => {
    expect(RIW).toContain("getSession");
    expect(RIW).toMatch(/access_token/);
    expect(RIW).toMatch(/Authorization/);
    expect(RIW).toMatch(/Bearer/);
  });

  it("does NOT rely on cookies for auth (localStorage session has no cookie)", () => {
    expect(RIW).not.toMatch(/credentials:\s*["']include["']/);
  });

  it("does not overwrite device history when the API returns nothing", () => {
    expect(RIW).toContain("mergeHistory");
  });
});

describe("history read path — row mapping (never blank rows)", () => {
  it("maps API rows with toHistoryEntries instead of assigning raw rows", () => {
    expect(RIW).toContain("toHistoryEntries");
    expect(RIW).not.toMatch(/history\.items\s*=\s*response\.items/);
  });

  it("the mapper module exists and is pure", () => {
    expect(ROW).toContain("export function toHistoryEntry");
    expect(ROW).toContain("export function toHistoryEntries");
  });
});

describe("history cards — Image Cards (option 9) styling", () => {
  it("uses Tailwind classes that actually exist (no orphan .thumb/.card rules)", () => {
    expect(RIW).not.toContain('class="thumb"');
    expect(RIW).not.toContain('class="grid3"');
  });

  it("keeps the option-9 anatomy: image band + title + sub + time", () => {
    expect(RIW).toMatch(/h-\[120px\]/);
    expect(RIW).toContain("line-clamp-1");
    expect(RIW).toContain("timeAgo");
  });

  it("the image band renders a visual placeholder (HistoryEntry has no image field)", () => {
    // HistoryEntry = {kind,title,sub,at} → no image URL exists, so the band is a
    // design-correct emoji/tint placeholder, never a broken <img>.
    expect(RIW).toMatch(/🍜|📍/);
    expect(RIW).toContain("bg-stone-100");
  });
});
