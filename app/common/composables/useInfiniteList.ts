/**
 * common/composables/useInfiniteList.ts — Infinity scroll state S2b (1 composable, 2 pages).
 *
 * WHAT: start (page-1, SSR-friendly) + loadMore (append dedupe) + reset (change filters);
 *   state items/total/hasMore/pending/loadingMore/error.
 * WHY: mall list + mall detail follow the SAME pattern → no duplicated state per page.
 *   Paging math (merge/hasMore) in utils/pagination (pure, tested). Spec S2b: 10/page.
 * EXAMPLE: const { items, hasMore, start, loadMore } = useInfiniteList({ fetchPage }).
 */
import { ref, shallowRef, type Ref } from "vue";
import type { InfiniteFetchPage } from "../types/pagination";
import {
  applyInfinitePage,
  INFINITE_DEFAULT_LIMIT,
} from "../../utils/pagination";

export interface InfiniteListOptions<T> {
  pageSize?: number;
  keyOf?: (item: T) => string | number;
  fetchPage: (limit: number, offset: number) => Promise<InfiniteFetchPage<T>>;
}

interface ListState<T> {
  items: Ref<T[]>;
  total: Ref<number>;
  hasMore: Ref<boolean>;
  pending: Ref<boolean>;
  loadingMore: Ref<boolean>;
  error: Ref<unknown>;
}

export interface InfiniteList<T> extends ListState<T> {
  start: () => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => Promise<void>;
}

function createListState<T>(): ListState<T> {
  return {
    items: shallowRef<T[]>([]),
    total: ref(0),
    hasMore: ref(false),
    pending: ref(false),
    loadingMore: ref(false),
    error: ref<unknown>(null),
  };
}

export function useInfiniteList<T>(
  options: InfiniteListOptions<T>,
): InfiniteList<T> {
  const pageSize = options.pageSize ?? INFINITE_DEFAULT_LIMIT;
  const keyOf = options.keyOf ?? ((item: T): string => JSON.stringify(item));
  const state = createListState<T>();
  const { items, total, hasMore, pending, loadingMore, error } = state;

  async function fetchInto(offset: number, append: boolean): Promise<void> {
    error.value = null;
    try {
      const res = await options.fetchPage(pageSize, offset);
      const page = applyInfinitePage(items.value, res, { append, keyOf });
      items.value = page.items;
      total.value = page.total;
      hasMore.value = page.hasMore;
    } catch (e) {
      error.value = e;
    }
  }

  async function start(): Promise<void> {
    pending.value = true;
    await fetchInto(0, false);
    pending.value = false;
  }

  async function loadMore(): Promise<void> {
    if (!hasMore.value || pending.value || loadingMore.value) return;
    loadingMore.value = true;
    await fetchInto(items.value.length, true);
    loadingMore.value = false;
  }

  async function reset(): Promise<void> {
    items.value = [];
    total.value = 0;
    hasMore.value = false;
    await start();
  }

  return { ...state, start, loadMore, reset };
}
