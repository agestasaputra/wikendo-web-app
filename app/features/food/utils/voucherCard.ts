/**
 * features/food/utils/voucherCard.ts — V12 gift voucher card meta (banner "Ada -20%" in the hero).
 *
 * WHAT: getVoucherCardMeta(style) → cream-rose gradient bg + pink border + rose pill. PURE.
 * EXAMPLE: getVoucherCardMeta("gift").goBg → "#E11D48".
 */
import type { VoucherCardMeta, VoucherStyle } from "../@types/food";

/** Voucher card meta: gift = V12 gift surprise (cream-rose grad + rose pill). */
export function getVoucherCardMeta(style: VoucherStyle): VoucherCardMeta {
  void style;
  return {
    bg: "linear-gradient(140deg,#FFF7ED,#FFE4E6)",
    border: "#FECDD3",
    goBg: "#E11D48",
    goColor: "#fff",
  };
}
