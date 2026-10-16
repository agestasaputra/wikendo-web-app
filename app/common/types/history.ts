/**
 * common/types/history.ts — Entry riwayat (localStorage `wikendo_history`, E1).
 *
 * APA: 1 baris riwayat hasil quiz tempat/makan. Dipakai HistoryStore + HistoryPage.
 */
export type HistoryKind = "tempat" | "makan";

export interface HistoryEntry {
  kind: HistoryKind;
  title: string;
  sub: string;
  at: number;
}
