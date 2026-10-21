/**
 * __tests__/clientEvent.spec.ts — RED→GREEN for the public analytics body sanitizer.
 *
 * WHY: /api/analytics/track is open to the internet. These cases are the contract that stops
 * an arbitrary JSON blob from landing in `analytics_events` (table bloat + dashboard lies).
 */
import { describe, it, expect } from "vitest";
import {
  MAX_PROPS,
  MAX_VALUE_LEN,
  sanitizeEventName,
  sanitizeProps,
} from "../clientEvent";

describe("sanitizeEventName", () => {
  it("non-string → empty string", () => {
    expect(sanitizeEventName(undefined)).toBe("");
    expect(sanitizeEventName(42)).toBe("");
    expect(sanitizeEventName({ a: 1 })).toBe("");
  });

  it("trims and caps at 64 chars", () => {
    expect(sanitizeEventName("  promo_click  ")).toBe("promo_click");
    expect(sanitizeEventName("e".repeat(200))).toHaveLength(64);
  });
});

describe("sanitizeProps", () => {
  it("keeps scalar values, trims strings", () => {
    expect(
      sanitizeProps({ mall_slug: " grand-indonesia ", tenant: "% Arabica" }),
    ).toEqual({ mall_slug: "grand-indonesia", tenant: "% Arabica" });
  });

  it("drops arrays, objects, NaN, Infinity and empty strings", () => {
    expect(
      sanitizeProps({
        tags: ["a"],
        nested: { a: 1 },
        nan: Number.NaN,
        inf: Number.POSITIVE_INFINITY,
        blank: "   ",
        ok: true,
      }),
    ).toEqual({ ok: true });
  });

  it("drops unsafe keys (spaces, $, dots, >32 chars) but keeps snake_case", () => {
    expect(
      sanitizeProps({
        "bad key": 1,
        "a.b": 2,
        $x: 3,
        ["k".repeat(40)]: 4,
        good_key_1: 5,
      }),
    ).toEqual({ good_key_1: 5 });
  });

  it(`caps at ${MAX_PROPS} props and ${MAX_VALUE_LEN} chars per value`, () => {
    const many = Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [`k${i}`, "v"]),
    );
    expect(Object.keys(sanitizeProps(many))).toHaveLength(MAX_PROPS);
    expect(sanitizeProps({ long: "x".repeat(500) }).long).toHaveLength(
      MAX_VALUE_LEN,
    );
  });

  it("non-object input → {}", () => {
    expect(sanitizeProps(null)).toEqual({});
    expect(sanitizeProps("nope")).toEqual({});
    expect(sanitizeProps([1, 2])).toEqual({});
  });
});
