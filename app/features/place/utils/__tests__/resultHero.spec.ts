import { describe, it, expect } from "vitest";
import { buildPlaceHero, buildPlaceMapsUrl } from "../resultHero";

describe("buildPlaceHero (recommendation → hero deck data)", () => {
  const rec = {
    name: "Rooftop Senayan",
    category: "rooftop",
    reason: "sunset + live music di Senayan",
    estimated_cost: "Rp 150rb",
    location_area: "Senayan, Jaksel",
    best_time: "sore",
  };

  it("filled fields → mapped + areaLabel capitalizes first word", () => {
    const h = buildPlaceHero(rec, 0);
    expect(h.name).toBe("Rooftop Senayan");
    expect(h.areaLabel).toBe("SENAYAN");
    expect(h.cost).toBe("Rp 150rb");
    expect(h.vibe).toHaveLength(24);
  });

  it('empty recommendation → placeholder "—" + JKT label (no crash)', () => {
    const h = buildPlaceHero(undefined, 0);
    expect(h.name).toBe("—");
    expect(h.area).toBe("—");
    expect(h.areaLabel).toBe("JKT");
    expect(h.category).toBe("place");
  });

  it("emoji + gradient rotate per index (modulo 5)", () => {
    expect(buildPlaceHero(rec, 0).emoji).toBe("🌇");
    expect(buildPlaceHero(rec, 5).emoji).toBe("🌇");
    expect(buildPlaceHero(rec, 1).emoji).toBe("☕");
    expect(buildPlaceHero(rec, 1).bg).toContain("linear-gradient");
  });
});

describe("buildPlaceMapsUrl", () => {
  it("encodes name + Jakarta suffix", () => {
    expect(buildPlaceMapsUrl("Kopi A")).toBe(
      "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent("Kopi A Jakarta"),
    );
  });
});
