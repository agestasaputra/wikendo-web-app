/**
 * utils/pagination.ts — Math paging infinity scroll S2b (limit/offset, hasMore, merge).
 *
 * APA: parsePaginationParams, hasMorePages, mergePageItems. PURE.
 * KENAPA: dipakai 2 halaman (mall list/detail) + 2 API + composable useInfiniteList.
 * Spec S2b: 10/page, max 50, tanpa ?limit = array legacy.
 * Contoh: parsePaginationParams({ limit: "10", offset: "20" }) → { limit: 10, offset: 20 }.
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

/** ?limit & ?offset (string|array|absen) → angka aman. Ngaco/negatif/nol → default/0. */
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

/** Masih ada page berikut? loaded < total. Contoh: hasMorePages(10, 40) → true. */
export function hasMorePages(loaded: number, total: number): boolean {
  return loaded < total;
}

/** Gabung page baru ke list lama, dedupe by key (overlap refetch tidak ganda). */
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
  /** false = ganti list (start/reset); true = gabung + dedupe (loadMore). */
  append: boolean;
  keyOf: (item: T) => string | number;
}

/**
 * Terapkan 1 page hasil fetch ke list. Array legacy (API tanpa ?limit) = dibungkus,
 * hasMore false, tidak crash.
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
