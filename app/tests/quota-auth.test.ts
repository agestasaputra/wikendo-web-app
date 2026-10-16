import { describe, it, expect } from 'vitest'
import {
  parseAnonTempatUsed,
  parseAnonMakanUsed,
  buildQuotaStatus,
  isTempatLoginWall,
  isMakanLoginWall
} from '../utils/quiz-logic'

describe('parseAnonTempatUsed (cookie quota_used → 0|1)', () => {
  it('\'1\' = 1 (jatah anon tempat habis)', () => {
    expect(parseAnonTempatUsed('1')).toBe(1)
  })

  it('undefined = 0 (belum pakai)', () => {
    expect(parseAnonTempatUsed(undefined)).toBe(0)
  })

  it('\'0\' = 0', () => {
    expect(parseAnonTempatUsed('0')).toBe(0)
  })

  it('nilai ngaco = 0 (aman, tidak nge-block)', () => {
    expect(parseAnonTempatUsed('ngaco')).toBe(0)
  })
})

describe('parseAnonMakanUsed (cookie makan_quota_used → 0|1|2)', () => {
  it('undefined = 0', () => {
    expect(parseAnonMakanUsed(undefined)).toBe(0)
  })

  it('\'1\' = 1', () => {
    expect(parseAnonMakanUsed('1')).toBe(1)
  })

  it('\'2\' = 2 (jatah anon makan habis)', () => {
    expect(parseAnonMakanUsed('2')).toBe(2)
  })

  it('\'99\' dijepit ke 2 (clamp, anti-curang cookie)', () => {
    expect(parseAnonMakanUsed('99')).toBe(2)
  })

  it('nilai ngaco = 0', () => {
    expect(parseAnonMakanUsed('ngaco')).toBe(0)
  })
})

describe('buildQuotaStatus (split tempat+makan, kontrak GET /api/quota v1.1)', () => {
  it('anon fresh: tempat 0/1 + makan 0/2 + login_cta', () => {
    expect(buildQuotaStatus({ tempatUsed: 0, makanUsed: 0, isLoggedIn: false })).toEqual({
      tempat: { used: 0, limit: 1, remaining: 1 },
      makan: { used: 0, limit: 2, remaining: 2 },
      is_logged_in: false,
      reset_at: null,
      login_cta: 'Login gratis → buka 2 tempat + 5 makan/hari'
    })
  })

  it('anon tempat habis: remaining tempat 0, makan jalan terus (tidak campur)', () => {
    const s = buildQuotaStatus({ tempatUsed: 1, makanUsed: 1, isLoggedIn: false })
    expect(s.tempat.remaining).toBe(0)
    expect(s.makan).toEqual({ used: 1, limit: 2, remaining: 1 })
  })

  it('register: tempat limit 2 + makan limit 5, tanpa login_cta', () => {
    expect(
      buildQuotaStatus({ tempatUsed: 1, makanUsed: 3, isLoggedIn: true, resetAt: 'RESET' })
    ).toEqual({
      tempat: { used: 1, limit: 2, remaining: 1 },
      makan: { used: 3, limit: 5, remaining: 2 },
      is_logged_in: true,
      reset_at: 'RESET'
    })
  })
})

describe('login wall momen #1 (generate ke-2 tempat / ke-3 makan)', () => {
  it('anon tempat used=1 → wall (generate ke-2 dikunci)', () => {
    expect(isTempatLoginWall(1, false)).toBe(true)
  })

  it('anon tempat used=0 → belum wall', () => {
    expect(isTempatLoginWall(0, false)).toBe(false)
  })

  it('register tempat used=2 → BUKAN wall (quota exhausted, bukan login)', () => {
    expect(isTempatLoginWall(2, true)).toBe(false)
  })

  it('anon makan used=2 → wall (generate ke-3 dikunci)', () => {
    expect(isMakanLoginWall(2, false)).toBe(true)
  })

  it('anon makan used=1 → belum wall', () => {
    expect(isMakanLoginWall(1, false)).toBe(false)
  })

  it('register makan used=5 → BUKAN wall', () => {
    expect(isMakanLoginWall(5, true)).toBe(false)
  })
})
