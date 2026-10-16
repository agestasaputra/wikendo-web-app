import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { HISTORY_STORAGE_KEY } from "../../constants/storage";
import type { HistoryEntry } from "../../types/history";
import { useHistoryStore } from "../HistoryStore";

/**
 * HistoryStore.spec.ts — Riwayat E1 (localStorage wikendo_history, NOL backend).
 * happy-dom menyediakan localStorage; storage rusak/penuh tidak boleh merusak UI.
 */
const entry = (title: string): HistoryEntry => ({
  kind: "makan",
  title,
  sub: "GI · L2",
  at: 1,
});

describe("HistoryStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    window.localStorage.clear();
  });

  it("push: simpan ke state + localStorage (newest-first)", () => {
    const history = useHistoryStore();
    history.push(entry("A"));
    history.push(entry("B"));
    expect(history.items.map((e) => e.title)).toEqual(["B", "A"]);
    expect(
      JSON.parse(window.localStorage.getItem(HISTORY_STORAGE_KEY) ?? "[]"),
    ).toHaveLength(2);
  });

  it("push judul sama → tidak ganda", () => {
    const history = useHistoryStore();
    history.push(entry("A"));
    history.push(entry("A"));
    expect(history.items).toHaveLength(1);
  });

  it("load: baca dari localStorage (store baru = sesi baru)", () => {
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify([entry("X")]),
    );
    const history = useHistoryStore();
    history.load();
    expect(history.items[0]?.title).toBe("X");
  });

  it("load: storage rusak → list kosong (tidak crash)", () => {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, "{rusak");
    const history = useHistoryStore();
    history.load();
    expect(history.items).toEqual([]);
  });

  it("clear: hapus key + kosongkan state", () => {
    const history = useHistoryStore();
    history.push(entry("A"));
    history.clear();
    expect(history.items).toEqual([]);
    expect(window.localStorage.getItem(HISTORY_STORAGE_KEY)).toBeNull();
  });

  it("clear: localStorage melempar (diblok) → state tetap dikosongkan, tidak crash", () => {
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
