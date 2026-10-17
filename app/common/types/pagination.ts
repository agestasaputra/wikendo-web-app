/**
 * common/types/pagination.ts — CONTRACT for S2b infinity scroll paging (mall list + mall detail).
 *
 * WHAT: InfinitePage {items,total,hasMore}; InfiniteFetchPage may be a legacy array (without ?limit).
 * Used by: useInfiniteList() + GET /api/malls + GET /api/malls/:slug/tenants.
 */
export interface InfinitePage<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

export type InfiniteFetchPage<T> = InfinitePage<T> | T[];
