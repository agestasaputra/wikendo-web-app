import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * register-verify.test.ts — Opsi B magic-link (lock Agesta 10 Okt 2026, "Gas B").
 * APA: assert register.vue redirect ke /check-email + emailRedirectTo, dan halaman
 * check-email.vue ada (judul + resend signup + style 1:1 register).
 * KENAPA: signUp langsung masuk = bot lolos + typo email = reset gagal.
 * Magic-link: Daftar → Cek email → klik 1 link → HOME. Google OAuth tetap langsung.
 */

const REGISTER = path.resolve(__dirname, '../pages/register.vue')
const CHECK = path.resolve(__dirname, '../pages/check-email.vue')

function readRegister(): string {
  return fs.readFileSync(REGISTER, 'utf-8')
}

function readCheck(): string {
  return fs.readFileSync(CHECK, 'utf-8')
}

describe('opsi B magic-link — register redirect ke cek-email', () => {
  it('signUp pakai emailRedirectTo ke HOME (link verifikasi balik ke /)', () => {
    const s = readRegister()
    expect(s).toContain('signUp')
    expect(s).toContain('emailRedirectTo')
  })

  it('sukses daftar → /check-email?email= (BUKAN langsung /)', () => {
    const s = readRegister()
    expect(s).toContain('/check-email')
    expect(s).toContain('path: \'/check-email\'')
    // handleRegister tidak boleh lempar langsung ke home lagi
    expect(s).not.toMatch(/handleRegister[\s\S]*router\.push\('\/'\)/)
  })

  it('Google OAuth tetap langsung (tanpa cek-email, Google sudah verifikasi)', () => {
    const s = readRegister()
    expect(s).toContain('signInWithOAuth')
    expect(s).toContain('google')
  })
})

describe('opsi B magic-link — halaman /check-email', () => {
  it('judul Cek email + tampilkan email dari query + font + paper 1:1 register', () => {
    const s = readCheck()
    expect(s).toContain('Cek email')
    expect(s).toContain('route.query.email')
    expect(s).toContain('Plus Jakarta Sans')
    expect(s).toContain('#F5F5F4')
    expect(s).toContain('max-w-md mx-auto px-4 pb-10')
  })

  it('tanpa header lokal (ikut global app.vue) + ada link balik login', () => {
    const s = readCheck()
    expect(s).not.toContain('<header')
    expect(s).toContain('/login')
  })

  it('tombol Kirim ulang via resend type signup + pesan sukses/error inline', () => {
    const s = readCheck()
    expect(s).toContain('Kirim ulang')
    expect(s).toContain('resend')
    expect(s).toContain('\'signup\'')
    expect(s).toContain('errorMsg')
    expect(s).toContain('successMsg')
  })

  it('banner ink 1:1 register (strip ember + radius 12 + angka lime)', () => {
    const s = readCheck()
    expect(s).toContain('#0C0A09')
    expect(s).toContain('#EA580C')
    expect(s).toContain('border-radius:12px')
    expect(s).toContain('#D9F99D')
  })
})
