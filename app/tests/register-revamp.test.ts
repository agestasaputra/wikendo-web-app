import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * register-revamp.test.ts — Slicing 100% halaman /register ikut image terakhir (10 Okt 2026).
 * APA: baca app/pages/register.vue sebagai teks, assert 9 elemen image 1:1 + wiring fitur.
 * KENAPA: SOP §8 slicing 100% — beda 1 teks = BELUM DONE. RED dulu by design,
 * lalu GREEN pas register.vue di-slice persis + disesuaikan fitur (Supabase signUp, Google OAuth, meter kuat?).
 * Image ref: /home/ubuntu/.hermes/cache/images/img_19a0ea1cfdcf.jpg
 * Urutan image: banner hitam DAFTAR GRATIS 2•5 → Daftar via Google → Nama → Email → Password•kuat? → checkbox → Daftar →
 * TAKEOUT 10 Okt 2026 (request Agesta): field Nama dihapus — user hanya isi Email + Password.
 */

const REGISTER = path.resolve(__dirname, '../pages/register.vue')

function readRegister(): string {
  return fs.readFileSync(REGISTER, 'utf-8')
}

describe('register revamp 100% image — struktur + teks persis', () => {
  it('container mobile max-w-md + background paper #F5F5F4 (bukan body/root)', () => {
    const s = readRegister()
    expect(s).toContain('max-w-md mx-auto px-4 pb-10')
    expect(s).toContain('#F5F5F4')
  })

  it('tanpa header lokal duplikat (header global sudah di app.vue, image mulai dari banner)', () => {
    const s = readRegister()
    expect(s).not.toContain('<header')
  })

  it('banner hitam: DAFTAR GRATIS + angka 2 • 5 + quota full + voucher', () => {
    const s = readRegister()
    expect(s).toContain('DAFTAR GRATIS')
    expect(s).toContain('2 • 5')
    expect(s).toContain('quota full + voucher')
  })

  it('tombol Lanjutkan dengan Google (outline abu resmi + divider ATAU, Opsi A board v10)', () => {
    const s = readRegister()
    expect(s).toContain('Lanjutkan dengan Google')
    expect(s).toContain('rounded-full')
    expect(s).toContain('#DADCE0')
    expect(s).toContain('ATAU')
  })

  it('field Email + Password SAJA (Nama di-takeout): placeholder persis + ikon kiri', () => {
    const s = readRegister()
    expect(s).not.toContain('placeholder="Nama"')
    expect(s).not.toContain('👤')
    expect(s).not.toContain('nama = ref(\'\')')
    expect(s).not.toContain('nama:')
    expect(s).toContain('placeholder="Email"')
    expect(s).toContain('placeholder="Password"')
    expect(s).toContain('✉️')
    expect(s).toContain('🔒')
  })

  it('meter kekuatan di bawah field password: • pemisah + label kata (bukan inline sesak)', () => {
    const s = readRegister()
    expect(s).toContain('strengthLabel')
    expect(s).toContain('•')
  })

  it('checkbox: Setuju Syarat & Privasi (checked by default kayak image)', () => {
    const s = readRegister()
    expect(s).toContain('Setuju Syarat & Privasi')
    expect(s).toContain('checkbox')
  })

  it('CTA utama hitam: Daftar → (panah kanan)', () => {
    const s = readRegister()
    expect(s).toContain('Daftar →')
    expect(s).toContain('#0C0A09')
  })
})

describe('register revamp — banner 1:1 R1 (token lock v9)', () => {
  it('banner ink #0C0A09 + strip kiri ember #EA580C + radius 12px (bukan rose/rounded-3xl)', () => {
    const s = readRegister()
    expect(s).toContain('#0C0A09')
    expect(s).toContain('#EA580C')
    expect(s).toContain('border-left')
    expect(s).toContain('border-radius:12px')
    expect(s).not.toContain('rounded-3xl')
    expect(s).not.toContain('#E11D48')
    expect(s).not.toContain('bg-orange-600')
  })

  it('angka 2 • 5 warna lime-muda #D9F99D 17px (bukan putih 24px)', () => {
    const s = readRegister()
    expect(s).toContain('#D9F99D')
    expect(s).toContain('17px')
  })

  it('tanpa footer lokal 10-detik (image bawah CTA kosong, footer ikut global app.vue)', () => {
    const s = readRegister()
    expect(s).not.toContain('10 detik')
  })
})

describe('register revamp — wiring fitur app (bukan mock)', () => {
  it('daftar email+password via Supabase signUp + redirect cek-email (Opsi B, bukan langsung /)', () => {
    const s = readRegister()
    expect(s).toContain('signUp')
    expect(s).toContain('supabaseBrowser')
    expect(s).toContain('/check-email')
  })

  it('tombol Google via Supabase signInWithOAuth provider google', () => {
    const s = readRegister()
    expect(s).toContain('signInWithOAuth')
    expect(s).toContain('google')
  })

  it('error inline (bukan alert) + font Plus Jakarta Sans', () => {
    const s = readRegister()
    expect(s).toContain('errorMsg')
    expect(s).toContain('Plus Jakarta Sans')
  })
})
