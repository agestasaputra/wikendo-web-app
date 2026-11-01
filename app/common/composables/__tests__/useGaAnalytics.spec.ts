import { afterEach, describe, expect, it, vi } from "vitest";
import {
  trackGaEvent,
  trackGaPageView,
} from "~/common/composables/useGaAnalytics";

/**
 * useGaAnalytics.spec.ts — contract for the browser → GA4 event sender.
 *
 * WHAT: locks that trackGaEvent forwards to window.gtag and can never break the caller.
 * WHY: GA is optional (no NUXT_PUBLIC_GA_ID = plugin never defines gtag) and blocked by
 *   adblockers, so a missing or throwing gtag must be a silent no-op, not a UI error.
 * EXAMPLE: trackGaEvent("promo_click", { mall_slug: "aeon-bsd" }) → gtag("event", "promo_click", {...}).
 */
afterEach(() => {
  delete window.gtag;
});

describe("common/composables/useGaAnalytics.ts — trackGaEvent", () => {
  it("forwards name and params to window.gtag as an event", () => {
    const gtag = vi.fn();
    window.gtag = gtag;

    trackGaEvent("promo_click", { mall_slug: "aeon-bsd", surface: "strip" });

    expect(gtag).toHaveBeenCalledWith("event", "promo_click", {
      mall_slug: "aeon-bsd",
      surface: "strip",
    });
  });

  it("defaults params to an empty object", () => {
    const gtag = vi.fn();
    window.gtag = gtag;

    trackGaEvent("quiz_start");

    expect(gtag).toHaveBeenCalledWith("event", "quiz_start", {});
  });

  it("is a silent no-op when GA is not loaded (no gtag)", () => {
    expect(() => trackGaEvent("promo_click")).not.toThrow();
  });

  it("swallows a throwing gtag (telemetry must never break a tap)", () => {
    window.gtag = vi.fn(() => {
      throw new Error("blocked");
    });

    expect(() => trackGaEvent("promo_click")).not.toThrow();
  });
});

describe("common/composables/useGaAnalytics.ts — trackGaPageView", () => {
  it("sends a page_view with origin+path as page_location and the title", () => {
    const gtag = vi.fn();
    window.gtag = gtag;

    trackGaPageView("/mall/aeon-bsd", "Aeon BSD");

    expect(gtag).toHaveBeenCalledWith("event", "page_view", {
      page_location: `${window.location.origin}/mall/aeon-bsd`,
      page_title: "Aeon BSD",
    });
  });

  it("never leaks a query string or hash (OAuth callbacks carry tokens there)", () => {
    const gtag = vi.fn();
    window.gtag = gtag;

    trackGaPageView("/login", "Masuk");

    const params = gtag.mock.calls[0]?.[2] as { page_location: string };
    expect(params.page_location).not.toMatch(/[?#]/);
  });

  it("is a silent no-op without gtag", () => {
    expect(() => trackGaPageView("/", "Home")).not.toThrow();
  });
});
