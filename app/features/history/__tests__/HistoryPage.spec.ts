import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * HistoryPage.spec.ts — Riwayat E1 localStorage wikendo_history (Addendum docs/24).
 */
const RIW = readSource("features/history/HistoryPage.vue");
const STORE = readSource(
  "common/store/HistoryStore.ts",
  "common/constants/storage.ts",
);

describe("E1 riwayat localStorage wikendo_history", () => {
  it("halaman membaca HistoryStore + kosong jujur 1:1 home", () => {
    expect(RIW).toContain("useHistoryStore");
    expect(RIW).toContain("Belum ada riwayat");
  });

  it("store memakai key wikendo_history + guard window (anon/SSR aman)", () => {
    expect(STORE).toContain("wikendo_history");
    expect(STORE).toMatch(/typeof window/i);
  });
});
