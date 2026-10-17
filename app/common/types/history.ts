/**
 * common/types/history.ts — History entry (localStorage `wikendo_history`, E1).
 *
 * WHAT: 1 history row for a place/food quiz result. Used by HistoryStore + HistoryPage.
 */
export type HistoryKind = "place" | "food";

export interface HistoryEntry {
  kind: HistoryKind;
  title: string;
  sub: string;
  at: number;
}
