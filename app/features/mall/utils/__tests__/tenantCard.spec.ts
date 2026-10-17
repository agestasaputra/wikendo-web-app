/**
 * features/mall/utils/__tests__/tenantCard.spec.ts — Tenant card render value test S2c.
 * Emoji+color thumb, hyphen promo badge, deterministic ★ rating, halal label.
 */
import { describe, it, expect } from "vitest";
import {
  buildTenantView,
  categoryEmoji,
  getTenantCardMeta,
  getTenantPromo,
  tenantAvatarBg,
  tenantHalalLabel,
  tenantPromoBadge,
  tenantRating,
} from "../tenantCard";

describe("categoryEmoji + tenantAvatarBg (thumb S2c)", () => {
  it("3 S2c mock categories: coffee maroon, japanese charcoal, healthy green", () => {
    expect(categoryEmoji("coffee")).toBe("☕");
    expect(categoryEmoji("japanese")).toBe("🍜");
    expect(categoryEmoji("healthy")).toBe("🥗");
    expect(tenantAvatarBg("coffee")).toBe("#7C2D12");
    expect(tenantAvatarBg("japanese")).toBe("#1C1917");
    expect(tenantAvatarBg("healthy")).toBe("#15803D");
  });

  it("bogus category → fallback (no crash)", () => {
    expect(categoryEmoji("ngaco")).toBe("🍜");
    expect(tenantAvatarBg("ngaco")).toBe("#44403C");
    expect(categoryEmoji("")).toBe("🍜");
  });
});

describe("tenantPromoBadge (-20% badge S2c, regular hyphen)", () => {
  it("hype=true → -20% (hyphen-minus U+002D)", () => {
    expect(tenantPromoBadge(true)).toBe("-20%");
  });

  it("hype false/null → null (no badge)", () => {
    expect(tenantPromoBadge(false)).toBeNull();
    expect(tenantPromoBadge(null)).toBeNull();
  });
});

describe("tenantRating (★ slot S2c, deterministic from name)", () => {
  it("always 4.7/4.8/4.9 + stable for the same name", () => {
    const r = tenantRating("Kopi Kekinian");
    expect(["4.7", "4.8", "4.9"]).toContain(r);
    expect(tenantRating("Kopi Kekinian")).toBe(r);
  });
});

describe("tenantHalalLabel (halal label S2c)", () => {
  it("true→✅ Halal, false→⚠️ Non-halal, null→❓", () => {
    expect(tenantHalalLabel(true)).toBe("✅ Halal");
    expect(tenantHalalLabel(false)).toBe("⚠️ Non-halal");
    expect(tenantHalalLabel(null)).toBe("❓");
  });
});

describe("getTenantCardMeta (single thumb source S2c)", () => {
  it("coffee → emoji ☕ + maroon bg", () => {
    expect(getTenantCardMeta("coffee")).toEqual({ emoji: "☕", bg: "#7C2D12" });
  });
});

describe("getTenantPromo + buildTenantView (ready-to-render values for 1 card)", () => {
  it("explicit promo wins over derived hype_tiktok", () => {
    expect(getTenantPromo({ promo: "Diskon 10%", hype_tiktok: true })).toBe(
      "Diskon 10%",
    );
    expect(getTenantPromo({ hype_tiktok: true })).toBe("-20%");
    expect(getTenantPromo({ hype_tiktok: null })).toBeNull();
  });

  it("buildTenantView: category + floor + halal tri-state", () => {
    const v = buildTenantView({
      name: "Kopi Kekinian",
      cat: "coffee",
      floor: "2",
      halal: null,
    });
    expect(v.emoji).toBe("☕");
    expect(v.bg).toBe("#7C2D12");
    expect(v.floor).toBe("L2");
    expect(v.halal).toBe("❓");
    expect(v.promo).toBeNull();
  });
});
