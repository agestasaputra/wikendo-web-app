import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { HISTORY_STORAGE_KEY } from "../../constants/storage";
import type { HistoryEntry } from "../../types/history";
import { useHistoryStore } from "../HistoryStore";

/**
 * HistoryStore.spec.ts — History E1 (localStorage wikendo_history, ZERO backend).
 * happy-dom provides localStorage; broken/full storage must not break the UI.
 */
const entry = (title: string): HistoryEntry => ({
  kind: "food",
  title,
  sub: "GI · L2",
  at: 1,
});

describe("HistoryStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    window.localStorage.clear();
  });

  it("push: saves to state + localStorage (newest-first)", () => {
    const history = useHistoryStore();
    history.push(entry("A"));
    history.push(entry("B"));
    expect(history.items.map((e) => e.title)).toEqual(["B", "A"]);
    expect(
      JSON.parse(window.localStorage.getItem(HISTORY_STORAGE_KEY) ?? "[]"),
    ).toHaveLength(2);
  });

  it("push same title → no duplicate", () => {
    const history = useHistoryStore();
    history.push(entry("A"));
    history.push(entry("A"));
    expect(history.items).toHaveLength(1);
  });

  it("load: reads from localStorage (new store = new session)", () => {
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify([entry("X")]),
    );
    const history = useHistoryStore();
    history.load();
    expect(history.items[0]?.title).toBe("X");
  });

  it("load: broken storage → empty list (no crash)", () => {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, "{rusak");
    const history = useHistoryStore();
    history.load();
    expect(history.items).toEqual([]);
  });

  it("clear: removes key + empties state", () => {
    const history = useHistoryStore();
    history.push(entry("A"));
    history.clear();
    expect(history.items).toEqual([]);
    expect(window.localStorage.getItem(HISTORY_STORAGE_KEY)).toBeNull();
  });

  it("clear: localStorage throws (blocked) → state still emptied, no crash", () => {
    const history = useHistoryStore();
    history.push(entry("A"));
    const spy = vi
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    expect(() => history.clear()).not.toThrow();
    expect(history.items).toEqual([]);
    spy.mockRestore();
  });
});
