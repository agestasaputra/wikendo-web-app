/**
 * features/makan/utils/resultMeta.ts — Token kartu result MAKAN F1b (tiket ink + diskon lime).
 *
 * APA: getResultMakanMeta() → warna. PURE. Token lock Agesta: ink + lime + rose + mint.
 * Contoh: getResultMakanMeta().claimBg → "#E11D48".
 */
import type { ResultMakanMeta } from "../@types/makan";

/** Meta kartu result makan F1b: tiket ink + diskon lime + Klaim rose + halal mint. */
export function getResultMakanMeta(): ResultMakanMeta {
  return {
    ticketBg: "#0C0A09",
    discountColor: "#A3E635",
    ticketBorder: "#FECDD3",
    claimBg: "#E11D48",
    claimColor: "#fff",
    bestBg: "#A3E635",
    halalBg: "#ECFDF5",
    halalColor: "#047857",
    pageBg: "#F5F5F4",
    cardBg: "#fff",
  };
}
