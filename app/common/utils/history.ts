/**
 * common/utils/history.ts — Pure history logic (parse storage, add entry, cap + dedupe).
 *
 * WHAT: parseHistory(raw) + addHistoryEntry(list, entry). PURE: no localStorage access.
 * WHY: previously written 2x (place result + food result) → single source of truth, testable.
 * EXAMPLE: addHistoryEntry([], { kind: "place", title: "A", sub: "", at: 1 }) → [entry].
 */
import { HISTORY_MAX_ENTRIES } from "../constants/storage";
import type { HistoryEntry, HistoryKind } from "../types/history";
import { isResultId } from "./resultUrl";

/** Old `kind` values (pre-rename flow) → new values. localStorage migration. */
const LEGACY_KIND: Record<string, HistoryKind> = {
  tempat: "place",
  makan: "food",
};

/** Raw `kind` → HistoryKind; old values are mapped, unknown → "place". */
function normalizeKind(kind: unknown): HistoryKind {
  if (kind === "place" || kind === "food") return kind;
  return LEGACY_KIND[String(kind)] ?? "place";
}

/** 1 raw storage row → HistoryEntry (kind normalized, other fields coerced). */
function normalizeEntry(raw: unknown): HistoryEntry {
  const e = (raw ?? {}) as Partial<HistoryEntry>;
  return {
    kind: normalizeKind(e.kind),
    // Pre-change entries have no id; a junk id must not become a broken link.
    ...(isResultId(e.id) ? { id: e.id } : {}),
    title: String(e.title ?? ""),
    sub: String(e.sub ?? ""),
    at: Number(e.at ?? 0),
  };
}

/** localStorage JSON string → list. Null/corrupt/not an array = [] (safe). */
export function parseHistory(raw: string | null): HistoryEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.slice(0, HISTORY_MAX_ENTRIES).map(normalizeEntry)
      : [];
  } catch {
    return [];
  }
}

/** Add at the front; same title = no duplicate (same list); truncated to max 20. */
export function addHistoryEntry(
  list: HistoryEntry[],
  entry: HistoryEntry,
): HistoryEntry[] {
  if (list.some((x) => x.title === entry.title)) return list;
  return [entry, ...list].slice(0, HISTORY_MAX_ENTRIES);
}

/** Time difference → "barusan" / "5m lalu" / "2j lalu" / id-ID date. */
export function timeAgo(at: number, now: number = Date.now()): string {
  const d = now - at;
  if (d < 60_000) return "barusan";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m lalu`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}j lalu`;
  return new Date(at).toLocaleDateString("id-ID");
}

/**
 * Device history (localStorage) + server page → one list.
 *
 * WHAT: union by title (server row wins — it has the canonical sub/time), newest first, cap 20.
 * WHY: a logged-in user can have BOTH device-local entries (written while anon/offline) and
 *   server rows. Overwriting one side with the other silently loses entries.
 * EXAMPLE: mergeHistory([{title:"A",at:1}], [{title:"B",at:2}]) → ["B","A"]
 */
export function mergeHistory(
  local: HistoryEntry[],
  remote: HistoryEntry[],
): HistoryEntry[] {
  const byTitle = new Map<string, HistoryEntry>();
  for (const entry of remote) byTitle.set(entry.title, entry);
  for (const entry of local) {
    if (!byTitle.has(entry.title)) byTitle.set(entry.title, entry);
  }
  return Array.from(byTitle.values())
    .sort((a, b) => b.at - a.at)
    .slice(0, HISTORY_MAX_ENTRIES);
}
