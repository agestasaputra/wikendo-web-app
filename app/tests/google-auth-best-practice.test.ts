import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * google-auth-best-practice.test.ts — Satu pintu Google Auth (11 Okt 2026, approved "Gas fix!").
 * APA: baca login.vue + register.vue sebagai teks, assert 3 best practice:
 *  1. Label netral SAMA "Lanjutkan dengan Google" (bukan "Daftar via" / "Lanjut dengan").
 *  2. Redirect SAMA: hormati ?redirect= (fallback /) — register jangan hardcode /.
 *  3. Checkbox Syarat dikunci: handleGoogle register wajib cek agree.
 * KENAPA: fungsi signInWithOAuth SAMA (Supabase auto create-vs-login by email).
 * Label beda = beban pikir + redirect beda = konteks quiz hilang + checkbox bypass = bolong legal.
 * RED dulu by design → GREEN pas slice.
 */

function readPage(f: string): string {
  return fs.readFileSync(path.resolve(__dirname, '../pages', f), 'utf-8')
}

describe('Google Auth satu pintu — label netral sama', () => {
  for (const f of ['register.vue', 'login.vue']) {
    it(`${f}: label "Lanjutkan dengan Google"`, () => {
      expect(readPage(f)).toContain('Lanjutkan dengan Google')
    })
    it(`${f}: label lama hilang (Daftar via / Lanjut dengan)`, () => {
      const s = readPage(f)
      expect(s).not.toContain('Daftar via Google')
      expect(s).not.toContain('\'Lanjut dengan Google\'')
    })
  }
})

describe('Google Auth satu pintu — redirect sama (hormati ?redirect=)', () => {
  for (const f of ['register.vue', 'login.vue']) {
    it(`${f}: baca route.query.redirect + redirectTo pakai redirect`, () => {
      const s = readPage(f)
      expect(s).toContain('route.query.redirect')
      expect(s).toContain('redirectTo')
      // redirectTo harus nempel variabel redirect, bukan hardcode '/' doang
      expect(s).toMatch(/redirectTo:.*\$\{[^}]*redirect[^}]*\}/)
    })
  }
  it('login: footer Daftar preservasi ?redirect=', () => {
    const s = readPage('login.vue')
    expect(s).toContain('/register')
    expect(s).toMatch(/redirect/)
  })
})

describe('Google Auth register — checkbox Syarat dikunci', () => {
  it('register: handleGoogle cek agree sebelum OAuth', () => {
    const s = readPage('register.vue')
    expect(s).toContain('handleGoogle')
    expect(s).toContain('agree')
    expect(s).toMatch(/if\s*\(\s*!agree\.value\s*\)/)
  })
})
