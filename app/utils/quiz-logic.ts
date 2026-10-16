/**
 * quiz-logic.ts — Logic murni quiz & direktori (tidak ada dependensi Vue/Nuxt).
 *
 * KENAPA file ini ada:
 * Logic seperti progress bar, pre-fill mall, search, dan Maps URL dipakai di
 * beberapa pages (quiz.vue, makan.vue, mall/[slug].vue, recommend.post.ts).
 * Ditaruh di sini (bukan duplikat di tiap file) supaya:
 * 1. Satu sumber kebenaran — ubah sekali, berlaku di mana-mana.
 * 2. Bisa di-unit-test tanpa browser/Nuxt (vitest langsung import file ini).
 *
 * ATURAN: fungsi di sini harus PURE (input → output, tanpa side effect,
 * tanpa baca route/cookie/DB). Side effect tetap di pages/server.
 */
import type { QuotaStatus, QuotaStatusInput, LoaderMeta, LoaderVariant, WalletLabel, QuizFlow, QuizHeaderMeta, VoucherStyle, VoucherCardMeta, HomeHeroMeta, ResultTempatMeta, ResultMakanMeta, TenantCardMeta, RankResult as RankResultType, TempatRecommendation as TempatRecType } from '../types'

export function progressPercent(step: number, total: number): number {
  return ((step + 1) / total) * 100
}

export function isLastStep(step: number, total: number): boolean {
  return step >= total - 1
}

/**
 * Tentukan step awal quiz makan. Dipakai di makan.vue:
 * kalau user datang dari direktori (?mall=slug-valid), Q1 (pilih mall) di-skip.
 */
export function getMakanStartStep(
  mallQuery: string | undefined,
  validSlugs: string[]
): number {
  return mallQuery && validSlugs.includes(mallQuery) ? 1 : 0
}

/** Search client-side di direktori mall. Case-insensitive. */
export function filterTenantsByKeyword<T extends { name: string }>(
  tenants: T[],
  keyword: string
): T[] {
  const kw = keyword.toLowerCase()
  return tenants.filter(t => t.name.toLowerCase().includes(kw))
}

/** Bikin link Google Maps buat 1 tenant. Dipakai di recommend.post.ts. */
export function buildMapsUrl(tenantName: string, mallSlug: string): string {
  return (
    'https://www.google.com/maps/search/'
    + encodeURIComponent(`${tenantName} ${mallSlug}`)
  )
}

/* ── Quota split v1.3 (Addendum 09) ─────────────────────────────
 * KENAPA di sini (pure): parsing cookie + bangun response quota split
 * dipakai server + pages wallet 2-state. Tanpa baca cookie/DB langsung —
 * caller yang baca cookie lalu passing string/angka ke sini.
 * Kontrak response persis GET /api/quota v1.1 di docs/05-API-Specification.md.
 * Contoh: buildQuotaStatus({ tempatUsed: 0, makanUsed: 1, isLoggedIn: false })
 */

/** Cookie `quota_used` (tempat, anon 1x) → 0|1. Nilai ngaco = 0 (aman). */
export function parseAnonTempatUsed(cookieValue: string | undefined): number {
  return cookieValue === '1' ? 1 : 0
}

/** Cookie `makan_quota_used` (makan, anon 2x) → 0|1|2. Dijepit 0–2, ngaco = 0. */
export function parseAnonMakanUsed(cookieValue: string | undefined): number {
  const n = parseInt(cookieValue || '0', 10)
  if (Number.isNaN(n) || n <= 0) return 0
  return Math.min(n, 2)
}

/** Bangun response quota split: anon (1+2 + login_cta) vs register (2+5). */
export function buildQuotaStatus(input: QuotaStatusInput): QuotaStatus {
  if (!input.isLoggedIn) {
    return {
      tempat: { used: input.tempatUsed, limit: 1, remaining: 1 - input.tempatUsed },
      makan: { used: input.makanUsed, limit: 2, remaining: 2 - input.makanUsed },
      is_logged_in: false,
      reset_at: null,
      login_cta: 'Login gratis → buka 2 tempat + 5 makan/hari'
    }
  }
  return {
    tempat: { used: input.tempatUsed, limit: 2, remaining: 2 - input.tempatUsed },
    makan: { used: input.makanUsed, limit: 5, remaining: 5 - input.makanUsed },
    is_logged_in: true,
    reset_at: input.resetAt ?? null
  }
}

/** Momen wall #1 tempat: anon yang used>=1 (generate ke-2 dikunci). Register bukan wall. */
export function isTempatLoginWall(used: number, isLoggedIn: boolean): boolean {
  return !isLoggedIn && used >= 1
}

/** Momen wall #1 makan: anon yang used>=2 (generate ke-3 dikunci). Register bukan wall. */
export function isMakanLoginWall(used: number, isLoggedIn: boolean): boolean {
  return !isLoggedIn && used >= 2
}

/* ── Wallet label home (index.vue) ─────────────────────────────────
 * KENAPA di sini (pure): wallet home tadinya static "2 tempat • 5 makan"
 * (limit REGISTER) padahal user sekarang anon → scarcity bohong.
 * QuotaStatus (dari GET /api/quota) → label jujur ikut sisa.
 * exhausted = momen login CTA. Tanpa baca API/cookies langsung.
 * Contoh: buildWalletLabel(buildQuotaStatus({tempatUsed:0,makanUsed:0,isLoggedIn:false}))
 * → { headline: '1 tempat • 2 makan', ... }.
 */

/** QuotaStatus → label wallet: headline sisa + chip "sisa/limit" + flag habis. */
export function buildWalletLabel(status: QuotaStatus): WalletLabel {
  const t = status.tempat.remaining
  const m = status.makan.remaining
  return {
    headline: `${t} tempat • ${m} makan`,
    tempatChip: `${t}/${status.tempat.limit} tempat`,
    makanChip: `${m}/${status.makan.limit} makan`,
    exhausted: t <= 0 && m <= 0
  }
}

/* ── Auth gate v1.3 (Addendum 09) ─────────────────────────────────
 * KENAPA di sini (pure): normalisasi phone + validasi format + format
 * kode voucher + wall momen #2-4 dipakai server (register/claim) +
 * pages (bottom sheet login). Tanpa baca auth/DB langsung.
 * Kontrak: API §register (phone optional) + §16 claim (WIK-XXXXX) +
 * Journey (4 momen wall). Contoh: normalizePhone('  ') → null.
 */

/** API §register: trim input HP, kosong/undefined → null (skip = valid). */
export function normalizePhone(input: string | undefined): string | null {
  const trimmed = (input || '').trim()
  return trimmed ? trimmed : null
}

/**
 * Schema CHECK `phone IS NULL OR phone ~ '^\+62[0-9]{9,13}$'`:
 * null/undefined/kosong = true (skip), isi wajib format +62.
 */
export function isPhoneValid(phone: string | null | undefined): boolean {
  if (phone === null || phone === undefined || phone === '') return true
  return /^\+62[0-9]{9,13}$/.test(phone)
}

/** API §16: kode klaim `WIK-XXXXX` (5 char A-Z/0-9 uppercase). */
export function isVoucherCodeValid(code: string | undefined): boolean {
  return typeof code === 'string' && /^WIK-[A-Z0-9]{5}$/.test(code)
}

/** Generate kode klaim baru `WIK-XXXXX` (random A-Z/0-9, tanpa I/O biar testable). */
export function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 5; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `WIK-${suffix}`
}

/** Momen wall #2: tap Simpan — anon dikunci, login lolos. */
export function isSaveLoginWall(isLoggedIn: boolean): boolean {
  return !isLoggedIn
}

/** Momen wall #3a: buka Wishlist — anon dikunci, login lolos. */
export function isWishlistLoginWall(isLoggedIn: boolean): boolean {
  return !isLoggedIn
}

/** Momen wall #3b: buka Riwayat — anon dikunci, login lolos. */
export function isHistoryLoginWall(isLoggedIn: boolean): boolean {
  return !isLoggedIn
}

/** Momen wall #4: klaim voucher WAJIB login (anon → 401, anti-farming). */
export function isVoucherClaimWall(isLoggedIn: boolean): boolean {
  return !isLoggedIn
}

/* ── Loader spinner fetching API ───────────────────────────────────
 * KENAPA di sini (pure): warna aksen + pesan per variant dipakai komponen
 * AppLoader di 3 pages (result, result-makan, mall/[slug]) → 1 sumber
 * kebenaran, bukan hardcode warna di tiap page. Tanpa baca route/state.
 * Contoh: getLoaderMeta('makan').accent → '#ee2c4b'.
 */

/** Meta spinner per variant: warna aksen + judul + hint. Variant ngaco = fallback mall (aman). */
export function getLoaderMeta(variant: LoaderVariant): LoaderMeta {
  if (variant === 'tempat') {
    return { accent: '#f97316', title: 'Lagi cariin tempat yang cocok…', hint: 'LLM lagi ranking 5 tempat • 30–45 detik' }
  }
  if (variant === 'makan') {
    return { accent: '#ee2c4b', title: 'Lagi cariin tenant yang cocok…', hint: 'Filter tenant + ranking LLM • 20 detik' }
  }
  return { accent: '#0e7490', title: 'Lagi muat tenant…', hint: 'Direktori mall • tanpa LLM, bentar doang' }
}

/* ── Nama mall (direktori + quiz makan) ────────────────────────────
 * KENAPA di sini (pure): mapping slug→nama dipakai 3 tempat
 * (mall/index.vue, mall/[slug].vue, result-makan.vue) → 1 sumber
 * kebenaran. Mall ke-6 = tambah 1 entry di 2 map ini. Tanpa baca route/DB.
 * Contoh: getMallShortLabel('grand-indonesia') → 'GI'.
 */

const MALL_NAMES: Record<string, string> = {
  'grand-indonesia': 'Grand Indonesia',
  'central-park': 'Central Park',
  'kota-kasablanka': 'Kota Kasablanka',
  'pondok-indah-mall': 'Pondok Indah Mall',
  'aeon-bsd': 'Aeon BSD'
}

const MALL_SHORT_LABELS: Record<string, string> = {
  'grand-indonesia': 'GI',
  'central-park': 'CP',
  'kota-kasablanka': 'Kokas',
  'pondok-indah-mall': 'PIM',
  'aeon-bsd': 'Aeon'
}

/** Slug → nama lengkap. Slug ngaco = fallback slug as-is (tidak crash). */
export function getMallName(slug: string): string {
  return MALL_NAMES[slug] || slug
}

/** Slug → label pendek chip (GI, CP, Kokas, PIM, Aeon). Ngaco = fallback slug. */
export function getMallShortLabel(slug: string): string {
  return MALL_SHORT_LABELS[slug] || slug
}

/* ── Header quiz Q2d/M3d + voucher V12 (board v7, gas Q2d+M3d+V12) ──
 * KENAPA di sini (pure): meta header quiz (label putih + dot ember/rose-terang,
 * segmen lime, selected ember vs rose) dipakai 2 pages (quiz.vue + makan.vue)
 * → 1 sumber kebenaran, bukan hardcode hex di tiap page.
 * Tanpa baca route/state. Contoh: getQuizHeaderMeta('tempat').dot → '#FB923C'.
 */

/** Meta header quiz per flow: label putih + dot + segmen lime + selected split. */
export function getQuizHeaderMeta(flow: QuizFlow): QuizHeaderMeta {
  const base = {
    labelColor: '#fff',
    questionColor: '#fff',
    headBg: '#0C0A09',
    segOn: '#A3E635'
  }
  if (flow === 'makan') {
    return {
      ...base,
      label: 'QUIZ MAKAN',
      dot: '#FDA4AF',
      selBorder: '#E11D48',
      selBg: '#FFE4E6'
    }
  }
  return {
    ...base,
    label: 'QUIZ TEMPAT',
    dot: '#FB923C',
    selBorder: '#EA580C',
    selBg: '#FFF7ED'
  }
}

/** Segmen blok quiz: index < step+1 = nyala. Contoh: getQuizSegState(0,5) → [T,F,F,F,F]. */
export function getQuizSegState(step: number, total: number): boolean[] {
  return Array.from({ length: total }, (_, i) => i <= step)
}

/** Meta kartu voucher: gift = V12 gift surprise (grad cream-rose + pill rose). */
export function getVoucherCardMeta(style: VoucherStyle): VoucherCardMeta {
  void style
  return {
    bg: 'linear-gradient(140deg,#FFF7ED,#FFE4E6)',
    border: '#FECDD3',
    goBg: '#E11D48',
    goColor: '#fff'
  }
}

/* ── Hero home I17 V2 Ember P1 (slicing full dari screenshot V2) ────
 * KENAPA di sini (pure): token hero home (ink + strip ember + angka lime
 * + pill lime + CTA ink + page paper + badge mint) dipakai pages/index.vue
 * → 1 sumber kebenaran, bukan hardcode hex di template.
 * Tanpa baca route/state. Contoh: getHomeHeroMeta().strip → '#EA580C'.
 */

/** Meta hero home: I17 V2 Ember P1 lock (strip ember, bukan orange I2). */
export function getHomeHeroMeta(): HomeHeroMeta {
  return {
    headBg: '#0C0A09',
    strip: '#EA580C',
    numColor: '#D9F99D',
    pillBg: '#A3E635',
    pillColor: '#0C0A09',
    ctaBg: '#0C0A09',
    ctaColor: '#fff',
    pageBg: '#F5F5F4',
    cardBg: '#fff',
    tagBg: '#ECFDF5',
    tagColor: '#047857'
  }
}

/* ── Infinity scroll S2b (list mall + detail mall) ────────────────
 * KENAPA di sini (pure): math paging limit/offset + hasMore +
 * append-dedupe dipakai 2 pages (mall/index, mall/[slug]) + 2 API
 * (malls, tenants) + composable useInfiniteList → 1 sumber kebenaran,
 * bukan duplikat math di tiap file. Tanpa baca route/DB.
 * Spec S2b: 10/page, backward-compat (tanpa ?limit = array legacy 40).
 * Contoh: parsePaginationParams({ limit: '10', offset: '20' }) → { limit: 10, offset: 20 }.
 */

/** Default 10/page (S2b) + max 50 (anti-abuse full dump). */
export const INFINITE_DEFAULT_LIMIT = 10
export const INFINITE_MAX_LIMIT = 50

/** ?limit & ?offset (string|array|absen) → angka aman. Ngaco/negatif/nol → default/0. */
export function parsePaginationParams(
  query: Record<string, unknown>,
  defaultLimit: number = INFINITE_DEFAULT_LIMIT
): { limit: number, offset: number } {
  const rawLimit = Array.isArray(query.limit) ? query.limit[0] : query.limit
  const rawOffset = Array.isArray(query.offset) ? query.offset[0] : query.offset
  let limit = parseInt(String(rawLimit ?? ''), 10)
  if (Number.isNaN(limit) || limit <= 0) limit = defaultLimit
  limit = Math.min(limit, INFINITE_MAX_LIMIT)
  let offset = parseInt(String(rawOffset ?? ''), 10)
  if (Number.isNaN(offset) || offset < 0) offset = 0
  return { limit, offset }
}

/** Masih ada page berikut? loaded < total. Contoh: hasMorePages(10, 40) → true. */
export function hasMorePages(loaded: number, total: number): boolean {
  return loaded < total
}

/** Gabung page baru ke list lama, dedupe by key (overlap refetch tidak ganda). */
export function mergePageItems<T>(prev: T[], next: T[], keyOf: (item: T) => string | number): T[] {
  const seen = new Set<string | number>(prev.map(keyOf))
  const out = [...prev]
  for (const item of next) {
    const k = keyOf(item)
    if (!seen.has(k)) {
      seen.add(k)
      out.push(item)
    }
  }
  return out
}

/* ── Meta kartu result R3b + F1b (slicing 1:1 dari 3 screenshot) ──
 * KENAPA di sini (pure): token kartu result dipakai 2 pages (result.vue R3b
 * photo+lime + result-makan.vue F1b tiket) → 1 sumber kebenaran, bukan
 * hardcode hex di template. Token lock Agesta: lime=nilai, ember=strip,
 * ink=aksi, F1b tiket dashed + benefit gede + pill Klaim kecil.
 * Contoh: getResultTempatMeta().strip → '#EA580C'.
 */

/** Meta kartu result tempat R3b: strip ember + best lime + aksi ink. */
export function getResultTempatMeta(): ResultTempatMeta {
  return {
    strip: '#EA580C',
    bestBg: '#A3E635',
    bestColor: '#0C0A09',
    actionBg: '#0C0A09',
    actionColor: '#fff',
    pageBg: '#F5F5F4',
    cardBg: '#fff',
    moreBg: '#0C0A09',
    moreColor: '#A3E635'
  }
}

/** Meta kartu result makan F1b: tiket ink + diskon lime + Klaim rose + halal mint. */
export function getResultMakanMeta(): ResultMakanMeta {
  return {
    ticketBg: '#0C0A09',
    discountColor: '#A3E635',
    ticketBorder: '#FECDD3',
    claimBg: '#E11D48',
    claimColor: '#fff',
    bestBg: '#A3E635',
    halalBg: '#ECFDF5',
    halalColor: '#047857',
    pageBg: '#F5F5F4',
    cardBg: '#fff'
  }
}

/* ── Slot direktori S2c/D1 1:1 (slicing 8 Okt 2026) ───────────────
 * KENAPA di sini (pure): format area pendek + lantai L-prefix + thumb
 * emoji/warna + badge promo + rating ★ + label halal + pill infinity
 * dipakai 2 pages (mall/index.vue D1 + mall/[slug].vue S2c) → 1 sumber.
 * DB real tanpa kolom rating/promo → rating/promo diturunkan deterministik
 * dari field yang ada (flag adaptasi di PROGRESS, bukan data bohong).
 * Contoh: shortArea('Thamrin / Menteng') → 'Thamrin'.
 */

/** Area full → pendek 1:1 D1: segmen '/' terpendek (Thamrin, Grogol). Kosong → ''. */
export function shortArea(area: string | undefined): string {
  if (!area) return ''
  const segs = area.split('/').map(s => s.trim()).filter(Boolean)
  if (!segs.length) return ''
  let out = segs[0]
  for (const s of segs) {
    if (s.length < out.length) out = s
  }
  return out
}

/** Lantai DB → label kartu S2c: angka prefix L (1→L1, 3A→L3A), kode gedung as-is. */
export function formatLantai(lantai: string): string {
  if (!lantai) return ''
  const t = lantai.trim()
  if (!t) return ''
  if (/^[0-9]/.test(t)) return 'L' + t.toUpperCase()
  return t
}

const CATEGORY_EMOJI: Record<string, string> = {
  kopi: '☕',
  japanese: '🍜',
  ramen: '🍜',
  healthy: '🥗',
  salad: '🥗',
  chinese: '🥟',
  fastfood: '🍔',
  western: '🥩',
  indonesia: '🍛',
  bakery: '🥐',
  dessert: '🍨',
  minuman: '🧋'
}

const CATEGORY_BG: Record<string, string> = {
  kopi: '#7C2D12',
  japanese: '#1C1917',
  ramen: '#1C1917',
  healthy: '#15803D',
  salad: '#15803D',
  chinese: '#9A3412',
  fastfood: '#B45309',
  western: '#7F1D1D',
  indonesia: '#A16207',
  bakery: '#92400E',
  dessert: '#BE185D',
  minuman: '#0E7490'
}

/** Kategori → thumb emoji S2c (kopi☕, japanese🍜, healthy🥗, fallback🍜). */
export function categoryEmoji(category: string): string {
  if (!category) return '🍜'
  return CATEGORY_EMOJI[category.toLowerCase()] || '🍜'
}

/** Kategori → bg avatar kotak S2c (kopi maroon, japanese charcoal, healthy hijau). */
export function tenantAvatarBg(category: string): string {
  if (!category) return '#44403C'
  return CATEGORY_BG[category.toLowerCase()] || '#44403C'
}

/** hype=true → badge '-20%' hyphen-minus U+002D (1:1 S2c). false/null → null. */
export function tenantPromoBadge(hype: boolean | null): string | null {
  return hype ? '-20%' : null
}

/** Slot rating ★ S2c: deterministik dari nama (hash → 4.7/4.8/4.9), stabil. */
export function tenantRating(name: string): string {
  const s = name || '?'
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997
  return ['4.7', '4.8', '4.9'][h % 3]
}

/** 'Rp 50-90rb' → '50-90rb' (1:1 S2c, tanpa prefix Rp). */
export function priceShort(price: string): string {
  if (!price) return ''
  return price.replace(/^Rp\s*/i, '').trim()
}

/** Label halal S2c: true→✅ Halal, false→⚠️ Non-halal, null→❓. */
export function tenantHalalLabel(halal: boolean | null): string {
  if (halal === true) return '✅ Halal'
  if (halal === false) return '⚠️ Non-halal'
  return '❓'
}

/** Pill infinity S2c: '🟢 10/40 tenant · scroll untuk 10 berikutnya ↓' (middle dot). */
export function buildDirCountLabel(loaded: number, total: number): string {
  return `🟢 ${loaded}/${total} tenant · scroll untuk 10 berikutnya ↓`
}

/** 1 sumber thumb S2c: { emoji, bg } per kategori. */
export function getTenantCardMeta(category: string): TenantCardMeta {
  return { emoji: categoryEmoji(category), bg: tenantAvatarBg(category) }
}

/* ── LLM routing Opsi 2 CF direct (Addendum Opsi 2, 11 Okt 2026) ──
 * KENAPA di sini (pure): prod Vercel tak bisa ke localhost:20128 → 500.
 * Solusi: server Vercel tembak CF Workers AI langsung kalau env CF ada,
 * dev lokal tetap hermes-combo localhost. Pure biar unit-testable.
 * Endpoint OpenAI-compatible: .../ai/v1/chat/completions (ganti baseURL doang).
 * Contoh: buildCfChatUrl('abc123') → 'https://api.cloudflare.com/.../ai/v1/chat/completions'.
 */

/** Account ID → URL chat completions CF (OpenAI-compatible). */
export function buildCfChatUrl(accountId: string): string {
  const id = (accountId || '').trim()
  return `https://api.cloudflare.com/client/v4/accounts/${id}/ai/v1/chat/completions`
}

export interface LLMProvider {
  kind: 'cf' | 'hermes'
  url: string
  model: string
}

/** Pilih provider: CF kalau accountId+token lengkap, hermes fallback (dev lokal). */
export function pickLLMProvider(input: { cfAccountId: string, cfToken: string, hermesUrl: string }): LLMProvider {
  const acc = (input.cfAccountId || '').trim()
  const tok = (input.cfToken || '').trim()
  if (acc && tok) {
    return { kind: 'cf', url: buildCfChatUrl(acc), model: '@cf/meta/llama-3.1-8b-instruct-fast' }
  }
  const base = (input.hermesUrl || 'http://127.0.0.1:20128').replace(/\/$/, '')
  return { kind: 'hermes', url: base + '/v1/chat/completions', model: 'hermes-combo' }
}

/** Strip markdown fence + teks prefix/suffix dari output LLM → JSON murni (anti-500 JSON.parse). */
export function cleanJSON(raw: string): string {
  let s = (raw || '').trim()
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) s = fence[1].trim()
  const start = s.search(/[{[]/)
  if (start > 0) s = s.slice(start).trim()
  // Buang teks trailing setelah JSON (LLM kadang nambah "semoga membantu ya!").
  // KENAPA lastIndexOf: JSON valid berakhir di } / ], sisanya pasti sampah.
  s = s.trim()
  if (s.startsWith('{')) {
    const last = s.lastIndexOf('}')
    if (last > 0) s = s.slice(0, last + 1).trim()
  } else if (s.startsWith('[')) {
    const last = s.lastIndexOf(']')
    if (last > 0) s = s.slice(0, last + 1).trim()
  }
  return s
}

/* ── Anti-flaky makan (11 Okt 2026, malam) ──
 * KENAPA di sini (pure): loop prod 8x → 7×200 + 1×500 generik.
 * Biang: (1) LLM sesekali balas JSON ngaco (key salah / nama halu /
 * truncated) → JSON.parse / mapping meledak → 500; (2) frontend kirim
 * halal_only:"false" (string) → `if (body.halal_only)` truthy → filter
 * halal nyala padahal user tak minta. Pure biar unit-testable.
 * Contoh: coerceBool("false") → false; parseRankResults(raw, cands) throw
 * kalau nama halu → picu retry/fallback di server.
 */

/** Normalisasi boolean dari query string frontend ("false" string → false). */
export function coerceBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    return s === 'true' || s === '1' || s === 'yes' || s === 'y'
  }
  return false
}

/** Validasi ranking LLM → RankResult[5]. Throw kalau key salah / nama halu / JSON rusak (picu retry/fallback). */
export function parseRankResults(raw: string, candidates: string[]): RankResultType[] {
  const obj = JSON.parse(cleanJSON(raw)) as { ranking?: unknown }
  if (!obj || !Array.isArray(obj.ranking)) throw new Error('RANK_SHAPE_INVALID')
  const set = new Set(candidates)
  const out = (obj.ranking as Array<{ name?: unknown, reason?: unknown }>)
    .map(r => ({ name: String(r?.name || ''), reason: String(r?.reason || '') }))
  if (!out.length) throw new Error('RANK_EMPTY')
  for (const r of out) {
    if (!r.name || !set.has(r.name)) throw new Error('RANK_NAME_HALU:' + r.name)
    if (!r.reason) throw new Error('RANK_REASON_EMPTY')
  }
  return out.slice(0, 5)
}

/** Validasi rekomendasi tempat LLM → TempatRecommendation[5]. Throw kalau shape salah. */
export function parseTempatResults(raw: string): TempatRecType[] {
  const obj = JSON.parse(cleanJSON(raw)) as { recommendations?: unknown }
  if (!obj || !Array.isArray(obj.recommendations)) throw new Error('TEMPAT_SHAPE_INVALID')
  const out = obj.recommendations as Array<Record<string, unknown>>
  if (!out.length) throw new Error('TEMPAT_EMPTY')
  for (const r of out) {
    if (typeof r?.name !== 'string' || !r.name) throw new Error('TEMPAT_NAME_INVALID')
  }
  return (out as unknown as TempatRecType[]).slice(0, 5)
}

/** Fallback deterministik nol-LLM: 5 kandidat pertama + reason generik (jaminan anti-500). */
export function buildRankFallback(candidates: Array<{ name: string }>, context: string): RankResultType[] {
  return candidates.slice(0, 5).map(c => ({
    name: c.name,
    reason: `${c.name} cocok untuk ${context} — kandidat teratas yang buka dan sesuai filter.`
  }))
}
