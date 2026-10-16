import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * TempatResultPage.spec.ts — Result TEMPAT: tulis riwayat (E1) + tombol Coba lagi anti double-fetch.
 */
const RES = readSource(
  "features/tempat/TempatResultPage.vue",
  "common/components/ResultError.vue",
);

describe("E1 result tempat tulis riwayat", () => {
  it("push ke HistoryStore pas data sukses (kind tempat)", () => {
    expect(RES).toContain("useHistoryStore");
    expect(RES).toMatch(/kind:\s*["']tempat["']/);
  });
});

describe("content buttons — disabled saat fetch (anti double-fetch)", () => {
  it("tombol Coba lagi disabled saat pending", () => {
    expect(RES).toContain("Coba lagi");
    expect(RES).toContain(':disabled="pending"');
  });
});
