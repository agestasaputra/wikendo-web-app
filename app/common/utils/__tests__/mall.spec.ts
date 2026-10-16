/**
 * common/utils/__tests__/mall.spec.ts — Test helper nama mall.
 * Mapping slug→nama dipakai 3 tempat → 1 helper; mall ke-6 cukup edit constants.
 */
import { describe, it, expect } from "vitest";
import { getMallName, getMallShortLabel } from "../mall";

describe("getMallName (slug → nama lengkap)", () => {
  it("5 slug valid → nama lengkap", () => {
    expect(getMallName("grand-indonesia")).toBe("Grand Indonesia");
    expect(getMallName("central-park")).toBe("Central Park");
    expect(getMallName("kota-kasablanka")).toBe("Kota Kasablanka");
    expect(getMallName("pondok-indah-mall")).toBe("Pondok Indah Mall");
    expect(getMallName("aeon-bsd")).toBe("Aeon BSD");
  });

  it("slug ngaco → fallback slug as-is (tidak crash)", () => {
    expect(getMallName("mall-ngaco")).toBe("mall-ngaco");
  });
});

describe("getMallShortLabel (slug → label chip/pendek)", () => {
  it("nama panjang disingkat (GI, CP, Kokas, PIM, Aeon)", () => {
    expect(getMallShortLabel("grand-indonesia")).toBe("GI");
    expect(getMallShortLabel("central-park")).toBe("CP");
    expect(getMallShortLabel("kota-kasablanka")).toBe("Kokas");
    expect(getMallShortLabel("pondok-indah-mall")).toBe("PIM");
    expect(getMallShortLabel("aeon-bsd")).toBe("Aeon");
  });

  it("slug ngaco → fallback slug as-is", () => {
    expect(getMallShortLabel("mall-ngaco")).toBe("mall-ngaco");
  });
});
