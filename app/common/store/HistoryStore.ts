/**
 * common/store/HistoryStore.ts — Riwayat hasil quiz (Pinia + localStorage `wikendo_history`).
 *
 * APA: items + load() + push(entry) + clear(); cap 20 + dedupe judul (logic di utils/history).
 * KENAPA store: result tempat + result makan menulis, halaman Riwayat membaca → state bersama.
 *   localStorage NOL backend: anon tetap punya riwayat. Semua akses storage di-guard window + try/catch.
 * Contoh: useHistoryStore().push({ kind: "tempat", title: "Kopi", sub: "GI", at: Date.now() })
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
    // storage penuh / diblok → riwayat tidak tersimpan, UI tetap jalan
  }
}

function removeStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // storage diblok → state tetap dikosongkan
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
