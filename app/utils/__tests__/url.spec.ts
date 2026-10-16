/**
 * utils/__tests__/url.spec.ts — Test builder URL.
 * buildMapsUrl dipakai server makan/recommend.
 */
import { describe, it, expect } from "vitest";
import { buildMapsUrl } from "../url";

describe("buildMapsUrl", () => {
  it("bikin URL Google Maps yang bener", () => {
    expect(buildMapsUrl("Kopi Kenangan", "grand-indonesia")).toBe(
      "https://www.google.com/maps/search/" +
        encodeURIComponent("Kopi Kenangan grand-indonesia"),
    );
  });
});
