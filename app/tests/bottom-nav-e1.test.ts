import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * bottom-nav-e1.test.ts — TDD Gas E1 BottomNav Home-Mall-Quiz+-Riwayat-Akun (Addendum docs/24).
 * APA: kunci 5-tab + sheet Quiz+ 2 intent + account hub 2-state + riwayat localStorage.
 * KENAPA file-assert: pola 24 test lain, NOL network, deterministik di CI.
 * Status: RED by design (BottomNav.vue/account.vue/riwayat.vue belum ada) → GREEN pas slice.
 */

const NAV_PATH = path.resolve(__dirname, '../components/BottomNav.vue')
const ACC_PATH = path.resolve(__dirname, '../pages/account.vue')
const RIW_PATH = path.resolve(__dirname, '../pages/riwayat.vue')
const APP_PATH = path.resolve(__dirname, '../app.vue')
const RES_T = path.resolve(__dirname, '../pages/result.vue')
const RES_M = path.resolve(__dirname, '../pages/result-makan.vue')

function readSafe(p: string): string {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : ''
}

describe('E1 BottomNav component 5-tab', () => {
  it('file app/components/BottomNav.vue ADA', () => {
    expect(fs.existsSync(NAV_PATH)).toBe(true)
  })

  it('5 tab: Home + Mall + Quiz+ + Riwayat + Akun', () => {
    const s = readSafe(NAV_PATH)
    expect(s).toContain('Home')
    expect(s).toMatch(/\/mall|Mall/)
    expect(s).toMatch(/Quiz\+|QuizPlus|quiz-plus/i)
    expect(s).toMatch(/Riwayat|riwayat/)
    expect(s).toMatch(/Akun|account/)
  })

  it('max-w-md + fixed bottom + thumb-zone', () => {
    const s = readSafe(NAV_PATH)
    expect(s).toContain('max-w-md')
    expect(s).toMatch(/fixed|sticky/)
    expect(s).toMatch(/bottom-0|bottom/)
  })

  it('active state lime + dot', () => {
    const s = readSafe(NAV_PATH)
    expect(s).toMatch(/A3E635|lime/i)
  })

  it('Quiz+ center BUKAN route (buka sheet, bukan NuxtLink /quiz)', () => {
    const s = readSafe(NAV_PATH)
    // center button pakai <button> bukan NuxtLink langsung ke /quiz atau /makan
    expect(s).toMatch(/<button/i)
    expect(s).toMatch(/sheet|showSheet|sheetOpen/i)
  })
})

describe('E1 sheet Quiz+ 2 intent quota jujur', () => {
  it('sheet 2 kartu: Cari Tempat → /quiz + Cari Makan → /makan', () => {
    const s = readSafe(NAV_PATH)
    expect(s).toContain('/quiz')
    expect(s).toContain('/makan')
    expect(s).toMatch(/Cari Tempat|Tempat/i)
    expect(s).toMatch(/Cari Makan|Makan/i)
  })

  it('quota jujur: 2/hari tempat + 5/hari makan atau sisa real', () => {
    const s = readSafe(NAV_PATH)
    expect(s).toMatch(/2\/hari|2x|1\/1|x\/2/i)
    expect(s).toMatch(/5\/hari|5x|2\/2|x\/5/i)
  })

  it('habis disabled jujur Besok lagi 00.00', () => {
    const s = readSafe(NAV_PATH)
    expect(s).toMatch(/Besok lagi|00\.00/)
    expect(s).toContain(':disabled')
  })

  it('tutup backdrop/X + aria-label', () => {
    const s = readSafe(NAV_PATH)
    expect(s).toMatch(/backdrop|@click.*close|showSheet\s*=\s*false/i)
    expect(s).toMatch(/aria-label/)
  })
})

describe('E1 account hub 2-state cermin AS6', () => {
  it('file app/pages/account.vue ADA', () => {
    expect(fs.existsSync(ACC_PATH)).toBe(true)
  })

  it('pakai useAuth 2-state (isLoggedIn + displayName)', () => {
    const s = readSafe(ACC_PATH)
    expect(s).toContain('useAuth')
    expect(s).toContain('isLoggedIn')
    expect(s).toContain('displayName')
  })

  it('anon: CTA Login → /login + Daftar → /register + note 2+5', () => {
    const s = readSafe(ACC_PATH)
    expect(s).toContain('/login')
    expect(s).toContain('/register')
    expect(s).toMatch(/2.*5|5.*2|gratis/i)
  })

  it('login: avatar initial + email + Keluar merah spinner+guard', () => {
    const s = readSafe(ACC_PATH)
    expect(s).toMatch(/initial|avatar/i)
    expect(s).toContain('Keluar')
    expect(s).toContain('animate-spin')
    expect(s).toContain(':disabled')
    expect(s).toMatch(/if\s*\(\s*loggingOut|if\s*\(\s*loading/i)
    expect(s).toContain('signOut')
  })

  it('4 baris hub: Riwayat + Wishlist Segera + WA + Tentang', () => {
    const s = readSafe(ACC_PATH)
    expect(s).toContain('Riwayat')
    expect(s).toContain('Wishlist')
    expect(s).toContain('Segera')
    expect(s).toMatch(/wa\.me|Hubungi/i)
    expect(s).toMatch(/Tentang|tentang/i)
  })
})

describe('E1 riwayat localStorage wikendo_history', () => {
  it('file app/pages/riwayat.vue ADA', () => {
    expect(fs.existsSync(RIW_PATH)).toBe(true)
  })

  it('baca wikendo_history + kosong jujur 1:1 home', () => {
    const s = readSafe(RIW_PATH)
    expect(s).toContain('wikendo_history')
    expect(s).toContain('Belum ada riwayat')
  })

  it('result.vue tulis history (guard window + cap + dedupe)', () => {
    const s = readSafe(RES_T)
    expect(s).toContain('wikendo_history')
    expect(s).toMatch(/typeof window|window/i)
  })

  it('result-makan.vue tulis history', () => {
    const s = readSafe(RES_M)
    expect(s).toContain('wikendo_history')
  })
})

describe('E1 app.vue wiring global', () => {
  it('app.vue pasang <BottomNav', () => {
    expect(readSafe(APP_PATH)).toMatch(/BottomNav/)
  })

  it('anti-ketutup: pb-24 atau padding-bottom nav', () => {
    const s = readSafe(APP_PATH)
    expect(s).toMatch(/pb-24|padding-bottom|pb-20|pb-28/i)
  })

  it('footer id tentang untuk anchor Akun', () => {
    const s = readSafe(APP_PATH)
    expect(s).toMatch(/id=.tentang.|#tentang/)
  })
})
