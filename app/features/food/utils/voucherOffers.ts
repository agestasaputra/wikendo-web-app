/**
 * features/food/utils/voucherOffers.ts — Voucher offer rows → render values (P0 V13D, 20 Oct 2026).
 *
 * WHAT: buildDiscountLabel(offer), countdownLabel(expiresAt, nowMs), pickHeroOffer(list, tenantId),
 *   otherOffers(list, tenantId, max), claimState(offer).
 * WHY: the old UI shipped a hardcoded FOOD_PROMOS list owned by ONE tenant (HokBen) and showed it
 *   under every hero → a user who got Central Park could claim a Grand Indonesia code. Offers now
 *   come from `vouchers` JOIN `tenants`, so the label and the ownership move together.
 * WHY only 1 discount label: `discount_percent = 0` is a real business case (free upsize), so the
 *   label must not print "-0%".
 * EXAMPLE: buildDiscountLabel({ discount_percent: 20 }) // "-20%"
 *   countdownLabel("2026-10-20T16:59:00Z", Date.parse("2026-10-20T14:00:00Z")) // "sisa 2j 59m"
 */
import type { VoucherOffer } from "../@types/food";

/** Hero gift + sheet row label: percentage → "-20%", zero/fixed → "Promo spesial". */
export function buildDiscountLabel(
  offer: Pick<VoucherOffer, "discount_percent">,
): string {
  const pct = Number(offer.discount_percent) || 0;
  return pct > 0 ? `-${pct}%` : "Promo spesial";
}

/** Time left until the claim expires: "sisa 3j 12m" / "kurang dari 1 menit" / "hangus". */
export function countdownLabel(expiresAt: string, nowMs: number): string {
  const end = Date.parse(expiresAt);
  if (!Number.isFinite(end)) return "";
  const diff = end - nowMs;
  if (diff <= 0) return "hangus";
  const totalMinutes = Math.floor(diff / 60000);
  if (totalMinutes < 1) return "kurang dari 1 menit";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `sisa ${hours}j ${minutes}m` : `sisa ${minutes}m`;
}

/** The voucher that belongs to the CURRENT hero tenant (null = no honest gift to show). */
export function pickHeroOffer(
  offers: VoucherOffer[],
  tenantId: string,
  tenantName?: string,
): VoucherOffer | null {
  if (tenantId) {
    const byId = offers.find((o) => o.tenant_id === tenantId);
    if (byId) return byId;
  }
  const name = (tenantName ?? "").trim().toLowerCase();
  if (name) {
    return (
      offers.find((o) => o.tenant_name.trim().toLowerCase() === name) ?? null
    );
  }
  return null;
}

/** Promo link label: '+N promo lain' for N other offers, '' when none. */
export function promoLinkLabel(count: number): string {
  if (count <= 0) return "";
  return `+${count} promo lain`;
}

/** Every other active offer in the same mall (never the hero one), capped for the sheet. */
export function otherOffers(
  offers: VoucherOffer[],
  tenantId: string,
  max = 2,
): VoucherOffer[] {
  return offers.filter((o) => o.tenant_id !== tenantId).slice(0, max);
}

/** "claimed" once the server (or a successful claim) marks the row; drives the disabled state. */
export function claimState(offer: VoucherOffer): "claimed" | "idle" {
  return offer.claimed ? "claimed" : "idle";
}
