/**
 * utils/__tests__/url.spec.ts — URL builder test.
 * buildMapsUrl is used by the server food/recommend route.
 */
import { describe, it, expect } from "vitest";
import { buildMapsUrl } from "../url";

describe("buildMapsUrl", () => {
  it("builds a proper Google Maps URL", () => {
    expect(buildMapsUrl("Kopi Kenangan", "grand-indonesia")).toBe(
      "https://www.google.com/maps/search/" +
        encodeURIComponent("Kopi Kenangan grand-indonesia"),
    );
  });
});
