/**
 * utils/pagination.ts — S2b infinity scroll paging math (limit/offset, hasMore, merge).
 *
 * WHAT: parsePaginationParams, hasMorePages, mergePageItems. PURE.
 * WHY: used by 2 pages (mall list/detail) + 2 APIs + the useInfiniteList composable.
 * Spec S2b: 10/page, max 50, without ?limit = legacy array.
 * EXAMPLE: parsePaginationParams({ limit: "10", offset: "20" }) → { limit: 10, offset: 20 }.
 */
import type { InfiniteFetchPage } from "../common/types/pagination";

/** Default 10/page (S2b) + max 50 (anti-abuse full dump). */
export const INFINITE_DEFAULT_LIMIT = 10;
export const INFINITE_MAX_LIMIT = 50;

interface PaginationParams {
  limit: number;
  offset: number;
}

function firstValue(v: unknown): unknown {
  return Array.isArray(v) ? v[0] : v;
}

/** ?limit & ?offset (string|array|missing) → safe numbers. Garbage/negative/zero → default/0. */
export function parsePaginationParams(
  query: Record<string, unknown>,
  defaultLimit: number = INFINITE_DEFAULT_LIMIT,
): PaginationParams {
  let limit = parseInt(String(firstValue(query.limit) ?? ""), 10);
  if (Number.isNaN(limit) || limit <= 0) limit = defaultLimit;
  let offset = parseInt(String(firstValue(query.offset) ?? ""), 10);
  if (Number.isNaN(offset) || offset < 0) offset = 0;
  return { limit: Math.min(limit, INFINITE_MAX_LIMIT), offset };
}

/** Is there a next page? loaded < total. EXAMPLE: hasMorePages(10, 40) → true. */
export function hasMorePages(loaded: number, total: number): boolean {
  return loaded < total;
}

/** Merge a new page into the old list, dedupe by key (overlapping refetch is not duplicated). */
export function mergePageItems<T>(
  prev: T[],
  next: T[],
  keyOf: (item: T) => string | number,
): T[] {
  const seen = new Set<string | number>(prev.map(keyOf));
  const out = [...prev];
  for (const item of next) {
    const k = keyOf(item);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

interface AppliedPage<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

interface ApplyPageOptions<T> {
  /** false = replace the list (start/reset); true = merge + dedupe (loadMore). */
  append: boolean;
  keyOf: (item: T) => string | number;
}

/**
 * Apply 1 fetched page to the list. Legacy array (API without ?limit) = wrapped,
 * hasMore false, doesn't crash.
 */
export function applyInfinitePage<T>(
  prev: T[],
  res: InfiniteFetchPage<T>,
  options: ApplyPageOptions<T>,
): AppliedPage<T> {
  const incoming = Array.isArray(res) ? res : res.items;
  const items = options.append
    ? mergePageItems(prev, incoming, options.keyOf)
    : [...incoming];
  if (Array.isArray(res)) {
    return { items, total: items.length, hasMore: false };
  }
  return { items, total: res.total, hasMore: res.hasMore };
}
