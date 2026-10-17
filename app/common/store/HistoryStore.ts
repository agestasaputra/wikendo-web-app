/**
 * common/store/HistoryStore.ts — Quiz result history (Pinia + localStorage `wikendo_history`).
 *
 * WHAT: items + load() + push(entry) + clear(); cap 20 + title dedupe (logic in utils/history).
 * WHY store: place result + food result write, the Riwayat page reads → shared state.
 *   localStorage with ZERO backend: anonymous users still get history. Every storage access is guarded by window + try/catch.
 * EXAMPLE: useHistoryStore().push({ kind: "place", title: "Kopi", sub: "GI", at: Date.now() })
 */
import { ref } from "vue";
import { defineStore } from "pinia";
import { HISTORY_STORAGE_KEY } from "../constants/storage";
import type { HistoryEntry } from "../types/history";
import { addHistoryEntry, parseHistory } from "../utils/history";

function readStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(HISTORY_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorage(list: HistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage full / blocked → history isn't saved, UI keeps working
  }
}

function removeStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // storage blocked → the state is still emptied
  }
}

export const useHistoryStore = defineStore("historyStore", () => {
  const items = ref<HistoryEntry[]>([]);

  function load(): void {
    items.value = parseHistory(readStorage());
  }

  function push(entry: HistoryEntry): void {
    const next = addHistoryEntry(parseHistory(readStorage()), entry);
    writeStorage(next);
    items.value = next;
  }

  function clear(): void {
    removeStorage();
    items.value = [];
  }

  return { items, load, push, clear };
});
