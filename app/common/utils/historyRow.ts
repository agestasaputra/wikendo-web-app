/**
 * common/utils/historyRow.ts — Supabase `generations` row → HistoryEntry (PURE).
 *
 * WHAT: toHistoryEntry(row) + toHistoryEntries(rows). The DB stores `quiz_input` +
 *   `recommendations` (JSONB); the UI needs the flat `{ kind, title, sub, at }` shape.
 * WHY: /history used to assign raw rows into `history.items`, so every card rendered an
 *   `undefined` title and `timeAgo(undefined)` → NaN. One mapper keeps the API and the
 *   localStorage writer (PlaceResultPage / FoodResultPage) producing identical entries.
 * EXAMPLE: toHistoryEntry({ quiz_input: { type: "food", mall_slug: "grand-indonesia" },
 *   recommendations: [{ name: "Kopi", floor: "2" }], created_at: "2026-10-18T10:00:00Z" })
 *   → { kind: "food", title: "Kopi", sub: "L2 · GI", at: 1760781600000 }
 */
import { getMallShortLabel } from "./mall";
import type { HistoryEntry, HistoryKind } from "../types/history";

/** Raw JSONB shape we read off a `generations` row (all fields optional). */
export interface HistorySourceRow {
  quiz_input?: {
    type?: string | null;
    mall_slug?: string | null;
    location?: string | null;
  } | null;
  recommendations?: HistorySourceRec[] | null;
  created_at?: string | null;
}

interface HistorySourceRec {
  name?: string | null;
  floor?: string | number | null;
  location_area?: string | null;
  category?: string | null;
  reason?: string | null;
}

/** `type` → HistoryKind; anything unknown falls back to "place" (never crashes). */
function toKind(type: unknown): HistoryKind {
  return type === "food" ? "food" : "place";
}

/** First recommendation of a row (or null when the row is empty/malformed). */
function firstRec(row: HistorySourceRow): HistorySourceRec | null {
  const recs = row.recommendations;
  if (!Array.isArray(recs) || !recs.length) return null;
  return recs[0] ?? null;
}

/** Food sub-line: "L<floor> · <mall short label>" (floor omitted when unknown). */
function foodSub(
  rec: HistorySourceRec | null,
  mallSlug: string | null | undefined,
): string {
  const floor = rec?.floor ? `L${rec.floor}` : "";
  const mall = mallSlug ? getMallShortLabel(mallSlug) : "";
  return [floor, mall].filter(Boolean).join(" · ");
}

/** Place sub-line: location_area → category → "". */
function placeSub(rec: HistorySourceRec | null): string {
  return rec?.location_area || rec?.category || "";
}

/** `created_at` ISO string → epoch ms; invalid/missing = 0 so timeAgo stays finite. */
function toEpoch(createdAt: string | null | undefined): number {
  if (!createdAt) return 0;
  const ms = new Date(createdAt).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

/** 1 `generations` row → 1 `HistoryEntry`. Never throws, never returns blank fields. */
export function toHistoryEntry(row: HistorySourceRow): HistoryEntry {
  const safe = row ?? {};
  const rec = firstRec(safe);
  const kind = toKind(safe.quiz_input?.type);
  return {
    kind,
    title: rec?.name || "—",
    sub:
      kind === "food"
        ? foodSub(rec, safe.quiz_input?.mall_slug)
        : placeSub(rec),
    at: toEpoch(safe.created_at),
  };
}

/** API payload → list of entries. Non-array input = [] (safe). */
export function toHistoryEntries(rows: unknown): HistoryEntry[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => toHistoryEntry(row as HistorySourceRow));
}
