import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * result-makan-voucher.test.ts — Voucher gift di ATAS, bawah bersih (request Agesta 11 Okt 2026).
 * APA: baca result-makan.vue sebagai teks, kunci struktur voucher baru.
 * KENAPA: tiket dashed + Klaim di atas dihapus, diganti model banner bawah
 * (Ada -20% buat lu + Buka →) yang dipindah ke dalam hero card; paling bawah
 * TIDAK ada lagi component voucher (anti dobel CTA). Pages cukup lint+build,
 * logic pure tetap di utils/quiz-logic.
 */

const S = fs.readFileSync(path.resolve(__dirname, '../pages/result-makan.vue'), 'utf-8')

function count(hay: string, needle: string): number {
  return hay.split(needle).length - 1
}

describe('result-makan voucher — tiket atas dihapus', () => {
  it('TIDAK ada tiket dashed: tanpa VOUCHER + Klaim + tunjukin ke kasir + dashed', () => {
    expect(S).not.toContain('VOUCHER')
    expect(S).not.toContain('Klaim →')
    expect(S).not.toContain('tunjukin ke kasir')
    expect(S).not.toContain('dashed')
  })

  it('ADA banner gift di dalam hero: Ada -20% buat lu + Buka + vGift', () => {
    expect(S).toContain('Ada')
    expect(S).toContain('-20%')
    expect(S).toContain('buat lu')
    expect(S).toContain('Buka →')
    expect(S).toContain('vGift')
    expect(S).toContain('getVoucherCardMeta(\'gift\')')
  })

  it('HANYA 1 voucher: Buka → muncul tepat 1x (bawah bersih)', () => {
    expect(count(S, 'Buka →')).toBe(1)
  })

  it('Hero tetap utuh: BEST MATCH + Maps tenant + rank + Coba lagi', () => {
    expect(S).toContain('BEST MATCH')
    expect(S).toContain('Maps tenant →')
    expect(S).toContain('#{{ i + 1 }}')
    expect(S).toContain('Coba lagi')
    expect(S).toContain(':disabled="pending"')
  })
})
