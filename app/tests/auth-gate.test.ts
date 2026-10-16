import { describe, it, expect } from 'vitest'
import {
  normalizePhone,
  isPhoneValid,
  isVoucherCodeValid,
  generateVoucherCode,
  isSaveLoginWall,
  isWishlistLoginWall,
  isHistoryLoginWall,
  isVoucherClaimWall
} from '../utils/quiz-logic'

describe('normalizePhone (API §register: trim, kosong → null)', () => {
  it('undefined → null (skip = valid)', () => {
    expect(normalizePhone(undefined)).toBeNull()
  })

  it('\'\' → null', () => {
    expect(normalizePhone('')).toBeNull()
  })

  it('\'   \' → null', () => {
    expect(normalizePhone('   ')).toBeNull()
  })

  it('\' +628123456789 \' → trimmed', () => {
    expect(normalizePhone(' +628123456789 ')).toBe('+628123456789')
  })
})

describe('isPhoneValid (Schema CHECK: NULL lolos, isi wajib +62)', () => {
  it('null → true (skip)', () => {
    expect(isPhoneValid(null)).toBe(true)
  })

  it('undefined → true', () => {
    expect(isPhoneValid(undefined)).toBe(true)
  })

  it('\'\' → true (kosong = skip)', () => {
    expect(isPhoneValid('')).toBe(true)
  })

  it('\'+628123456789\' → true', () => {
    expect(isPhoneValid('+628123456789')).toBe(true)
  })

  it('\'08123456789\' → false (tanpa +62)', () => {
    expect(isPhoneValid('08123456789')).toBe(false)
  })

  it('\'+62abc\' → false', () => {
    expect(isPhoneValid('+62abc')).toBe(false)
  })

  it('\'+62123\' → false (kependekan)', () => {
    expect(isPhoneValid('+62123')).toBe(false)
  })

  it('\'+62 + 14 digit\' → false (kepanjangan)', () => {
    expect(isPhoneValid('+6212345678901234')).toBe(false)
  })
})

describe('voucher code WIK-XXXXX (API §16 claim)', () => {
  it('\'WIK-HB7K2\' → valid (contoh spek)', () => {
    expect(isVoucherCodeValid('WIK-HB7K2')).toBe(true)
  })

  it('\'WIK-12345\' → valid (digit semua)', () => {
    expect(isVoucherCodeValid('WIK-12345')).toBe(true)
  })

  it('undefined → false', () => {
    expect(isVoucherCodeValid(undefined)).toBe(false)
  })

  it('\'wik-hb7k2\' → false (lowercase)', () => {
    expect(isVoucherCodeValid('wik-hb7k2')).toBe(false)
  })

  it('\'WIK-HB72\' → false (cuma 4 char)', () => {
    expect(isVoucherCodeValid('WIK-HB72')).toBe(false)
  })

  it('generateVoucherCode() → format valid + prefix WIK-', () => {
    const code = generateVoucherCode()
    expect(code.startsWith('WIK-')).toBe(true)
    expect(code).toHaveLength(9)
    expect(isVoucherCodeValid(code)).toBe(true)
  })
})

describe('login wall momen #2-4 (Journey: Simpan / Wishlist-Riwayat / klaim voucher)', () => {
  it('anon tap Simpan → wall (momen #2)', () => {
    expect(isSaveLoginWall(false)).toBe(true)
  })

  it('login tap Simpan → BUKAN wall', () => {
    expect(isSaveLoginWall(true)).toBe(false)
  })

  it('anon buka Wishlist → wall (momen #3)', () => {
    expect(isWishlistLoginWall(false)).toBe(true)
  })

  it('login buka Wishlist → BUKAN wall', () => {
    expect(isWishlistLoginWall(true)).toBe(false)
  })

  it('anon buka Riwayat → wall (momen #3)', () => {
    expect(isHistoryLoginWall(false)).toBe(true)
  })

  it('login buka Riwayat → BUKAN wall', () => {
    expect(isHistoryLoginWall(true)).toBe(false)
  })

  it('anon klaim voucher → wall 401 (momen #4, anti-farming)', () => {
    expect(isVoucherClaimWall(false)).toBe(true)
  })

  it('login klaim voucher → BUKAN wall (lanjut cek double-klaim DB)', () => {
    expect(isVoucherClaimWall(true)).toBe(false)
  })
})
