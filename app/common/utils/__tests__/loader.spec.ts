/**
 * common/utils/__tests__/loader.spec.ts — Test for the API fetching spinner helper.
 * 1 helper used by AppLoader on 3 pages → consistent color + message per variant.
 */
import { describe, it, expect } from "vitest";
import { getLoaderMeta } from "../loader";

describe("getLoaderMeta (API fetching spinner)", () => {
  it("place = orange accent #f97316", () => {
    const m = getLoaderMeta("place");
    expect(m.accent).toBe("#f97316");
    expect(m.title).toContain("tempat");
    expect(m.hint.length).toBeGreaterThan(0);
  });

  it("food = red accent #ee2c4b", () => {
    const m = getLoaderMeta("food");
    expect(m.accent).toBe("#ee2c4b");
    expect(m.title).toContain("tenant");
  });

  it("mall = teal accent #0e7490 (directory, no LLM)", () => {
    const m = getLoaderMeta("mall");
    expect(m.accent).toBe("#0e7490");
    expect(m.title.length).toBeGreaterThan(0);
  });

  it("bogus variant = mall fallback (safe, no crash)", () => {
    const m = getLoaderMeta("ngaco" as never);
    expect(m.accent).toBe("#0e7490");
  });
});
