/**
 * common/utils/resultUrl.ts — the address of ONE stored result (never the quiz answers).
 *
 * WHAT: RESULT_PATHS + isResultId() + buildResultUrl() + parseResultId().
 * WHY: the result URL used to BE the quiz state (`?mood=santai&budget=hemat`). Every refresh
 *   re-ran the POST → burned quota and hit the login wall, and `share()` sent the recipient a
 *   link that regenerated a DIFFERENT result. A result now has an identity: the `generations.id`
 *   UUID. The URL carries that id only, so refresh / back / bookmark / share are free GETs.
 * EXAMPLE: buildResultUrl("place", "0f8fad5b-…") → "/result-place?id=0f8fad5b-…"
 *   parseResultId({ mood: "santai" }) → ""  (legacy answer-only link, still supported)
 */
import type { HistoryKind } from "../types/history";

/** Result route per quiz kind — the single source of truth for both pages and history cards. */
export const RESULT_PATHS: Record<HistoryKind, string> = {
  place: "/result-place",
  food: "/result-food",
};

/** Canonical UUID shape (any version, case-insensitive). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True only for a real UUID string — answers, arrays, numbers and payloads are rejected. */
export function isResultId(value: unknown): boolean {
  return typeof value === "string" && UUID_RE.test(value);
}

/** 1 stored result → 1 short public URL (`/result-place?id=<uuid>`). */
export function buildResultUrl(kind: HistoryKind, id: string): string {
  return `${RESULT_PATHS[kind]}?id=${encodeURIComponent(id)}`;
}

/** Route query → result id, or "" when this is a legacy answer-only link (backward compatible). */
export function parseResultId(
  query: Record<string, unknown> | undefined,
): string {
  const raw = query?.id;
  return typeof raw === "string" && isResultId(raw) ? raw : "";
}
