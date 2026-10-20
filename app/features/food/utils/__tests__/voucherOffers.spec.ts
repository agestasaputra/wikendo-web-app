import { describe, expect, it } from "vitest";
import {
  buildDiscountLabel,
  claimState,
  countdownLabel,
  otherOffers,
  pickHeroOffer,
} from "../voucherOffers";
import type { VoucherOffer } from "../../@types/food";

/**
 * voucherOffers.spec.ts — P0 V13D: offers come from the DB per tenant, not a hardcoded list.
 * WHY these cases: the shipped UI showed HokBen's 3 codes under EVERY hero, printed "-0%" for
 * free-upsize promos, and had no way to render an already-claimed row.
 */
function offer(patch: Partial<VoucherOffer> = {}): VoucherOffer {
  return {
    code: "WKD-7X2K9A",
    tenant_id: "t-hokben",
    tenant_name: "HokBen",
    promo_text: "Kopi Weekday -20%",
    discount_percent: 20,
    expires_at: "2026-10-20T16:59:00.000Z",
    claimed: false,
    ...patch,
  };
}

describe("buildDiscountLabel", () => {
  it("percentage > 0 → -20%", () => {
    expect(buildDiscountLabel({ discount_percent: 20 })).toBe("-20%");
  });

  it("0% (free upsize / fixed) → 'Promo spesial', never '-0%'", () => {
    expect(buildDiscountLabel({ discount_percent: 0 })).toBe("Promo spesial");
  });
});

describe("countdownLabel", () => {
  const now = Date.parse("2026-10-20T14:00:00.000Z");

  it("hours + minutes left → 'sisa 2j 59m'", () => {
    expect(countdownLabel("2026-10-20T16:59:00.000Z", now)).toBe("sisa 2j 59m");
  });

  it("under 1 hour → only minutes", () => {
    expect(countdownLabel("2026-10-20T14:42:00.000Z", now)).toBe("sisa 42m");
  });

  it("under 1 minute → 'kurang dari 1 menit'", () => {
    expect(countdownLabel("2026-10-20T14:00:30.000Z", now)).toBe(
      "kurang dari 1 menit",
    );
  });

  it("already past → 'hangus'", () => {
    expect(countdownLabel("2026-10-20T13:00:00.000Z", now)).toBe("hangus");
  });
});

describe("pickHeroOffer", () => {
  it("returns ONLY the offer owned by the hero tenant", () => {
    const offers = [
      offer({ code: "A", tenant_id: "t-burgreens" }),
      offer({ code: "B", tenant_id: "t-hokben" }),
    ];
    expect(pickHeroOffer(offers, "t-hokben")?.code).toBe("B");
  });

  it("no offer for that tenant → null (never borrow another tenant's code)", () => {
    const offers = [offer({ tenant_id: "t-burgreens" })];
    expect(pickHeroOffer(offers, "t-hokben")).toBeNull();
  });

  it("empty tenant id → null", () => {
    expect(pickHeroOffer([offer()], "")).toBeNull();
  });
});

describe("otherOffers", () => {
  it("excludes the hero tenant and caps the sheet rows", () => {
    const offers = [
      offer({ code: "A", tenant_id: "t-hokben" }),
      offer({ code: "B", tenant_id: "t-burgreens" }),
      offer({ code: "C", tenant_id: "t-union" }),
      offer({ code: "D", tenant_id: "t-genki" }),
    ];
    expect(otherOffers(offers, "t-hokben", 2).map((o) => o.code)).toEqual([
      "B",
      "C",
    ]);
  });
});

describe("claimState", () => {
  it("claimed row → 'claimed' (button renders as already-claimed)", () => {
    expect(claimState(offer({ claimed: true }))).toBe("claimed");
  });

  it("fresh row → 'idle'", () => {
    expect(claimState(offer())).toBe("idle");
  });
});
