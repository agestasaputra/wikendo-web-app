import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * gtagShim.spec.ts — the window.gtag defined by plugins/gtag.client.ts must feed gtag.js.
 *
 * WHAT: runs the plugin with a fake GA ID and checks what gtag() pushes onto dataLayer.
 * WHY: gtag.js only executes dataLayer entries that are `arguments` objects; a plain array
 *   is treated as a GTM data-layer variable and ignored. The old shim pushed arrays, so the
 *   script loaded and dataLayer looked right, yet NO hit ever reached GA ("collect" request).
 * EXAMPLE: window.gtag("event", "page_view", {}) → dataLayer.at(-1) is [object Arguments].
 */
beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("defineNuxtPlugin", (fn: () => void) => fn);
  vi.stubGlobal("useRuntimeConfig", () => ({
    public: { gaId: "G-TEST000000" },
  }));
  delete window.dataLayer;
  delete window.gtag;
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.head
    .querySelectorAll("script[src*=gtag]")
    .forEach((s) => s.remove());
});

describe("plugins/gtag.client.ts — gtag shim", () => {
  it("pushes `arguments` objects (what gtag.js executes), not arrays", async () => {
    const plugin = (await import("~/plugins/gtag.client"))
      .default as () => void;
    plugin();

    window.gtag?.("event", "page_view", { page_title: "x" });

    const last = window.dataLayer?.at(-1);
    expect(Object.prototype.toString.call(last)).toBe("[object Arguments]");
    expect(Array.from(last as ArrayLike<unknown>)).toEqual([
      "event",
      "page_view",
      { page_title: "x" },
    ]);
  });

  it("does nothing when NUXT_PUBLIC_GA_ID is empty", async () => {
    vi.stubGlobal("useRuntimeConfig", () => ({ public: { gaId: "" } }));
    const plugin = (await import("~/plugins/gtag.client"))
      .default as () => void;
    plugin();

    expect(window.gtag).toBeUndefined();
  });
});
