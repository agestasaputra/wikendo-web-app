import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * PlaceResultPage.spec.ts — PLACE result: writes history (E1) + "Coba lagi" button anti double-fetch.
 */
const RES = readSource(
  "features/place/PlaceResultPage.vue",
  "common/components/ResultError.vue",
);

describe("E1 place result writes history", () => {
  it("pushes to HistoryStore on success (kind place)", () => {
    expect(RES).toContain("useHistoryStore");
    expect(RES).toMatch(/kind:\s*["']place["']/);
  });
});

describe("content buttons — disabled while fetching (anti double-fetch)", () => {
  it("Coba lagi button disabled while pending", () => {
    expect(RES).toContain("Coba lagi");
    expect(RES).toContain(':disabled="pending"');
  });
});
