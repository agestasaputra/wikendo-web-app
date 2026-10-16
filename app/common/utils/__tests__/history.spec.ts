import { describe, it, expect } from "vitest";
import { addHistoryEntry, parseHistory, timeAgo } from "../history";
import type { HistoryEntry } from "../../types/history";

/**
 * history.spec.ts — Test logic murni riwayat (E1 localStorage wikendo_history).
 * Aturan: cap 20 newest-first, dedupe judul, storage rusak = list kosong (tidak crash).
 */
const entry = (title: string, at = 1): HistoryEntry => ({
  kind: "tempat",
  title,
  sub: "",
  at,
});

describe("parseHistory (string localStorage → list)", () => {
  it("null/kosong → []", () => {
    expect(parseHistory(null)).toEqual([]);
    expect(parseHistory("")).toEqual([]);
  });

  it("JSON rusak / bukan array → [] (aman)", () => {
    expect(parseHistory("{rusak")).toEqual([]);
    expect(parseHistory('{"a":1}')).toEqual([]);
  });

  it("array valid → dipakai, maksimal 20", () => {
    const many = Array.from({ length: 30 }, (_, i) => entry(`T${i}`));
    expect(parseHistory(JSON.stringify(many))).toHaveLength(20);
  });
});

describe("addHistoryEntry (tambah di depan, dedupe, cap 20)", () => {
  it("entry baru di depan", () => {
    const res = addHistoryEntry([entry("A")], entry("B"));
    expect(res.map((e) => e.title)).toEqual(["B", "A"]);
  });

  it("judul sama → tidak ganda (list tidak berubah)", () => {
    const list = [entry("A")];
    expect(addHistoryEntry(list, entry("A", 99))).toBe(list);
  });

  it("lebih dari 20 → entry paling lama dibuang", () => {
    const list = Array.from({ length: 20 }, (_, i) => entry(`T${i}`));
    const res = addHistoryEntry(list, entry("BARU"));
    expect(res).toHaveLength(20);
    expect(res[0]?.title).toBe("BARU");
    expect(res.some((e) => e.title === "T19")).toBe(false);
  });
});

describe("timeAgo (selisih waktu → label)", () => {
  const now = 1_000_000_000_000;

  it("< 1 menit → barusan", () => {
    expect(timeAgo(now - 30_000, now)).toBe("barusan");
  });

  it('menit → "5m lalu", jam → "2j lalu"', () => {
    expect(timeAgo(now - 5 * 60_000, now)).toBe("5m lalu");
    expect(timeAgo(now - 2 * 3_600_000, now)).toBe("2j lalu");
  });

  it("> 1 hari → tanggal lokal id-ID", () => {
    expect(timeAgo(now - 2 * 86_400_000, now)).toBe(
      new Date(now - 2 * 86_400_000).toLocaleDateString("id-ID"),
    );
  });
});
