import { describe, it, expect } from "vitest";
import { readCode, readSource } from "~/test/utils";

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
/** Comments stripped → order asserts compare CODE positions, not prose. */
const RIW_CODE = readCode("features/history/HistoryPage.vue");

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

describe("history first load — skeleton before content", () => {
  it("renders the history skeleton while the page boots", () => {
    expect(RIW).toContain(
      '<AppLoader v-if="showSkeleton" variant="history" />',
    );
  });

  it("the first-paint gate owns the load (no second onMounted race)", () => {
    // Gate contract: ONE task = load, and showSkeleton is derived from the gate.
    expect(RIW).toContain('useFirstLoad({ key: "history", task: load })');
    expect(RIW).toMatch(
      /const showSkeleton = computed\(\(\) => booting\.value\)/,
    );
    // load() replaced onMounted — two loaders would merge the server page twice.
    expect(RIW_CODE).not.toContain("onMounted");
  });

  it("the skeleton branch wins over the empty state (no 'Belum ada riwayat' flash)", () => {
    expect(RIW_CODE.indexOf("showSkeleton")).toBeLessThan(
      RIW_CODE.indexOf("Belum ada riwayat"),
    );
  });
});

describe("history search + filter button (side by side)", () => {
  it("has a search input bound to searchQuery", () => {
    expect(RIW).toContain('data-testid="history-search"');
    expect(RIW).toMatch(/v-model="searchQuery"/);
  });

  it("filters items by title and sub, case-insensitive", () => {
    expect(RIW).toMatch(/searchQuery\.value\.trim\(\)\.toLowerCase\(\)/);
    expect(RIW).toMatch(/it\.title\.toLowerCase\(\)\.includes\(q\)/);
    expect(RIW).toMatch(/it\.sub/);
  });

  it("Filter button comes AFTER the search input (right side)", () => {
    const code = RIW_CODE;
    expect(code.indexOf('data-testid="history-search"')).toBeLessThan(
      code.indexOf('data-testid="open-filter"'),
    );
  });

  it("honest empty state for a search miss (not the generic copy)", () => {
    expect(RIW).toContain("Tidak ada riwayat untuk");
  });
});
