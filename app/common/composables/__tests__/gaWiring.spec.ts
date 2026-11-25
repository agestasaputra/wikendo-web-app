import { describe, expect, it } from "vitest";
import { GA_EVENTS } from "~/common/constants/analytics";
import { readSource } from "~/test/utils";

/**
 * gaWiring.spec.ts — locks WHERE GA4 events are emitted (file-assert, pages are not mounted yet).
 *
 * WHAT: page_view on every route (manual, no auto page_view) + quiz_complete on a FRESH result.
 * WHY: the journey funnel (page_view → quiz_complete) only works if page_view is not doubled
 *   by gtag's own config and quiz_complete is not fired when a saved deck is re-opened.
 * EXAMPLE: /place → /result-place → page_view ×2 + quiz_complete{type:"place"} ×1.
 */
describe("GA4 wiring — page views", () => {
  it("gtag config turns the automatic page_view off (we send our own per route)", () => {
    expect(readSource("plugins/gtag.client.ts")).toMatch(
      /send_page_view:\s*false/,
    );
  });

  it("one client plugin sends page_view after every rendered page", () => {
    const SRC = readSource("plugins/gtagPageView.client.ts");
    expect(SRC).toContain("page:finish");
    expect(SRC).toContain("trackGaPageView");
  });
});

describe("GA4 wiring — quiz_complete", () => {
  it("event name is stable", () => {
    expect(GA_EVENTS.quizComplete).toBe("quiz_complete");
  });

  it.each([
    ["place", "features/place/PlaceResultPage.vue"],
    ["food", "features/food/FoodResultPage.vue"],
  ])(
    "%s result page reports completion only for a fresh deck",
    (type, file) => {
      const SRC = readSource(file);
      expect(SRC).toContain("trackGaEvent(GA_EVENTS.quizComplete");
      expect(SRC).toContain(`type: "${type}"`);
      expect(SRC).toMatch(/if \(isStored\.value\) return;/);
    },
  );
});
