/**
 * common/utils/__tests__/mall.spec.ts — Mall name helper test.
 * The slug→name mapping is used in 3 places → 1 helper; the 6th mall just needs a constants edit.
 */
import { describe, it, expect } from "vitest";
import { getMallName, getMallShortLabel } from "../mall";

describe("getMallName (slug → full name)", () => {
  it("5 valid slugs → full name", () => {
    expect(getMallName("grand-indonesia")).toBe("Grand Indonesia");
    expect(getMallName("central-park")).toBe("Central Park");
    expect(getMallName("kota-kasablanka")).toBe("Kota Kasablanka");
    expect(getMallName("pondok-indah-mall")).toBe("Pondok Indah Mall");
    expect(getMallName("aeon-bsd")).toBe("Aeon BSD");
  });

  it("bogus slug → fallback to slug as-is (no crash)", () => {
    expect(getMallName("mall-ngaco")).toBe("mall-ngaco");
  });
});

describe("getMallShortLabel (slug → chip/short label)", () => {
  it("long names shortened (GI, CP, Kokas, PIM, Aeon)", () => {
    expect(getMallShortLabel("grand-indonesia")).toBe("GI");
    expect(getMallShortLabel("central-park")).toBe("CP");
    expect(getMallShortLabel("kota-kasablanka")).toBe("Kokas");
    expect(getMallShortLabel("pondok-indah-mall")).toBe("PIM");
    expect(getMallShortLabel("aeon-bsd")).toBe("Aeon");
  });

  it("bogus slug → fallback to slug as-is", () => {
    expect(getMallShortLabel("mall-ngaco")).toBe("mall-ngaco");
  });
});
