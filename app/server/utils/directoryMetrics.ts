/**
 * server/utils/directoryMetrics.ts — Pure + best-effort writer for the directory funnel.
 *
 * WHAT: buildDirectoryMetric(query, resultCount) → 1 analytics row OR null (no-op browse).
 *   recordDirectoryMetric(db, metric, ctx) → inserts the row, never throws, attaches
 *   mall_slug/session_id from the HTTP request.
 * WHY pure builder first: it is the only part the unit test can reach (no DB, no H3).
 * WHY server-side and not the browser: adblockers strip client events; the row is the
 *   only proof that the new default sort/search/filter actually changes behaviour.
 * WHY 1 row per request (not 1 per filter): a search+filter combo is one user intent.
 * WHY null for plain browse: logging every 60s-cached page load would drown the signal.
 * EXAMPLE: buildDirectoryMetric({ search: "kopi", halal: "true" }, 4) →
 *   { event_type: "directory_search", metadata: { search: "kopi", filters: ["halal"], result_count: 4 } }
 */
import { ANALYTICS_EVENTS } from "../../common/constants/analytics";

/** Query params we treat as a "filter" — keep in sync with buildDirectoryEqFilters keys. */
const FILTER_KEYS = ["halal", "budget", "kids", "mission"] as const;

export interface DirectoryMetric {
  event_type: string;
  metadata: {
    search: string | null;
    filters: string[];
    result_count: number;
  };
}

export interface MetricContext {
  mallSlug: string;
  sessionId: string;
}

/** A filter counts only when it is present and not explicitly `false`. */
function isFilterOn(value: unknown): boolean {
  if (value === true) return true;
  return typeof value === "string" && value !== "" && value !== "false";
}

/** `?search=a&search=b` is not a real query — ignore anything that is not a single string. */
function readSearch(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  return raw.trim().slice(0, 80) || null;
}

/** Row count → non-negative integer (NaN/negative become 0 so the dashboard never lies). */
function safeCount(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : 0;
}

/**
 * Build the row. Returns null when the request carried neither search nor a filter —
 * a plain browse is not a signal worth storing.
 */
export function buildDirectoryMetric(
  query: Record<string, unknown>,
  resultCount: number,
): DirectoryMetric | null {
  if (Array.isArray(query.search)) return null;
  const search = readSearch(query.search);
  const filters = FILTER_KEYS.filter((key) => isFilterOn(query[key]));
  if (!search && filters.length === 0) return null;

  return {
    event_type: search
      ? ANALYTICS_EVENTS.directorySearch
      : ANALYTICS_EVENTS.directoryFilter,
    metadata: { search, filters, result_count: safeCount(resultCount) },
  };
}

/** Best-effort insert. Never throws — analytics must never break the directory. */
export async function recordDirectoryMetric(
  // `unknown` + a narrow cast: Supabase's generic insert signature is not assignable to any
  // small structural type (parameter variance), and this util only needs one method.
  db: unknown,
  metric: DirectoryMetric | null,
  ctx: MetricContext,
): Promise<void> {
  if (!metric) return;
  const client = db as {
    from: (table: string) => {
      insert: (row: Record<string, unknown>) => Promise<unknown>;
    };
  };
  try {
    await client.from("analytics_events").insert({
      event_type: metric.event_type,
      session_id: ctx.sessionId,
      metadata: { ...metric.metadata, mall_slug: ctx.mallSlug },
    });
  } catch {
    // best-effort: a metrics outage must not surface to the visitor
  }
}
