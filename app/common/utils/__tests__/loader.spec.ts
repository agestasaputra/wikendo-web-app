import { describe, it, expect } from "vitest";
import { getLoaderMeta, defaultLayout } from "../loader";
import type { LoaderVariant } from "~/common/types/loader";

describe("getLoaderMeta", () => {
  it("returns mall accent #0e7490 (no LLM directory)", () => {
    expect(getLoaderMeta("mall").accent).toBe("#0e7490");
  });
  it("returns place accent #f97316", () => {
    expect(getLoaderMeta("place").accent).toBe("#f97316");
  });
  it("returns food accent #ee2c4b", () => {
    expect(getLoaderMeta("food").accent).toBe("#ee2c4b");
  });
  it("returns fallback mall for unknown variant", () => {
    expect(getLoaderMeta("unknown" as LoaderVariant).accent).toBe("#0e7490");
  });
});

describe("defaultLayout", () => {
  it("mall → mall-list (card list, not a spinner)", () => {
    expect(defaultLayout("mall")).toBe("mall-list");
  });
  it("place → result-place (deck)", () => {
    expect(defaultLayout("place")).toBe("result-place");
  });
  it("food → result-food (deck)", () => {
    expect(defaultLayout("food")).toBe("result-food");
  });
  it("unknown → mall-list (safe fallback)", () => {
    expect(defaultLayout("unknown" as LoaderVariant)).toBe("mall-list");
  });
});
