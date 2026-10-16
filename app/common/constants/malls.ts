/**
 * common/constants/malls.ts — Data mall: slug → nama lengkap + label pendek.
 *
 * APA: 5 mall aktif. KENAPA di sini: dipakai direktori, quiz makan, result makan.
 * Mall ke-6 = tambah 1 entry di 2 map ini (+ row tabel `malls` + option quiz makan).
 */
export const MALL_NAMES: Record<string, string> = {
  "grand-indonesia": "Grand Indonesia",
  "central-park": "Central Park",
  "kota-kasablanka": "Kota Kasablanka",
  "pondok-indah-mall": "Pondok Indah Mall",
  "aeon-bsd": "Aeon BSD",
};

export const MALL_SHORT_LABELS: Record<string, string> = {
  "grand-indonesia": "GI",
  "central-park": "CP",
  "kota-kasablanka": "Kokas",
  "pondok-indah-mall": "PIM",
  "aeon-bsd": "Aeon",
};
