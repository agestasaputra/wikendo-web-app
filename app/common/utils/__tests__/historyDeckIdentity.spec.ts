/**
 * historyDeckIdentity.spec.ts — RED tests (TDD) for deck identity in history.
 *
 * WHAT: a history card is ONE place/food, but it must always point at the NEWEST stored deck.
 * WHY: cards dedupe by title, so before this fix `addHistoryEntry` returned the OLD list when a
 *   second deck of the same place was generated → the newer deck got no card (and merge kept the
 *   oldest id). That silently broke "buka hasil dari history" for repeat quizzes.
 * EXAMPLE: addHistoryEntry([{title:"GBK",id:A}], {title:"GBK",id:B}) → [{id:B}] (1 card, newest).
 */
import { describe, it, expect } from "vitest";
import { addHistoryEntry, mergeHistory } from "../history";
import type { HistoryEntry } from "../../types/history";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";

const deck = (
  title: string,
  id: string | undefined,
  at: number,
  kind: "place" | "food" = "place",
): HistoryEntry => ({ kind, ...(id ? { id } : {}), title, sub: "", at });

describe("addHistoryEntry — one card per place, newest deck wins", () => {
  it("same title, NEW deck id → card replaced with the newer id (not dropped)", () => {
    const res = addHistoryEntry(
      [deck("Hutan Kota GBK", A, 1)],
      deck("Hutan Kota GBK", B, 2),
    );
    expect(res).toHaveLength(1);
    expect(res[0]?.id).toBe(B);
    expect(res[0]?.at).toBe(2);
  });

  it("same deck id pushed twice → list unchanged (no reorder, no duplicate)", () => {
    const list = [deck("GBK", A, 1)];
    expect(addHistoryEntry(list, deck("GBK", A, 2))).toBe(list);
  });

  it("legacy entry without id + same title → replaced by the clickable deck", () => {
    const res = addHistoryEntry([deck("GBK", undefined, 1)], deck("GBK", A, 2));
    expect(res).toHaveLength(1);
    expect(res[0]?.id).toBe(A);
  });

  it("different titles both kept, newest first", () => {
    const res = addHistoryEntry(
      [deck("GBK", A, 1)],
      deck("Senayan Park", B, 2),
    );
    expect(res.map((e) => e.id)).toEqual([B, A]);
  });
});

describe("mergeHistory — server page must not shadow with an older/anonless deck", () => {
  it("newest-first remote rows of the same place → newest id survives", () => {
    const remote = [deck("GBK", B, 200), deck("GBK", A, 100)];
    expect(mergeHistory([], remote).map((e) => e.id)).toEqual([B]);
  });

  it("local deck is newer than the remote row → local id survives", () => {
    const local = [deck("GBK", B, 300)];
    const remote = [deck("GBK", A, 100)];
    expect(mergeHistory(local, remote).map((e) => e.id)).toEqual([B]);
  });

  it("clickable entry beats a legacy entry with the same title", () => {
    const merged = mergeHistory(
      [deck("GBK", undefined, 900)],
      [deck("GBK", C, 100)],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe(C);
  });
});
