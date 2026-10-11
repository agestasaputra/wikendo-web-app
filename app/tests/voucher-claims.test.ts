import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * voucher-claims.test.ts — TDD Gas v13
 * S1: Auth 401 guard — claim voucher butuh login
 * RED: Test ini GAGAL dulu (feature blum ada), lalu kita bikin server route-nya
 * Setiap eksekusi: npx vitest run tests/voucher-claims.test.ts
 * SOP: Setiap RED→GREEN catat di docs/08-PROGRESS.md NOW+LOG
 */

describe('Voucher Claims — TDD S1: Auth 401 guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when claiming voucher without authentication', async () => {
    // Import the server handler we'll build
    // Currently this import will fail because route belum dibuat → RED by design
    // The test documents the requirement and fails until S3 implements it

    // Panggil endpoint POST /api/voucher/claim tanpa auth
    const result = await fetch('/api/voucher/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voucher_code: 'WKD-7X2K9A',
        mall_slug: 'gi',
        from_mall_page: false,
      }),
    })

    // RED: Awaited value tergantung implementasi server.
    // Belum ada route → Akan error atau 404 → test GAGAL (but that's OK, it's RED)
    // Setelah S3 dikerjakan → mestinya 401 → test PASS
    expect(result.status).toBe(401) // Akan FAIL dulu → RED → kita bikin route
  })
})
