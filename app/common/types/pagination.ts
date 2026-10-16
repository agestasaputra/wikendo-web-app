/**
 * common/types/pagination.ts — KONTRAK paging S2b infinity scroll (list mall + detail mall).
 *
 * APA: InfinitePage {items,total,hasMore}; InfiniteFetchPage boleh array legacy (tanpa ?limit).
 * Dipakai: useInfiniteList() + GET /api/malls + GET /api/malls/:slug/tenants.
 */
export interface InfinitePage<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

export type InfiniteFetchPage<T> = InfinitePage<T> | T[];
