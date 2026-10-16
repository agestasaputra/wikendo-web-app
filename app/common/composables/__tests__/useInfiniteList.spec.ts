/**
 * common/composables/__tests__/useInfiniteList.spec.ts — Test composable infinity scroll (fetch mock).
 * Spec S2b: 10/page, reset ganti filter, array legacy tidak crash.
 */
import { describe, it, expect, vi } from "vitest";
import { useInfiniteList } from "../useInfiniteList";

describe("useInfiniteList (composable, fetch mock)", () => {
  it("start() isi page-1 + hasMore true (40 tenant, 10/page)", async () => {
    const fetchPage = vi.fn(async (limit: number, offset: number) => ({
      items: Array.from({ length: limit }, (_, i) => ({
        slug: `m${offset + i}`,
      })),
      total: 40,
      hasMore: offset + limit < 40,
    }));
    const list = useInfiniteList({
      pageSize: 10,
      keyOf: (m: { slug: string }) => m.slug,
      fetchPage,
    });
    await list.start();
    expect(list.items.value).toHaveLength(10);
    expect(list.total.value).toBe(40);
    expect(list.hasMore.value).toBe(true);
  });

  it("loadMore() append 10 → 20/40; respons array legacy → hasMore false", async () => {
    const fetchPage = vi.fn(async (limit: number, offset: number) => ({
      items: Array.from({ length: 10 }, (_, i) => ({ slug: `m${offset + i}` })),
      total: 40,
      hasMore: offset + limit < 40,
    }));
    const list = useInfiniteList({
      pageSize: 10,
      keyOf: (m: { slug: string }) => m.slug,
      fetchPage,
    });
    await list.start();
    await list.loadMore();
    expect(list.items.value).toHaveLength(20);
    // Array legacy (API tanpa ?limit) → dibungkus, hasMore false, tidak crash.
    const legacy = useInfiniteList({
      fetchPage: async () => [{ slug: "x" }] as { slug: string }[],
    });
    await legacy.start();
    expect(legacy.items.value).toHaveLength(1);
    expect(legacy.hasMore.value).toBe(false);
  });

  it("reset() buang page lama + muat ulang dari 0 (ganti filter)", async () => {
    let mode = "a";
    const fetchPage = vi.fn(async () => ({
      items: [{ slug: mode }],
      total: 1,
      hasMore: false,
    }));
    const list = useInfiniteList({ fetchPage });
    await list.start();
    expect(list.items.value).toEqual([{ slug: "a" }]);
    mode = "b";
    await list.reset();
    expect(list.items.value).toEqual([{ slug: "b" }]);
  });
});
