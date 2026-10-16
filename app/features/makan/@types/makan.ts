/**
 * features/makan/@types/makan.ts — KONTRAK UI mode Makan (result F1b + voucher V12/V13).
 *
 * APA: ResultMakanMeta (tiket ink + diskon lime + Klaim rose + halal mint), MakanHero/RankItem
 *   (data kartu hasil), VoucherStyle/VoucherCardMeta (gift V12), VoucherItem + VoucherClaimResult.
 * Dipakai: utils/* + store/VoucherStore + MakanResultPage + VoucherSheet.
 */
export interface ResultMakanMeta {
  ticketBg: string;
  discountColor: string;
  ticketBorder: string;
  claimBg: string;
  claimColor: string;
  bestBg: string;
  halalBg: string;
  halalColor: string;
  pageBg: string;
  cardBg: string;
}

/** gift = V12 gift surprise: bg grad cream-rose + border pink + pill rose. */
export type VoucherStyle = "gift";

export interface VoucherCardMeta {
  bg: string;
  border: string;
  goBg: string;
  goColor: string;
}

export interface MakanHero {
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

export interface VoucherClaimResult {
  status: string;
  claim_code: string;
  expires_at: string;
  voucher: { name: string; discount_percent: number };
  time_remaining: { hours: number; minutes: number; expired: boolean };
}
