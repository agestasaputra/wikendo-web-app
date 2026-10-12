/**
 * composables/useVoucher.ts — Wiring klaim voucher V13B ke POST /api/voucher/claim.
 *
 * APA: claimVoucher(code) + state claiming/claimedCode/claimError, pakai Bearer
 *   token Supabase browser (anon key, aman ke browser).
 * KENAPA file ini ada: result-makan.vue butuh 1 sumber kebenaran wiring API
 *   (dipakai sheet 3 row), bukan duplikat $fetch per row. Service key tetap
 *   server-only di server/utils/db.ts — browser cuma kirim Bearer user.
 * Contoh: const { claiming, claimVoucher } = useVoucher()
 *   await claimVoucher('WKD-7X2K9A') // → { claim_code, expires_at, time_remaining }
 */
import { supabaseBrowser } from '~/utils/supabase'

export interface VoucherClaimResult {
  status: string
  claim_code: string
  expires_at: string
  voucher: { name: string; discount_percent: number }
  time_remaining: { hours: number; minutes: number; expired: boolean }
}

export function useVoucher() {
  const claiming = useState<boolean>('voucher-claiming', () => false)
  const claimedCode = useState<string>('voucher-claimed-code', () => '')
  const claimError = useState<string>('voucher-claim-error', () => '')

  async function claimVoucher(code: string): Promise<VoucherClaimResult> {
    // UX lock: early-return guard anti double-klik (keyboard Enter bypass :disabled).
    if (claiming.value) return { status: 'busy', claim_code: claimedCode.value, expires_at: '', voucher: { name: '', discount_percent: 0 }, time_remaining: { hours: 0, minutes: 0, expired: false } }
    claiming.value = true
    claimError.value = ''
    try {
      const sb = supabaseBrowser()
      const { data } = await sb.auth.getSession()
      const token = data.session?.access_token || ''
      const res = await $fetch<VoucherClaimResult>('/api/voucher/claim', {
        method: 'POST',
        body: { voucher_code: code },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      claimedCode.value = res.claim_code
      return res
    } catch (e: unknown) {
      const msg = (e as { data?: { message?: string }; message?: string })?.data?.message || (e as { message?: string })?.message || 'Gagal klaim. Coba lagi.'
      claimError.value = String(msg)
      throw e
    } finally {
      claiming.value = false
    }
  }

  return { claiming, claimedCode, claimError, claimVoucher }
}
