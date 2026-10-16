/**
 * features/makan/utils/voucherCard.ts — Meta kartu voucher gift V12 (banner "Ada -20%" di hero).
 *
 * APA: getVoucherCardMeta(style) → bg gradasi cream-rose + border pink + pill rose. PURE.
 * Contoh: getVoucherCardMeta("gift").goBg → "#E11D48".
 */
import type { VoucherCardMeta, VoucherStyle } from "../@types/makan";

/** Meta kartu voucher: gift = V12 gift surprise (grad cream-rose + pill rose). */
export function getVoucherCardMeta(style: VoucherStyle): VoucherCardMeta {
  void style;
  return {
    bg: "linear-gradient(140deg,#FFF7ED,#FFE4E6)",
    border: "#FECDD3",
    goBg: "#E11D48",
    goColor: "#fff",
  };
}
