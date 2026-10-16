/**
 * server/utils/llm.ts — Client LLM (server-only, Opsi 2 CF direct + hermes fallback).
 *
 * APA: callLLM() = POST generik ke /v1/chat/completions; generateTempat() & rankTenants()
 * = wrapper prompt spesifik per mode.
 * KENAPA hemat: kandidat selalu difilter di Supabase DULU (gratis, max 30 rows) → LLM
 * cuma ranking + 1 kalimat reason. LLM tidak pernah list dari nol.
 * Prompt system memaksa LLM balas JSON VALID saja (tanpa disclaimer) supaya JSON.parse langsung.
 * Timeout 15 detik, max_tokens 2000 — kalau timeout/error, handler API yang panggil yang balas 500.
 * OPSI 2 (11 Okt 2026): prod Vercel tak bisa ke localhost:20128 → callLLM pilih provider
 * via pickLLMProvider(): CF Workers AI langsung kalau env CF ada (prod), hermes-combo
 * localhost kalau CF kosong (dev lokal). Endpoint CF OpenAI-compatible → ganti baseURL doang.
 */
import type { QuizTempatInput, TempatRecommendation, QuizMakanInput, TenantRow, RankResult, LLMChatResponse } from '~/types'
import { pickLLMProvider, parseRankResults, parseTempatResults, buildRankFallback, coerceBool } from '../../utils/quiz-logic'

const TEMPAT_SYSTEM = `Kamu asisten rekomendasi weekend Jabodetabek. Balas HANYA JSON valid: {"recommendations":[{"name":"...","category":"...","reason":"... (1 kalimat)","estimated_cost":"Rp ...","location_area":"...","best_time":"...","confidence":"high"}]}. Tepat 5 item, realistis, tanpa disclaimer.`

const MAKAN_SYSTEM = `Kamu asisten ranking tenant mall. Input: daftar kandidat tenant (JSON) + preferensi user. Balas HANYA JSON valid: {"ranking":[{"name":"... (HARUS sama persis dari kandidat)","reason":"... (1 kalimat kenapa cocok)"}]}. Tepat 5 item, urut paling cocok dulu, tanpa disclaimer.`

export async function callLLM(system: string, user: string): Promise<string> {
  const config = useRuntimeConfig()
  const provider = pickLLMProvider({
    cfAccountId: (config.cfAccountId as string) || '',
    cfToken: (config.cfApiToken as string) || '',
    hermesUrl: (config.hermesApiUrl as string) || 'http://127.0.0.1:20128'
  })
  const apiKey = provider.kind === 'cf' ? (config.cfApiToken as string) : (config.hermesApiKey as string)
  const res = await $fetch<LLMChatResponse>(provider.url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: { model: provider.model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0.7, max_tokens: 2000 },
    timeout: 15000
  })
  return res.choices[0].message.content
}

export async function generateTempat(input: QuizTempatInput): Promise<TempatRecommendation[]> {
  const user = `Mood:${input.mood} Teman:${input.companion} Budget:${input.budget} Area:${input.location} Waktu:${input.time || 'fleksibel'}`
  // Retry 1x: LLM non-deterministik, sesekali JSON ngaco → parse throw → coba sekali lagi.
  try {
    const raw = await callLLM(TEMPAT_SYSTEM, user)
    return parseTempatResults(raw)
  } catch {
    const raw2 = await callLLM(TEMPAT_SYSTEM, user)
    return parseTempatResults(raw2)
  }
}

export async function rankTenants(input: QuizMakanInput, candidates: TenantRow[]): Promise<RankResult[]> {
  const halal = coerceBool(input.halal_only)
  const kids = coerceBool(input.kids_friendly)
  const names = candidates.map(c => c.name)
  const ctx = `${input.budget_tier} di ${input.mall_slug}`
  const user = `Preferensi: mall=${input.mall_slug} misi=${input.mission} budget=${input.budget_tier} rombongan=${input.companion} halal_only=${halal} kids=${kids}\nKandidat:\n${JSON.stringify(candidates.slice(0, 30))}`
  // Retry 1x lalu fallback deterministik (jaminan: makan TIDAK PERNAH 500 lagi).
  try {
    const raw = await callLLM(MAKAN_SYSTEM, user)
    return parseRankResults(raw, names)
  } catch {
    try {
      const raw2 = await callLLM(MAKAN_SYSTEM, user)
      return parseRankResults(raw2, names)
    } catch {
      return buildRankFallback(candidates, ctx)
    }
  }
}
