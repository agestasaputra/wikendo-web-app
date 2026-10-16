/**
 * common/utils/history.ts — Logic murni riwayat (parse storage, tambah entry, cap + dedupe).
 *
 * APA: parseHistory(raw) + addHistoryEntry(list, entry). PURE: tanpa akses localStorage.
 * KENAPA: dulu ditulis 2x (result tempat + result makan) → 1 sumber, testable.
 * Contoh: addHistoryEntry([], { kind: "tempat", title: "A", sub: "", at: 1 }) → [entry].
 */
import { HISTORY_MAX_ENTRIES } from "../constants/storage";
import type { HistoryEntry } from "../types/history";

/** JSON string localStorage → list. Null/rusak/bukan array = [] (aman). */
export function parseHistory(raw: string | null): HistoryEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed as HistoryEntry[]).slice(0, HISTORY_MAX_ENTRIES)
      : [];
  } catch {
    return [];
  }
}

/** Tambah di depan; judul sama = tidak ganda (list sama); dipotong max 20. */
export function addHistoryEntry(
  list: HistoryEntry[],
  entry: HistoryEntry,
): HistoryEntry[] {
  if (list.some((x) => x.title === entry.title)) return list;
  return [entry, ...list].slice(0, HISTORY_MAX_ENTRIES);
}

/** Selisih waktu → "barusan" / "5m lalu" / "2j lalu" / tanggal id-ID. */
export function timeAgo(at: number, now: number = Date.now()): string {
  const d = now - at;
  if (d < 60_000) return "barusan";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m lalu`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}j lalu`;
  return new Date(at).toLocaleDateString("id-ID");
}
