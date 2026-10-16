/**
 * utils/__tests__/pagination.spec.ts — TDD paging infinity scroll S2b.
 * Math limit/offset + append-dedupe + hasMore dipakai 2 halaman mall + 2 API + useInfiniteList.
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

describe("parsePaginationParams (?limit & ?offset → angka aman)", () => {
  it("tanpa param → default 10/0", () => {
    expect(parsePaginationParams({})).toEqual({ limit: 10, offset: 0 });
    expect(INFINITE_DEFAULT_LIMIT).toBe(10);
  });

  it("string valid → angka", () => {
    expect(parsePaginationParams({ limit: "10", offset: "20" })).toEqual({
      limit: 10,
      offset: 20,
    });
  });

  it("ngaco/negatif/nol → default/0 (tidak crash, tidak minus)", () => {
    expect(parsePaginationParams({ limit: "abc", offset: "-5" })).toEqual({
      limit: 10,
      offset: 0,
    });
    expect(parsePaginationParams({ limit: "0", offset: "-1" })).toEqual({
      limit: 10,
      offset: 0,
    });
  });

  it("limit > max 50 → dijepit (anti-abuse full dump)", () => {
    expect(parsePaginationParams({ limit: "9999" })).toEqual({
      limit: 50,
      offset: 0,
    });
    expect(INFINITE_MAX_LIMIT).toBe(50);
  });

  it("custom default dipakai saat limit absen", () => {
    expect(parsePaginationParams({}, 5)).toEqual({ limit: 5, offset: 0 });
  });
});

describe("hasMorePages (loaded vs total)", () => {
  it("belum semua → true; pas/lebih → false", () => {
    expect(hasMorePages(10, 40)).toBe(true);
    expect(hasMorePages(40, 40)).toBe(false);
    expect(hasMorePages(45, 40)).toBe(false);
  });
});

describe("mergePageItems (append + dedupe by key)", () => {
  const key = (t: { slug: string }) => t.slug;

  it("page-1 + page-2 → gabung urut", () => {
    const p1 = [{ slug: "a" }, { slug: "b" }];
    const p2 = [{ slug: "c" }];
    expect(mergePageItems(p1, p2, key)).toEqual([
      { slug: "a" },
      { slug: "b" },
      { slug: "c" },
    ]);
  });

  it("duplikat key (overlap refetch) → tidak ganda", () => {
    const p1 = [{ slug: "a" }, { slug: "b" }];
    const p2 = [{ slug: "b" }, { slug: "c" }];
    expect(mergePageItems(p1, p2, key)).toEqual([
      { slug: "a" },
      { slug: "b" },
      { slug: "c" },
    ]);
  });
});

describe("applyInfinitePage (terapkan 1 page ke list)", () => {
  const key = (t: { slug: string }): string => t.slug;

  it("page objek: start (append=false) mengganti list + ikut total/hasMore server", () => {
    const res = applyInfinitePage(
      [{ slug: "old" }],
      { items: [{ slug: "a" }], total: 40, hasMore: true },
      { append: false, keyOf: key },
    );
    expect(res).toEqual({ items: [{ slug: "a" }], total: 40, hasMore: true });
  });

  it("page objek: append=true menggabung + dedupe", () => {
    const res = applyInfinitePage(
      [{ slug: "a" }],
      { items: [{ slug: "a" }, { slug: "b" }], total: 2, hasMore: false },
      { append: true, keyOf: key },
    );
    expect(res.items).toEqual([{ slug: "a" }, { slug: "b" }]);
  });

  it("array legacy (API tanpa ?limit): dibungkus, hasMore false, total = panjang list", () => {
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
