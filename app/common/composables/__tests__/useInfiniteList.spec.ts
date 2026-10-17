/**
 * common/composables/__tests__/useInfiniteList.spec.ts — Infinite scroll composable test (mocked fetch).
 * Spec S2b: 10/page, reset on filter change, legacy array doesn't crash.
 */
import { describe, it, expect, vi } from "vitest";
import { useInfiniteList } from "../useInfiniteList";

describe("useInfiniteList (composable, mocked fetch)", () => {
  it("start() fills page 1 + hasMore true (40 tenants, 10/page)", async () => {
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

  it("loadMore() appends 10 → 20/40; legacy array response → hasMore false", async () => {
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
    // Legacy array (API without ?limit) → wrapped, hasMore false, no crash.
    const legacy = useInfiniteList({
      fetchPage: async () => [{ slug: "x" }] as { slug: string }[],
    });
    await legacy.start();
    expect(legacy.items.value).toHaveLength(1);
    expect(legacy.hasMore.value).toBe(false);
  });

  it("reset() drops old pages + reloads from 0 (filter change)", async () => {
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
