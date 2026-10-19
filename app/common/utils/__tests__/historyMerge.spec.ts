/**
 * historyMerge.spec.ts — RED test (TDD) for merging localStorage history with the server page.
 *
 * WHAT: mergeHistory(local, remote) → union, dedupe by title, newest first, cap 20.
 * WHY: a logged-in user has BOTH device-local entries (written by the result pages while anon
 *   or offline) and server rows. Overwriting one with the other silently loses entries.
 * EXAMPLE: mergeHistory([{title:"A",at:1}], [{title:"B",at:2}]).map(t) → ["B","A"]
 */
import { describe, it, expect } from "vitest";
import { mergeHistory } from "../history";
import type { HistoryEntry } from "../../types/history";

const e = (
  title: string,
  at: number,
  kind: "place" | "food" = "place",
): HistoryEntry => ({
  kind,
  title,
  sub: "",
  at,
});

describe("mergeHistory — union of local + remote", () => {
  it("keeps both sides, newest first", () => {
    const res = mergeHistory([e("Lama", 100)], [e("Baru", 200)]);
    expect(res.map((x) => x.title)).toEqual(["Baru", "Lama"]);
  });

  it("same title → server row wins (fresher sub/at)", () => {
    const res = mergeHistory(
      [{ kind: "place", title: "Kopi", sub: "old", at: 100 }],
      [{ kind: "place", title: "Kopi", sub: "new", at: 300 }],
    );
    expect(res).toHaveLength(1);
    expect(res[0]?.sub).toBe("new");
    expect(res[0]?.at).toBe(300);
  });

  it("caps the result at 20 entries", () => {
    const local = Array.from({ length: 15 }, (_, i) => e(`L${i}`, 1000 + i));
    const remote = Array.from({ length: 15 }, (_, i) => e(`R${i}`, 2000 + i));
    expect(mergeHistory(local, remote)).toHaveLength(20);
  });

  it("empty remote → local unchanged (no wipe)", () => {
    const local = [e("A", 5), e("B", 4)];
    expect(mergeHistory(local, [])).toEqual(local);
  });

  it("empty local → remote only", () => {
    const remote = [e("A", 5)];
    expect(mergeHistory([], remote)).toEqual(remote);
  });

  it("does not mutate the inputs", () => {
    const local = [e("A", 1)];
    const remote = [e("B", 2)];
    mergeHistory(local, remote);
    expect(local).toHaveLength(1);
    expect(remote).toHaveLength(1);
  });
});
