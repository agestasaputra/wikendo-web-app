/**
 * server/utils/__tests__/legacyRoutes.spec.ts — RED test for the URL rename (place clarity).
 *
 * WHAT: locks the two permanent redirects AND the "don't touch the sibling" rule.
 * WHY: the legacy /result link carries the quiz answers in the query string. If a future
 *   refactor drops `?…` or prefix-matches `/result` (which would also swallow
 *   `/result-food` and `/result-place`), every bookmarked result link silently breaks —
 *   no error, just an empty deck. This spec makes that regression impossible to miss.
 * EXAMPLE: legacyRedirectTarget("/result", "?mood=fun") → "/result-place?mood=fun"
 */
import { describe, it, expect } from "vitest";
import { legacyRedirectTarget } from "../legacyRoutes";

describe("legacyRedirectTarget (permanent 301 for the renamed quiz URLs)", () => {
  it("/quiz → /place", () => {
    expect(legacyRedirectTarget("/quiz")).toBe("/place");
  });

  it("/result → /result-place", () => {
    expect(legacyRedirectTarget("/result")).toBe("/result-place");
  });

  it("keeps the whole query string (answers live there — dropping it renders an empty deck)", () => {
    expect(legacyRedirectTarget("/result", "?mood=fun&companion=group")).toBe(
      "/result-place?mood=fun&companion=group",
    );
    expect(legacyRedirectTarget("/quiz", "?ref=home")).toBe("/place?ref=home");
  });

  it("never touches the current routes (exact match, no prefix bleed)", () => {
    expect(legacyRedirectTarget("/place")).toBeNull();
    expect(legacyRedirectTarget("/result-place")).toBeNull();
    expect(legacyRedirectTarget("/result-food")).toBeNull();
    expect(legacyRedirectTarget("/food")).toBeNull();
    expect(legacyRedirectTarget("/")).toBeNull();
  });

  it("is not fooled by lookalikes", () => {
    expect(legacyRedirectTarget("/quiz-extra")).toBeNull();
    expect(legacyRedirectTarget("/results")).toBeNull();
    expect(legacyRedirectTarget("/result/")).toBeNull();
  });
});
