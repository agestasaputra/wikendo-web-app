import { describe, it, expect } from "vitest";
import { buildTempatHero, buildTempatMapsUrl } from "../resultHero";

describe("buildTempatHero (rekomendasi → data hero deck)", () => {
  const rec = {
    name: "Rooftop Senayan",
    category: "rooftop",
    reason: "sunset + live music di Senayan",
    estimated_cost: "Rp 150rb",
    location_area: "Senayan, Jaksel",
    best_time: "sore",
  };

  it("field terisi → dipetakan + areaLabel kapital kata pertama", () => {
    const h = buildTempatHero(rec, 0);
    expect(h.name).toBe("Rooftop Senayan");
    expect(h.areaLabel).toBe("SENAYAN");
    expect(h.cost).toBe("Rp 150rb");
    expect(h.vibe).toHaveLength(24);
  });

  it('rekomendasi kosong → placeholder "—" + label JKT (tidak crash)', () => {
    const h = buildTempatHero(undefined, 0);
    expect(h.name).toBe("—");
    expect(h.area).toBe("—");
    expect(h.areaLabel).toBe("JKT");
    expect(h.category).toBe("tempat");
  });

  it("emoji + gradasi berputar per index (modulo 5)", () => {
    expect(buildTempatHero(rec, 0).emoji).toBe("🌇");
    expect(buildTempatHero(rec, 5).emoji).toBe("🌇");
    expect(buildTempatHero(rec, 1).emoji).toBe("☕");
    expect(buildTempatHero(rec, 1).bg).toContain("linear-gradient");
  });
});

describe("buildTempatMapsUrl", () => {
  it("encode nama + suffix Jakarta", () => {
    expect(buildTempatMapsUrl("Kopi A")).toBe(
      "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent("Kopi A Jakarta"),
    );
  });
});
