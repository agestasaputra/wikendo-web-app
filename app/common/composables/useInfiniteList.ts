/**
 * common/composables/useInfiniteList.ts — Infinity scroll state S2b (1 composable, 2 pages).
 */
import { reactive, ref, toRefs, type Ref } from "vue";
import type { InfiniteFetchPage } from "../types/pagination";
import {
  applyInfinitePage,
  INFINITE_DEFAULT_LIMIT,
} from "../../utils/pagination";

export interface InfiniteListOptions<T> {
  pageSize?: number;
  keyOf?: (item: T) => string | number;
  fetchPage: (limit: number, offset: number) => Promise<InfiniteFetchPage<T>>;
  key?: string;
}

interface ListStateData<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  pending: boolean;
  loadingMore: boolean;
  error: unknown;
  hydrated: boolean;
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

function createDefaultState<T>(): ListStateData<T> {
  return {
    items: [],
    total: 0,
    hasMore: false,
    pending: false,
    loadingMore: false,
    error: null,
    hydrated: false,
  };
}

function createStore<T>(key: string): Ref<ListStateData<T>> {
  const hasNuxt = typeof useState === "function";
  let store: Ref<ListStateData<T>>;
  if (hasNuxt) {
    store = useState<ListStateData<T>>(key, () => createDefaultState<T>());
  } else {
    store = ref(createDefaultState<T>()) as Ref<ListStateData<T>>;
    store.value = reactive(store.value) as ListStateData<T>;
  }
  return store;
}

interface ActionContext<T> {
  items: Ref<T[]>;
  total: Ref<number>;
  hasMore: Ref<boolean>;
  pending: Ref<boolean>;
  loadingMore: Ref<boolean>;
  error: Ref<unknown>;
  hydrated: Ref<boolean>;
  pageSize: number;
  keyOf: (item: T) => string | number;
  fetchPage: (limit: number, offset: number) => Promise<InfiniteFetchPage<T>>;
}

async function fetchInto<T>(
  ctx: ActionContext<T>,
  offset: number,
  append: boolean,
): Promise<void> {
  const { items, total, hasMore, error, pageSize, keyOf, fetchPage } = ctx;
  error.value = null;
  try {
    const res = await fetchPage(pageSize, offset);
    const page = applyInfinitePage(items.value, res, { append, keyOf });
    items.value = page.items;
    total.value = page.total;
    hasMore.value = page.hasMore;
  } catch (e) {
    error.value = e;
  }
}

function makeActions<T>(ctx: ActionContext<T>): {
  start: () => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => Promise<void>;
} {
  const { items, total, hasMore, pending, loadingMore, hydrated } = ctx;
  let clientStarted = false;

  async function start(): Promise<void> {
    if (import.meta.client && !clientStarted && hydrated.value) {
      clientStarted = true;
      pending.value = false;
      return;
    }
    clientStarted = true;
    pending.value = true;
    await fetchInto(ctx, 0, false);
    pending.value = false;
    if (import.meta.server) hydrated.value = true;
  }

  async function loadMore(): Promise<void> {
    if (!hasMore.value || pending.value || loadingMore.value) return;
    loadingMore.value = true;
    await fetchInto(ctx, items.value.length, true);
    loadingMore.value = false;
  }

  async function reset(): Promise<void> {
    items.value = [];
    total.value = 0;
    hasMore.value = false;
    hydrated.value = false;
    clientStarted = false;
    await start();
  }

  return { start, loadMore, reset };
}

export function useInfiniteList<T>(
  options: InfiniteListOptions<T>,
): InfiniteList<T> {
  const pageSize = options.pageSize ?? INFINITE_DEFAULT_LIMIT;
  const keyOf = options.keyOf ?? ((item: T): string => JSON.stringify(item));
  const store = createStore<T>(options.key ?? "infinite-list");
  const refs = toRefs(store.value) as {
    items: Ref<T[]>;
    total: Ref<number>;
    hasMore: Ref<boolean>;
    pending: Ref<boolean>;
    loadingMore: Ref<boolean>;
    error: Ref<unknown>;
    hydrated: Ref<boolean>;
  };
  const { items, total, hasMore, pending, loadingMore, error } = refs;
  const hydrated = refs.hydrated;

  const { start, loadMore, reset } = makeActions<T>({
    items,
    total,
    hasMore,
    pending,
    loadingMore,
    error,
    hydrated,
    pageSize,
    keyOf,
    fetchPage: options.fetchPage,
  });

  return {
    items,
    total,
    hasMore,
    pending,
    loadingMore,
    error,
    start,
    loadMore,
    reset,
  };
}
