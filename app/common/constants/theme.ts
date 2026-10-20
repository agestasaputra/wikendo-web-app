/**
 * common/constants/theme.ts — token kanvas (background halaman) untuk SELURUH app.
 *
 * WHAT: `PAGE_BG` = warna kanvas halaman, satu-satunya sumber kebenaran.
 * WHY: background kanvas adalah tanggung jawab LAYOUT, bukan feature. Sebelum ini tiap halaman
 *   mendeklarasikan sendiri (home `#F5F5F4`, history/account tidak set → jatuh ke `bg-base`
 *   `#fffdf9`, mall/legal hardcode `#f5f5f4`) sehingga 3 halaman terlihat beda warna.
 *   Dengan satu konstanta: ganti kanvas = ubah 1 baris, semua halaman ikut (DRY).
 * EXAMPLE: `app.vue` → `:style="{ background: PAGE_BG }"`; feature cukup isi konten, tanpa
 *   `:style` background dan tanpa `pageBg` di meta helper-nya.
 */
export const PAGE_BG = "#F5F5F4";
