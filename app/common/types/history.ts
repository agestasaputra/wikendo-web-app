/**
 * common/types/history.ts — History entry (localStorage `wikendo_history`, E1).
 *
 * WHAT: 1 history row for a place/food quiz result. Used by HistoryStore + HistoryPage + historyRow.
 * WHY `id` is optional: entries written before the stored-result change have no id, and a deck we
 *   failed to save has none either. Those cards stay visible but are not links (never a dead link).
 */
export type HistoryKind = "place" | "food";

export interface HistoryEntry {
  kind: HistoryKind;
  /** `generations.id` — opens the stored deck for free. Absent = this card is not clickable. */
  id?: string;
  title: string;
  sub: string;
  at: number;
}
