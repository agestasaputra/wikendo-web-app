import { describe, it, expect } from "vitest";
import { addHistoryEntry, parseHistory, timeAgo } from "../history";
import type { HistoryEntry } from "../../types/history";

/**
 * history.spec.ts — Pure history logic test (E1 localStorage wikendo_history).
 * Rules: cap 20 newest-first, dedupe title, broken storage = empty list (no crash).
 */
const entry = (title: string, at = 1): HistoryEntry => ({
  kind: "place",
  title,
  sub: "",
  at,
});

describe("parseHistory (string localStorage → list)", () => {
  it("null/empty → []", () => {
    expect(parseHistory(null)).toEqual([]);
    expect(parseHistory("")).toEqual([]);
  });

  it("broken JSON / not an array → [] (safe)", () => {
    expect(parseHistory("{rusak")).toEqual([]);
    expect(parseHistory('{"a":1}')).toEqual([]);
  });

  it("valid array → used, max 20", () => {
    const many = Array.from({ length: 30 }, (_, i) => entry(`T${i}`));
    expect(parseHistory(JSON.stringify(many))).toHaveLength(20);
  });

  it("legacy kind (tempat/makan) → migrates to place/food", () => {
    const legacy = JSON.stringify([
      { kind: "tempat", title: "A", sub: "", at: 1 },
      { kind: "makan", title: "B", sub: "", at: 2 },
    ]);
    expect(parseHistory(legacy).map((e) => e.kind)).toEqual(["place", "food"]);
  });
});

describe("addHistoryEntry (prepend, dedupe, cap 20)", () => {
  it("new entry at the front", () => {
    const res = addHistoryEntry([entry("A")], entry("B"));
    expect(res.map((e) => e.title)).toEqual(["B", "A"]);
  });

  it("same title → one card, refreshed to the newest time", () => {
    const list = [entry("A", 1)];
    const res = addHistoryEntry(list, entry("A", 99));
    expect(res).toHaveLength(1);
    expect(res[0]?.at).toBe(99);
  });

  it("same deck id → list unchanged (same reference, no duplicate)", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const list: HistoryEntry[] = [
      { kind: "place", id, title: "A", sub: "", at: 1 },
    ];
    expect(
      addHistoryEntry(list, { kind: "place", id, title: "A", sub: "", at: 99 }),
    ).toBe(list);
  });

  it("more than 20 → oldest entry dropped", () => {
    const list = Array.from({ length: 20 }, (_, i) => entry(`T${i}`));
    const res = addHistoryEntry(list, entry("BARU"));
    expect(res).toHaveLength(20);
    expect(res[0]?.title).toBe("BARU");
    expect(res.some((e) => e.title === "T19")).toBe(false);
  });
});

describe("timeAgo (time difference → label)", () => {
  const now = 1_000_000_000_000;

  it("< 1 minute → barusan", () => {
    expect(timeAgo(now - 30_000, now)).toBe("barusan");
  });

  it('minutes → "5m lalu", hours → "2j lalu"', () => {
    expect(timeAgo(now - 5 * 60_000, now)).toBe("5m lalu");
    expect(timeAgo(now - 2 * 3_600_000, now)).toBe("2j lalu");
  });

  it("> 1 day → local date id-ID", () => {
    expect(timeAgo(now - 2 * 86_400_000, now)).toBe(
      new Date(now - 2 * 86_400_000).toLocaleDateString("id-ID"),
    );
  });
});
