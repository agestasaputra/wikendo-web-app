/**
 * features/food/@types/food.ts — UI contract for the food mode (result F1b + voucher V12/V13).
 *
 * WHAT: ResultFoodMeta (ink ticket + lime discount + Claim rose + halal mint), FoodHero/RankItem
 *   (result card data), VoucherStyle/VoucherCardMeta (gift V12), VoucherItem + VoucherClaimResult.
 * Used by: utils/* + store/VoucherStore + FoodResultPage + VoucherSheet.
 */
export interface ResultFoodMeta {
  ticketBg: string;
  discountColor: string;
  ticketBorder: string;
  claimBg: string;
  claimColor: string;
  bestBg: string;
  halalBg: string;
  halalColor: string;
  cardBg: string;
}

/** gift = V12 gift surprise: cream-rose grad bg + pink border + rose pill. */
export type VoucherStyle = "gift";

export interface VoucherCardMeta {
  bg: string;
  border: string;
  goBg: string;
  goColor: string;
}

export interface FoodHero {
  name: string;
  reason: string;
  price: string;
  floor: string;
  halal: boolean | null;
  kids: string;
  maps: string;
}

export interface RankItem {
  name: string;
  tags: string;
}

export interface VoucherItem {
  code: string;
  name: string;
  min: string;
  left: number;
  cap: number;
}

/** V13D offer row returned by GET /api/vouchers (joined to tenant + mall). */
export interface VoucherOffer {
  code: string;
  tenant_id: string;
  tenant_name: string;
  promo_text: string;
  discount_percent: number;
  expires_at: string;
  claimed: boolean;
}

export interface VoucherClaimResult {
  status: string;
  claim_code: string;
  expires_at: string;
  voucher: { name: string; discount_percent: number };
  time_remaining: { hours: number; minutes: number; expired: boolean };
}
