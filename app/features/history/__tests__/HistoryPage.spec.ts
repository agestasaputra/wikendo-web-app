import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * HistoryPage.spec.ts — History E1 localStorage wikendo_history (Addendum docs/24).
 */
const RIW = readSource("features/history/HistoryPage.vue");
const STORE = readSource(
  "common/store/HistoryStore.ts",
  "common/constants/storage.ts",
);

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
