<!-- pages/mall/index.vue → GET /mall (Index direktori hub, D1 Mall Hub Netral ⭐ + S2b infinity).
APA: list kartu mall (nama + area + jumlah tenant) + 2 CTA per kartu (Lihat Tenant / Cariin yang cocok), label mall INK (#0C0A09), CTA "Cariin" rose (#E11D48), bg paper (#F5F5F4) + infinity scroll 10/page (sentinel + skeleton 2 row + sticky count).
KENAPA: D1 "Mall Hub · Netral" + S2b infinity — 5 mall sekarang ringan, tapi pola SAMA dengan detail (40 tenant) → 1 composable useInfiniteList, API backward-compat (tanpa ?limit = array legacy). Risiko rendah (token udah lock), SEO tetap (SSR page-1 via await start()).
Token lock: ink tetap #0C0A09, rose tetap #E11D48, paper tetap #F5F5F4. -->
<script setup lang="ts">
import { getMallName, getMallShortLabel, shortArea } from '~/utils/quiz-logic'
import { useInfiniteList } from '~/composables/useInfiniteList'

interface MallItem {
  slug: string
  name: string
  city?: string
  area?: string
  total_tenant?: number
}

// SEO hub: /mall = pintu masuk direktori (hub → 5 leaf /mall/:slug, Google suka struktur ini).
useHead({
  title: 'Direktori Kuliner Mall Jakarta — Wikendo',
  meta: [
    { name: 'description', content: 'Direktori kuliner curated 5 mall Jakarta: Grand Indonesia, Central Park, Kokas, PIM, Aeon BSD. Males scroll? Quiz 20 detik → 5 tenant + voucher.' }
  ]
})

// S2b infinity: page-1 SSR (await start, SEO tetap), lanjut client via sentinel.
const list = useInfiniteList<MallItem>({
  pageSize: 10,
  keyOf: m => m.slug,
  fetchPage: (limit, offset) => $fetch('/api/malls', { params: { limit, offset } })
})
await list.start()
const { items: malls, total: _total, hasMore, pending, loadingMore, error } = list

const sentinel = ref<HTMLDivElement | null>(null)
let observer: IntersectionObserver | null = null
onMounted(() => {
  if (!('IntersectionObserver' in window)) return
  observer = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) list.loadMore()
  }, { rootMargin: '320px' })
  if (sentinel.value) observer.observe(sentinel.value)
})
onUnmounted(() => observer?.disconnect())
// Sentinel pindah tiap page baru → observe ulang.
watch(sentinel, (el, _, onCleanup) => {
  if (el && observer) observer.observe(el)
  onCleanup(() => {
    if (el && observer) observer.unobserve(el)
  })
})

function mallName(slug: string) {
  return getMallName(slug)
}
function shortLabel(slug: string) {
  return getMallShortLabel(slug)
}
// D1 1:1: area pendek segmen '/' terpendek (Thamrin, Grogol), fallback city.
function mallArea(m: MallItem) {
  return shortArea(m.area || m.city || '')
}
function refresh() {
  return list.reset()
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 pb-10" style="background:#F5F5F4">
    <p class="text-xs text-gray-500 pt-3 mb-1">Home / Mall</p>
    <div class="flex justify-between items-center sticky top-0 py-2" style="background:#F5F5F4">
      <h1 class="text-xl font-extrabold">🏢 Mall</h1>
      <span class="text-xs font-bold text-gray-500">{{ pending ? '…' : '5 mall' }}</span>
    </div>

    <p class="text-[13px] text-gray-500">Pilih mall → direktori tenant curated · tanpa login/quota</p>

    <AppLoader v-if="pending" variant="mall" />
    <div v-else-if="error" class="rounded-2xl p-4 text-sm font-bold mt-3" style="background:#fef2f2;border:1px solid #fecaca;color:#991b1b">
      Gagal muat mall.<br><button class="underline mt-1 disabled:opacity-60" :disabled="pending" @click="refresh()">Coba lagi →</button>
    </div>
    <div v-else class="flex flex-col gap-2.5 mt-3">
      <div v-for="m in malls" :key="m.slug" class="bg-white rounded-2xl border border-gray-100 p-4">
        <div class="flex justify-between items-center">
          <div>
            <b class="text-[15px]">{{ mallName(m.slug) }}</b>
            <p class="text-xs text-gray-500">{{ mallArea(m) }} · {{ m.total_tenant ? m.total_tenant + ' tenant' : '40 tenant' }}</p>
          </div>
          <span class="text-[11px] font-extrabold px-2.5 py-1 rounded-full" style="background:#0C0A09;color:#fff">{{ shortLabel(m.slug) }}</span>
        </div>
        <div class="flex gap-2 mt-3">
          <NuxtLink :to="`/mall/${m.slug}`" class="flex-1 text-center bg-white rounded-[14px] p-3 font-extrabold text-[13px] border-2 border-gray-200" style="min-height:56px">
            🏢 Lihat Tenant →
          </NuxtLink>
          <NuxtLink :to="`/makan?mall=${m.slug}`" class="flex-1 text-center text-white rounded-[14px] p-3 font-extrabold text-[13px]" style="background:#E11D48;min-height:56px">
            ✨ Carlin →
          </NuxtLink>
        </div>
      </div>
      <!-- Skeleton 2 row pas nambah page (S2b spec) -->
      <div v-if="loadingMore" class="flex flex-col gap-2.5" aria-live="polite">
        <div v-for="i in 2" :key="i" class="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
          <div class="h-4 rounded w-2/3" style="background:#F5F5F4" />
          <div class="h-3 rounded w-1/3 mt-2" style="background:#F5F5F4" />
        </div>
      </div>
      <!-- Sentinel infinity scroll -->
      <div v-if="hasMore" ref="sentinel" class="text-center text-xs text-gray-400 py-3">Muat mall berikut…</div>
      <p v-else-if="malls.length" class="text-center text-xs text-gray-400 py-2">Semua {{ malls.length }} mall tampil ✅</p>
    </div>
  </div>
</template>
