<!-- pages/result.vue → GET /result (Result TEMPAT deck, R3b Photo + Lime 1:1 screenshot).
APA: header Hasil + 5 rekomendasi + hero photo + badge BEST lime + strip ember + Navigasi ink/Simpan/Share + chips + rank #1-3 + quota note. Base paper #F5F5F4, kartu 24px.
KENAPA R3b 1:1: lime=nilai (best/rating) + ember=strip + ink=aksi (footnote spec), token lock via getResultTempatMeta (1 sumber, tested). Lock Split: TEMPAT saja, 0 tenant. Simpan = login wall momen #2.
Contoh: hero Rooftop Senayan — Senayan 4.8 sunset+live music → Navigasi → chips Lainnya geser deck 1→5 tanpa fetch ulang. -->
<script setup lang="ts">
import type { TempatRecommendation } from '~/types'
import { getResultTempatMeta } from '~/utils/quiz-logic'

const route = useRoute()
const { data, pending, error, refresh } = await useFetch<{ recommendations: TempatRecommendation[], quota_remaining?: number }>('/api/tempat/recommend', {
  method: 'POST',
  body: route.query
})
const list = computed(() => data.value?.recommendations || [])
const idx = ref(0)
const wallNote = ref(false)
const errorMessage = computed(() => getErrorMessage(error.value, 'Gagal generate.'))
const isWall = computed(() => /login/i.test(errorMessage.value) || getErrorStatus(error.value) === 403)
// Quota real: sisa dari response POST (quota_remaining). Anon limit tempat 1x → sukses = 0/1 (habis hari ini, jujur).
const quotaLeft = computed(() => data.value?.quota_remaining)
const quotaLabel = computed(() => isWall.value ? '1/1 habis 🔒' : (quotaLeft.value ?? 1) + '/1')
// R3b token lock (tested): strip ember + best lime + aksi ink + Lainnya ink/lime.
const meta = getResultTempatMeta()
const hero = computed(() => {
  const r = list.value[idx.value] || ({} as TempatRecommendation)
  const area = (r as { location_area?: string }).location_area || '—'
  const short = area.split(',')[0].split(' ')[0].replace(/[^A-Za-z]/g, '').toUpperCase() || 'JKT'
  return { name: r.name || '—', category: r.category || 'tempat', reason: r.reason || '—', cost: (r as { estimated_cost?: string }).estimated_cost || '—', area, areaLabel: short, time: (r as { best_time?: string }).best_time || '—', rating: '4.8', vibe: (r.reason || 'sunset + live music').slice(0, 24), emoji: ['🌇', '☕', '🌳', '🎡', '🌊'][idx.value % 5], bg: ['linear-gradient(140deg,#ffedd5,#fdba74)', 'linear-gradient(140deg,#fef3c7,#fcd34d)', 'linear-gradient(140deg,#dcfce7,#86efac)', 'linear-gradient(140deg,#e0e7ff,#a5b4fc)', 'linear-gradient(140deg,#cffafe,#67e8f9)'][idx.value % 5] }
})
const minis = computed(() => list.value.slice(1, 3).map(r => ((r.name || '').slice(0, 6).trim() + '...')))
const rankTop3 = computed(() => list.value.slice(0, 3))
const mapsUrl = computed(() => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((hero.value.name || '') + ' Jakarta'))
function next() {
  if (list.value.length) idx.value = (idx.value + 1) % list.value.length
}
function share() {
  const t = hero.value.name + ' via Wikendo'
  if (navigator.share) navigator.share({ title: t, text: t, url: location.href }).catch(() => {})
  else {
    navigator.clipboard?.writeText(location.href)
    wallNote.value = true
  }
}

// E1 riwayat: tulis 1 entry ke wikendo_history pas data sukses (guard window + cap 20 + dedupe)
type HistEntryTempat = { kind: 'tempat' | 'makan', title: string, sub: string, at: number }
function pushHistoryTempat() {
  if (typeof window === 'undefined') return
  try {
    const r = list.value[0] as unknown as Record<string, unknown>
    if (!r) return
    const title = String((r as { name?: unknown }).name || '—')
    const sub = String((r as { location_area?: unknown }).location_area || (r as { category?: unknown }).category || '')
    const raw = window.localStorage.getItem('wikendo_history')
    let arr: HistEntryTempat[] = []
    try {
      arr = raw ? (JSON.parse(raw) as HistEntryTempat[]) : []
    } catch { /* ignore parse */ }
    if (!Array.isArray(arr)) arr = []
    if (arr.some(x => x.title === title)) return
    arr.unshift({ kind: 'tempat', title, sub, at: Date.now() })
    if (arr.length > 20) arr = arr.slice(0, 20)
    window.localStorage.setItem('wikendo_history', JSON.stringify(arr))
  } catch { /* ignore storage */ }
}
watch(() => list.value.length, (n) => {
  if (n) pushHistoryTempat()
})
</script>

<template>
  <div class="max-w-md mx-auto px-4 pb-10" :style="{ background: meta.pageBg }">
    <div class="flex justify-between items-center font-bold text-[13px] py-3">
      <NuxtLink to="/" class="font-extrabold">← Hasil 🎉/📍</NuxtLink>
      <span class="text-gray-500">{{ list.length || 5 }} rekomendasi</span>
    </div>
    <p class="text-[11.5px] text-gray-500 -mt-1 mb-2">Quota tempat {{ quotaLabel }}</p>

    <AppLoader v-if="pending" variant="tempat" />
    <div v-else-if="error" class="rounded-2xl p-4 text-sm font-bold" :style="isWall ? 'background:#fff7ed;border:2px solid #f97316;color:#9a3412' : 'background:#fef2f2;border:1px solid #fecaca;color:#991b1b'">
      <template v-if="isWall">🔒 Quota anon habis (1x/hari). Login 10 detik → quota jadi 2x/hari, gratis.<br><NuxtLink to="/" class="underline">Login / balik Home →</NuxtLink></template>
      <template v-else>{{ errorMessage }}<br><button class="underline mt-1 disabled:opacity-60" :disabled="pending" @click="refresh()">Coba lagi → (quota nggak kepotong)</button></template>
    </div>
    <div v-else-if="list.length" class="flex flex-col">
      <!-- R3b hero deck: strip ember kiri + foto + badge BEST lime -->
      <div class="overflow-hidden shadow-lg relative" style="border-radius:24px;border:1px solid #eee" :style="{ background: meta.cardBg }">
        <div class="absolute left-0 top-0 bottom-0 w-[5px]" :style="{ background: meta.strip }" />
        <div class="h-[150px] flex items-center justify-center text-[56px] relative" :style="'background:' + hero.bg">
          <span>{{ hero.emoji }}</span>
          <span class="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-extrabold px-3 py-1 rounded-full whitespace-nowrap" :style="{ background: meta.bestBg, color: meta.bestColor }">★ #1 BEST · {{ hero.areaLabel }} · {{ hero.rating }} ★</span>
        </div>
        <div class="p-[14px_16px]">
          <span class="inline-block text-[11px] font-extrabold px-2.5 py-1 rounded-full mr-1.5 mb-2" :style="{ background: meta.bestBg, color: meta.bestColor }">★ #{{ idx + 1 }}{{ idx === 0 ? ' BEST' : '' }}</span>
          <span class="inline-block text-[11px] font-extrabold px-2.5 py-1 rounded-full mb-2" style="background:#ecfeff;color:#0e7490">⭐ {{ hero.rating }} · {{ hero.vibe }}</span>
          <div class="font-extrabold text-[17px]">{{ hero.name }} — {{ hero.area }}</div>
          <p class="text-[12.5px] text-gray-600 my-1.5">Kenapa cocok: {{ hero.reason }}</p>
          <p class="text-[12.5px]">💰 {{ hero.cost }} · 📍 {{ hero.area }} · ⏰ best {{ hero.time }}</p>
          <div class="flex gap-2.5 mt-3">
            <a :href="mapsUrl" target="_blank" class="flex-1 text-center text-white p-[15px] rounded-2xl font-extrabold text-sm" :style="{ background: meta.actionBg, color: meta.actionColor, minHeight: '56px' }">📍 Navigasi →</a>
            <button class="flex-1 p-[15px] rounded-2xl font-extrabold text-sm bg-white border-2 border-gray-200" title="Login untuk simpan (momen #2)" @click="wallNote = true">💾</button>
            <button class="flex-1 p-[15px] rounded-2xl font-extrabold text-sm bg-white border-2 border-gray-200" @click="share()">⤴</button>
          </div>
          <p v-if="wallNote" class="text-xs text-center mt-2" style="color:#c2410c">🔒 Login 10 detik untuk simpan — quota reset tiap hari, gratis.</p>
        </div>
      </div>
      <!-- chips: 2 preview + Lainnya aktif ink/lime -->
      <div class="flex gap-2 mt-3">
        <div v-for="(r, i) in minis" :key="i" class="flex-1 bg-white border border-gray-200 rounded-[14px] p-2.5 text-center text-xs font-bold text-gray-600 truncate">{{ r }}</div>
        <div class="flex-1 rounded-[14px] p-2.5 text-center text-xs font-extrabold cursor-pointer" :style="{ background: meta.moreBg, color: meta.moreColor }" @click="next()">Lainnya →</div>
      </div>
      <p class="text-xs text-gray-500 mt-2.5 text-center">Kartu {{ idx + 1 }}/{{ list.length }} · generate ulang = quota habis · <u>lihat semua ↓</u></p>
      <!-- rank #1-3 abu + full list -->
      <div class="flex flex-col gap-2 mt-3 rounded-2xl p-3" style="background:#f4f4f5">
        <div v-for="(r, i) in rankTop3" :key="'t' + i" class="text-[12.5px] leading-snug">
          <b>#{{ i + 1 }} {{ r.name }}</b><br>
          <span class="text-gray-500">{{ r.category }} · {{ r.location_area }} · {{ r.reason }}</span>
        </div>
      </div>
      <p class="text-[11px] text-gray-400 text-center mt-2">Lime = nilai (best/rating) · ember = strip · ink = aksi</p>
      <div class="flex flex-col gap-2 mt-3">
        <div v-for="(r, i) in list" :key="i" class="bg-white rounded-2xl border p-4 text-sm">
          <b>#{{ i + 1 }} {{ r.name }}</b> <span class="text-gray-500">[{{ r.category }} · {{ r.location_area }}]</span>
          <p class="text-gray-600 text-[13px] mt-1">💡 {{ r.reason }} · 💰 {{ r.estimated_cost }} · ⏰ {{ r.best_time }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
