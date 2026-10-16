/**
 * features/mall/utils/__tests__/tenantCard.spec.ts — Test nilai render kartu tenant S2c.
 * Thumb emoji+warna, badge promo hyphen, rating ★ deterministik, label halal.
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
  it("3 kategori mock S2c: kopi maroon, japanese charcoal, healthy hijau", () => {
    expect(categoryEmoji("kopi")).toBe("☕");
    expect(categoryEmoji("japanese")).toBe("🍜");
    expect(categoryEmoji("healthy")).toBe("🥗");
    expect(tenantAvatarBg("kopi")).toBe("#7C2D12");
    expect(tenantAvatarBg("japanese")).toBe("#1C1917");
    expect(tenantAvatarBg("healthy")).toBe("#15803D");
  });

  it("kategori ngaco → fallback (tidak crash)", () => {
    expect(categoryEmoji("ngaco")).toBe("🍜");
    expect(tenantAvatarBg("ngaco")).toBe("#44403C");
    expect(categoryEmoji("")).toBe("🍜");
  });
});

describe("tenantPromoBadge (badge -20% S2c, hyphen biasa)", () => {
  it("hype=true → -20% (hyphen-minus U+002D)", () => {
    expect(tenantPromoBadge(true)).toBe("-20%");
  });

  it("hype false/null → null (tanpa badge)", () => {
    expect(tenantPromoBadge(false)).toBeNull();
    expect(tenantPromoBadge(null)).toBeNull();
  });
});

describe("tenantRating (slot ★ S2c, deterministik dari nama)", () => {
  it("selalu 4.7/4.8/4.9 + stabil untuk nama sama", () => {
    const r = tenantRating("Kopi Kekinian");
    expect(["4.7", "4.8", "4.9"]).toContain(r);
    expect(tenantRating("Kopi Kekinian")).toBe(r);
  });
});

describe("tenantHalalLabel (label halal S2c)", () => {
  it("true→✅ Halal, false→⚠️ Non-halal, null→❓", () => {
    expect(tenantHalalLabel(true)).toBe("✅ Halal");
    expect(tenantHalalLabel(false)).toBe("⚠️ Non-halal");
    expect(tenantHalalLabel(null)).toBe("❓");
  });
});

describe("getTenantCardMeta (1 sumber thumb S2c)", () => {
  it("kopi → emoji ☕ + bg maroon", () => {
    expect(getTenantCardMeta("kopi")).toEqual({ emoji: "☕", bg: "#7C2D12" });
  });
});

describe("getTenantPromo + buildTenantView (nilai siap-render 1 kartu)", () => {
  it("promo eksplisit menang atas turunan hype_tiktok", () => {
    expect(getTenantPromo({ promo: "Diskon 10%", hype_tiktok: true })).toBe(
      "Diskon 10%",
    );
    expect(getTenantPromo({ hype_tiktok: true })).toBe("-20%");
    expect(getTenantPromo({ hype_tiktok: null })).toBeNull();
  });

  it("buildTenantView: kategori + lantai + halal tri-state", () => {
    const v = buildTenantView({
      name: "Kopi Kekinian",
      cat: "kopi",
      lantai: "2",
      halal: null,
    });
    expect(v.emoji).toBe("☕");
    expect(v.bg).toBe("#7C2D12");
    expect(v.floor).toBe("L2");
    expect(v.halal).toBe("❓");
    expect(v.promo).toBeNull();
  });
});
