/**
 * POST /api/makan/recommend — Generate 5 rekomendasi TENANT (mode Mall).
 * Body: QuizMakanInput (mall_slug, mission, budget_tier, companion, halal_only?, kids_friendly?).
 * Quota MVP: cookie makan_quota_used (anon max 2; habis → 403 MAKAN_QUOTA_EXCEEDED). Terpisah dari quota tempat.
 * Flow: cek quota → mall_slug→mall_id → filter tenants Supabase (is_open + budget/halal/kids,
 * limit 30, GRATIS) → rankTenants() [LLM ranking Top 5] → gabung data tenant + maps_url
 * (buildMapsUrl) → INSERT generations {type:'makan'} → quota +1.
 * ATURAN NULL (tri-state): halal/kids/hype NULL = belum riset. Filter halal_only/kids
 * pakai .eq(true) → NULL otomatis ke-exclude (aman, tidak overclaim). UI tampil ❓.
 * Kosong → 404 ("Tidak ada tenant cocok. Coba ubah filter.").
 */
import { supabaseAdmin } from '../../utils/db'
import { buildMapsUrl, coerceBool } from '../../../utils/quiz-logic'
import type { QuizMakanInput, TenantRow, RankResult } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<QuizMakanInput>(event)
  const used = parseInt(getCookie(event, 'makan_quota_used') || '0')

  if (used >= 2) {
    throw createError({ statusCode: 403, statusMessage: 'MAKAN_QUOTA_EXCEEDED', data: { message: 'Quota makan habis. Login untuk 5x/hari, reset 00:00 WIB.' } })
  }

  const db = supabaseAdmin()
  const { data: mall } = await db.from('malls').select('id').eq('slug', body.mall_slug).single()
  if (!mall) throw createError({ statusCode: 404, statusMessage: 'Mall tidak ditemukan' })

  let q = db.from('tenants').select('*').eq('mall_id', mall.id).eq('is_open', true)
  if (body.budget_tier) q = q.eq('budget_tier', body.budget_tier)
  // coerceBool: frontend kirim "false" (string) via query → truthy bug bikin filter halal nyala.
  if (coerceBool(body.halal_only)) q = q.eq('halal', true)
  if (coerceBool(body.kids_friendly)) q = q.eq('kids_friendly', true)
  const { data } = await q.limit(30)
  const candidates = (data || []) as TenantRow[]
  if (!candidates.length) throw createError({ statusCode: 404, statusMessage: 'Tidak ada tenant cocok. Coba ubah filter.' })

  const { rankTenants } = await import('../../utils/llm')
  const ranking: RankResult[] = await rankTenants(body, candidates)

  const recommendations = ranking.map((r: RankResult) => {
    const t = candidates.find((c: TenantRow) => c.name === r.name) || candidates[0]
    return {
      name: t.name, category: t.category, lantai: t.lantai, halal: t.halal,
      budget_tier: t.budget_tier, price_range: t.price_range,
      kids_friendly: t.kids_friendly, hype_tiktok: t.hype_tiktok,
      reason: r.reason,
      maps_url: buildMapsUrl(t.name, body.mall_slug),
      data_source: t.data_source || 'curated',
      needs_survey: t.needs_survey ?? (t.halal == null || t.kids_friendly == null || t.hype_tiktok == null)
    }
  })

  const sessionId = getCookie(event, 'session_id') || 'anon'
  await db.from('generations').insert({
    session_id: sessionId,
    quiz_input: { ...body, type: 'makan' },
    recommendations
  })
  setCookie(event, 'makan_quota_used', String(used + 1), { maxAge: 86400 })

  return { recommendations, quota_remaining: 2 - (used + 1) }
})
