import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * auth-state-home.test.ts — Pembeda before/after login di index (Addendum docs/22).
 * APA: baca useAuth.ts + app.vue + index.vue sebagai teks, assert 11 best practice:
 *  composable session (4) + header 2-state avatar+dropdown+logout (4) + greeting + hero login-aware (3).
 * KENAPA: login sekarang nol rasanya (isLoggedIn undefined, sapaan hardcode, quota anon terus).
 * Status: SKIP by design — Agesta yang slicing sendiri. Hapus `.skip` pas mulai buat lihat RED,
 * lalu GREEN pas slice. Selama SKIP, full suite tetap hijau.
 */

const USE_AUTH = path.resolve(__dirname, '../composables/useAuth.ts')
const APP_VUE = path.resolve(__dirname, '../app.vue')
const HOME = path.resolve(__dirname, '../pages/index.vue')

function readSafe(p: string): string {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : ''
}

describe('auth-state-home — composable useAuth.ts (session sumber kebenaran)', () => {
  it('file app/composables/useAuth.ts ADA', () => {
    expect(fs.existsSync(USE_AUTH)).toBe(true)
  })

  it('load session + listener: getSession + onAuthStateChange', () => {
    const s = readSafe(USE_AUTH)
    expect(s).toContain('getSession')
    expect(s).toContain('onAuthStateChange')
  })

  it('expose isLoggedIn + email + displayName + signOut', () => {
    const s = readSafe(USE_AUTH)
    expect(s).toContain('isLoggedIn')
    expect(s).toContain('displayName')
    expect(s).toContain('signOut')
  })

  it('displayName: full_name > name > fallback prefix email', () => {
    const s = readSafe(USE_AUTH)
    expect(s).toContain('full_name')
    expect(s).toMatch(/split\(['"]@['"]\)|prefix/i)
  })
})

describe('auth-state-home — header 2-state (avatar + dropdown, max-w-md tetap)', () => {
  it('app.vue pakai useAuth (bukan isLoggedIn hantu)', () => {
    expect(readSafe(APP_VUE)).toContain('useAuth')
  })

  it('after-login: avatar initial + Bell tetap ada', () => {
    const s = readSafe(APP_VUE)
    expect(s).toContain('🔔')
    expect(s).toMatch(/avatar|displayName|initial/i)
  })

  it('dropdown mini: email display + Riwayat + Wishlist + Keluar', () => {
    const s = readSafe(APP_VUE)
    expect(s).toContain('Riwayat')
    expect(s).toContain('Wishlist')
    expect(s).toMatch(/Keluar|Logout|signOut/i)
  })

  it('logout real: signOut + balik ke /', () => {
    const s = readSafe(APP_VUE)
    expect(s).toContain('signOut')
    expect(s).toContain('push(\'/\')')
  })
})

describe('auth-state-home — greeting + hero index login-aware', () => {
  it('index.vue pakai useAuth', () => {
    expect(readSafe(HOME)).toContain('useAuth')
  })

  it('greeting dinamis: Halo {nama} + fallback teman Wikendo', () => {
    const s = readSafe(HOME)
    expect(s).toContain('teman Wikendo')
    expect(s).toMatch(/Halo.*displayName|Halo.*firstName|displayName.*Halo/i)
  })

  it('hero sub login-aware: Sisa kamu + teks anon tetap', () => {
    const s = readSafe(HOME)
    expect(s).toContain('login buka 2 + 5')
    expect(s).toContain('Sisa kamu')
  })
})
