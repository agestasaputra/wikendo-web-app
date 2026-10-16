/**
 * common/utils/__tests__/loader.spec.ts — Test helper spinner fetching API.
 * 1 helper dipakai AppLoader di 3 halaman → warna + pesan konsisten per variant.
 */
import { describe, it, expect } from "vitest";
import { getLoaderMeta } from "../loader";

describe("getLoaderMeta (spinner fetching API)", () => {
  it("tempat = aksen orange #f97316", () => {
    const m = getLoaderMeta("tempat");
    expect(m.accent).toBe("#f97316");
    expect(m.title).toContain("tempat");
    expect(m.hint.length).toBeGreaterThan(0);
  });

  it("makan = aksen merah #ee2c4b", () => {
    const m = getLoaderMeta("makan");
    expect(m.accent).toBe("#ee2c4b");
    expect(m.title).toContain("tenant");
  });

  it("mall = aksen teal #0e7490 (direktori, tanpa LLM)", () => {
    const m = getLoaderMeta("mall");
    expect(m.accent).toBe("#0e7490");
    expect(m.title.length).toBeGreaterThan(0);
  });

  it("variant ngaco = fallback mall (aman, tidak crash)", () => {
    const m = getLoaderMeta("ngaco" as never);
    expect(m.accent).toBe("#0e7490");
  });
});
