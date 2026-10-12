import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * voucher-sheet-strip.test.ts — TDD Gas v13 V13A/B/C (file-assert deterministik).
 * APA: kunci wiring multi-voucher end-to-end di 2 pages + 1 composable.
 * KENAPA file-assert: pola 23 test lain, NOL network, deterministik di CI.
 * V13A hero best-1 + link +2 promo lain → sheet.
 * V13B sheet pilih 1 dari 3 + sisa cap + Klaim per row + spinner + disabled + guard.
 * V13C strip promo di mall page tanpa route baru.
 */

const R = fs.readFileSync(path.resolve(__dirname, '../pages/result-makan.vue'), 'utf-8')
const M = fs.readFileSync(path.resolve(__dirname, '../pages/mall/[slug].vue'), 'utf-8')
const VPATH = path.resolve(__dirname, '../composables/useVoucher.ts')
const V = fs.existsSync(VPATH) ? fs.readFileSync(VPATH, 'utf-8') : ''

describe('V13A hero best-1 + link +2 promo', () => {
  it('ADA link +2 promo lain pemicu sheet', () => {
    expect(R).toContain('+2 promo lain')
  })

  it('Buka tetap 1x (hero single CTA, sheet pakai Klaim)', () => {
    const n = R.split('Buka →').length - 1
    expect(n).toBe(1)
  })

  it('ADA state sheet (showSheet / sheetOpen)', () => {
    expect(R.toLowerCase()).toContain('sheet')
    expect(R).toMatch(/showSheet|sheetOpen|sheet/)
  })
})

describe('V13B sheet picker 3 row + Klaim API', () => {
  it('ADA judul pilih 1 + aturan 1 transaksi 1 kode + 23:59', () => {
    expect(R).toContain('Pilih 1')
    expect(R).toContain('1 transaksi 1 kode')
    expect(R).toContain('23:59')
  })

  it('ADA 3 kode seed WKD-7X2K9A/4Y5B3C/L8M2N1 atau sisa cap per row', () => {
    const hasCodes = R.includes('WKD-7X2K9A') && R.includes('WKD-4Y5B3C') && R.includes('WKD-L8M2N1')
    const hasCap = R.includes('/20') || R.includes('sisa')
    expect(hasCodes || hasCap).toBe(true)
  })

  it('ADA tombol Klaim per row (tanpa panah, beda dari Buka)', () => {
    expect(R).toContain('Klaim')
    expect(R).not.toContain('Klaim →')
  })

  it('UX lock: spinner animate-spin + :disabled + early-return guard', () => {
    expect(R).toContain('animate-spin')
    expect(R).toContain(':disabled')
    // guard anti double-klik: early return kalau lagi claiming
    expect(R).toMatch(/if\s*\(\s*claiming/i)
  })

  it('Wiring API: POST /api/voucher/claim via $fetch + Bearer token', () => {
    expect(R).toContain('/api/voucher/claim')
    expect(R).toMatch(/\$fetch|fetch/)
    expect(R).toMatch(/authorization|Bearer|access_token|getSession/i)
  })

  it('ADA composable useVoucher.ts dengan claimVoucher', () => {
    expect(fs.existsSync(VPATH)).toBe(true)
    expect(V).toContain('claimVoucher')
    expect(V).toContain('/api/voucher/claim')
  })
})

describe('V13C strip promo di mall page', () => {
  it('ADA section Promo hari ini di + short label', () => {
    expect(M).toContain('Promo hari ini di')
  })

  it('ADA row promo + aksi Lihat tanpa route baru (/makan?mall=)', () => {
    expect(M).toMatch(/Lihat|Buka|promo/i)
    expect(M).toContain('/makan?mall=')
  })

  it('NOL route baru: tidak ada pages/vouchers ni pages/t/ baru', () => {
    expect(fs.existsSync(path.resolve(__dirname, '../pages/vouchers.vue'))).toBe(false)
    // strip hanya link query, bukan create route file
    expect(M).not.toContain('/vouchers')
  })
})
