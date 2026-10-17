/**
 * utils/__tests__/pagination.spec.ts — TDD for S2b infinite scroll paging.
 * limit/offset math + append-dedupe + hasMore used by 2 mall pages + 2 APIs + useInfiniteList.
 */
import { describe, it, expect } from "vitest";
import {
  applyInfinitePage,
  hasMorePages,
  INFINITE_DEFAULT_LIMIT,
  INFINITE_MAX_LIMIT,
  mergePageItems,
  parsePaginationParams,
} from "../pagination";

describe("parsePaginationParams (?limit & ?offset → safe numbers)", () => {
  it("no params → default 10/0", () => {
    expect(parsePaginationParams({})).toEqual({ limit: 10, offset: 0 });
    expect(INFINITE_DEFAULT_LIMIT).toBe(10);
  });

  it("valid string → number", () => {
    expect(parsePaginationParams({ limit: "10", offset: "20" })).toEqual({
      limit: 10,
      offset: 20,
    });
  });

  it("bogus/negative/zero → default/0 (no crash, no negative)", () => {
    expect(parsePaginationParams({ limit: "abc", offset: "-5" })).toEqual({
      limit: 10,
      offset: 0,
    });
    expect(parsePaginationParams({ limit: "0", offset: "-1" })).toEqual({
      limit: 10,
      offset: 0,
    });
  });

  it("limit > max 50 → clamped (anti-abuse full dump)", () => {
    expect(parsePaginationParams({ limit: "9999" })).toEqual({
      limit: 50,
      offset: 0,
    });
    expect(INFINITE_MAX_LIMIT).toBe(50);
  });

  it("custom default used when limit is absent", () => {
    expect(parsePaginationParams({}, 5)).toEqual({ limit: 5, offset: 0 });
  });
});

describe("hasMorePages (loaded vs total)", () => {
  it("not all yet → true; equal/more → false", () => {
    expect(hasMorePages(10, 40)).toBe(true);
    expect(hasMorePages(40, 40)).toBe(false);
    expect(hasMorePages(45, 40)).toBe(false);
  });
});

describe("mergePageItems (append + dedupe by key)", () => {
  const key = (t: { slug: string }) => t.slug;

  it("page 1 + page 2 → merged in order", () => {
    const p1 = [{ slug: "a" }, { slug: "b" }];
    const p2 = [{ slug: "c" }];
    expect(mergePageItems(p1, p2, key)).toEqual([
      { slug: "a" },
      { slug: "b" },
      { slug: "c" },
    ]);
  });

  it("duplicate key (overlap refetch) → no duplicate", () => {
    const p1 = [{ slug: "a" }, { slug: "b" }];
    const p2 = [{ slug: "b" }, { slug: "c" }];
    expect(mergePageItems(p1, p2, key)).toEqual([
      { slug: "a" },
      { slug: "b" },
      { slug: "c" },
    ]);
  });
});

describe("applyInfinitePage (apply 1 page to the list)", () => {
  const key = (t: { slug: string }): string => t.slug;

  it("page object: start (append=false) replaces the list + follows server total/hasMore", () => {
    const res = applyInfinitePage(
      [{ slug: "old" }],
      { items: [{ slug: "a" }], total: 40, hasMore: true },
      { append: false, keyOf: key },
    );
    expect(res).toEqual({ items: [{ slug: "a" }], total: 40, hasMore: true });
  });

  it("page object: append=true merges + dedupes", () => {
    const res = applyInfinitePage(
      [{ slug: "a" }],
      { items: [{ slug: "a" }, { slug: "b" }], total: 2, hasMore: false },
      { append: true, keyOf: key },
    );
    expect(res.items).toEqual([{ slug: "a" }, { slug: "b" }]);
  });

  it("legacy array (API without ?limit): wrapped, hasMore false, total = list length", () => {
    const res = applyInfinitePage([], [{ slug: "x" }, { slug: "y" }], {
      append: false,
      keyOf: key,
    });
    expect(res).toEqual({
      items: [{ slug: "x" }, { slug: "y" }],
      total: 2,
      hasMore: false,
    });
  });
});
