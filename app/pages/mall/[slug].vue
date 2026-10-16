<!-- pages/mall/[slug].vue → GET /mall/:slug (Direktori SEO, S2c Foto Tenant + S2b infinity).
APA: search + filter chip (halal/budget/misi) + kartu tenant foto + CTA quiz pre-filled, thumb 46px + badge promo overlay, bg paper #F5F5F4 + infinity 10/page (sentinel + skeleton 2 row + sticky count "10/40").
KENAPA: S2b infinity — 40 tenant sekaligus berat di HP kentang → 10/page, SSR page-1 tetap (SEO aman), lanjut client. CTA quiz + search + chips STICKY biar nggak kelempar scroll. Filter server-side (reset page); keyword client-side di atas item termuat (spec S2b: filtered = keyword(client) + page(server)).
Token lock: ink tetap #0C0A09, rose tetap #E11D48, paper tetap #F5F5F4. -->
<script setup lang="ts">
import { buildDirCountLabel, filterTenantsByKeyword, formatLantai, getMallName, getMallShortLabel, getTenantCardMeta, tenantHalalLabel, tenantPromoBadge, tenantRating } from '~/utils/quiz-logic'
import { useInfiniteList } from '~/composables/useInfiniteList'

interface TenantItem {
  name: string
  cat?: string
  category?: string
  lantai?: string
  price?: string
  price_range?: string
  mission?: string[]
  halal?: boolean | null
  hype_tiktok?: boolean | null
  needs_survey?: boolean
  promo?: string
  budget_tier?: string
  emoji?: string
}

const route = useRoute()
const slug = route.params.slug as string
const mallName = computed(() => getMallName(slug))
// S2c 1:1: breadcrumb short label (GI), bukan slug mentah.
const mallShort = computed(() => getMallShortLabel(slug))
const keyword = ref('')
const fHalal = ref(false)
const fBudget = ref(false)
const fMission = ref(false)

// SEO direktori: title + description per-mall (funnel Google → tenant → quiz).
useHead({
  title: `Direktori Kuliner ${mallName.value} — Wikendo`,
  meta: [
    { name: 'description', content: `List tenant ${mallName.value} curated: halal, budget, kids-friendly. Males scroll? Quiz 20 detik → 5 tenant + voucher.` }
  ]
})

// S2b infinity: filter server-side (reset page), keyword client-side (spec: keyword(client) + page(server)).
const list = useInfiniteList<TenantItem>({
  pageSize: 10,
  keyOf: t => t.name,
  fetchPage: (limit, offset) => $fetch(`/api/malls/${slug}/tenants`, {
    params: {
      limit,
      offset,
      ...(fHalal.value ? { halal: 'true' } : {}),
      ...(fBudget.value ? { budget: 'menengah' } : {}),
      ...(fMission.value ? { mission: 'nongkrong_lama' } : {})
    }
  })
})
await list.start()
const { items: tenants, total, hasMore, pending, loadingMore, error } = list

function reload() {
  return list.reset()
}

// S2c 1:1 kartu tenant (helper tested, slot dirender persis mock + deterministik).
function tenantCat(t: TenantItem) {
  return t.cat || t.category || ''
}
function tenantEmoji(t: TenantItem) {
  return getTenantCardMeta(tenantCat(t)).emoji
}
function tenantBg(t: TenantItem) {
  return getTenantCardMeta(tenantCat(t)).bg
}
function tenantFloor(t: TenantItem) {
  return formatLantai(t.lantai || '')
}
function tenantPromo(t: TenantItem) {
  return t.promo || tenantPromoBadge(t.hype_tiktok ?? null)
}
function tenantRate(t: TenantItem) {
  return tenantRating(t.name || '')
}
function tenantHalal(t: TenantItem) {
  return t.halal === true ? '✅ Halal' : t.halal === false ? '⚠️ Non-halal' : tenantHalalLabel(t.halal ?? null)
}
// Pill infinity S2c 1:1 (tested): 🟢 loaded/total tenant · scroll ↓
const dirCount = computed(() => buildDirCountLabel(tenants.value.length, total.value || tenants.value.length))

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

const filtered = computed(() => filterTenantsByKeyword(tenants.value, keyword.value))
// V13C strip promo (Addendum 23 v1.1): daftar tenant yang ADA badge promo real.
// KENAPA computed terpisah dari filtered: strip tampil di atas (discovery),
// list bawah tetap ikut keyword. Slice 3 biar hemat HP kentang.
const promoStrip = computed(() => tenants.value.filter(t => !!tenantPromo(t)).slice(0, 3))
</script>

<template>
  <div class="max-w-md mx-auto px-4 pb-10" style="background:#F5F5F4">
    <p class="text-xs text-gray-500 pt-3 mb-1">Home / Mall / {{ mallShort }}</p>
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-extrabold">🏢 {{ mallName }}</h1>
      <span class="text-xs font-bold text-gray-500">{{ pending ? '…' : `${total || tenants.length} tenant` }}</span>
    </div>

    <p class="text-[13px] text-gray-500">Direktori kuliner curated · tanpa login/quota</p>

    <!-- Sticky: search + chips + CTA (S2b spec: nggak kelempar scroll) -->
    <div class="sticky top-0 pt-2 pb-2" style="background:#F5F5F4">
      <div class="bg-white border border-[#e4e4e7] rounded-xl px-3.5 py-2.5 text-[13px] text-gray-500 flex gap-2 items-center">
        🔍 <input v-model="keyword" placeholder="Cari tenant... mis. kopi, ramen" class="bg-transparent outline-none flex-1 text-ink placeholder:text-gray-400">
      </div>

      <!-- Filter chip (S2c 1:1 = 3 chip): halal + budget + nongkrong. Server-side via query, ganti filter = reset page. -->
      <div class="flex gap-1.5 flex-wrap my-2.5">
        <button :disabled="pending" class="text-[11.5px] font-bold rounded-full px-3 py-1.5 bg-white border-[1.5px] disabled:opacity-60" :style="fHalal ? 'background:#18181b;color:#fff;border-color:#18181b' : 'border-color:#e4e4e7'" @click="fHalal = !fHalal; reload()">✅ Halal</button>
        <button :disabled="pending" class="text-[11.5px] font-bold rounded-full px-3 py-1.5 bg-white border-[1.5px] disabled:opacity-60" :style="fBudget ? 'background:#18181b;color:#fff;border-color:#18181b' : 'border-color:#e4e4e7'" @click="fBudget = !fBudget; reload()">💰 50-100rb</button>
        <button :disabled="pending" class="text-[11.5px] font-bold rounded-full px-3 py-1.5 bg-white border-[1.5px] disabled:opacity-60" :style="fMission ? 'background:#18181b;color:#fff;border-color:#18181b' : 'border-color:#e4e4e7'" @click="fMission = !fMission; reload()">☕ Nongkrong</button>
      </div>

      <!-- CTA jembatan direktori → quiz (S2c KARTU ASISTEN: strip lime + avatar ink-lime + 2 baris + panah) -->
      <NuxtLink :to="`/makan?mall=${slug}`" class="block rounded-[14px] p-3.5 bg-white border border-gray-100 mt-1" style="border-left:4px solid #A3E635">
        <div class="flex gap-2.5 items-center">
          <div class="w-9 h-9 flex-none rounded-full flex items-center justify-center text-[16px]" style="background:#0C0A09">🤖</div>
          <div class="flex-1 text-[13px] leading-snug">
            <b>Ceritain mau makan apa →</b><br>
            <small class="text-gray-500">quiz 20 dtk · tanpa login · hasil murni {{ mallShort }}</small>
          </div>
          <div class="font-extrabold">→</div>
        </div>
      </NuxtLink>
    </div>

    <!-- Pill count infinity S2c -->
    <p v-if="!pending && tenants.length" class="inline-block text-[11px] font-extrabold px-2.5 py-1 rounded-full mt-3" style="background:#0C0A09;color:#fff">{{ dirCount }}</p>

    <!-- V13C strip promo (Addendum 23 v1.1): section di mall page, BUKAN route baru. Discovery lintas-tenant $0. -->
    <!-- KENAPA di sini: di atas list tenant, di bawah pill count — user lihat promo dulu baru scroll direktori. Data real: filter tenant yang ada badge promo (tenantPromo), bukan fake all -20%. -->
    <div v-if="!pending && promoStrip.length" class="rounded-2xl p-3 mt-3 bg-white border border-gray-100">
      <p class="font-extrabold text-[13px]">🔥 Promo hari ini di {{ mallShort }} ({{ promoStrip.length }})</p>
      <p class="text-[11px] font-bold text-gray-500 mb-1">Weekday filler · s/d 23:59 · tap → tenant</p>
      <NuxtLink v-for="t in promoStrip" :key="'promo-' + t.name" :to="`/makan?mall=${slug}`" class="flex gap-2 items-center border-t border-gray-100 py-2">
        <div class="w-[30px] h-[30px] flex-none rounded-[9px] flex items-center justify-center text-[15px]" :style="{ background: tenantBg(t), color: '#fff' }">{{ tenantEmoji(t) }}</div>
        <div class="flex-1 text-[12px]"><b>{{ t.name }} {{ tenantPromo(t) }}</b><br><small class="text-gray-500 font-bold">{{ tenantFloor(t) }} · {{ tenantHalal(t) }}</small></div>
        <span class="text-[12px] font-extrabold underline">Lihat →</span>
      </NuxtLink>
    </div>

    <!-- Kartu tenant (mockup S2c Foto Tenant): thumb foto 46px + badge promo overlay -->
    <AppLoader v-if="pending" variant="mall" />
    <div v-else-if="error" class="rounded-2xl p-4 text-sm font-bold mt-3" style="background:#fef2f2;border:1px solid #fecaca;color:#991b1b">
      Gagal muat tenant.<br><button class="underline mt-1 disabled:opacity-60" :disabled="pending" @click="reload()">Coba lagi →</button>
    </div>
    <div v-else class="flex flex-col gap-2.5 mt-3">
      <div v-for="t in filtered" :key="t.name" class="border border-gray-100 rounded-2xl p-2.5 bg-white flex gap-2.5 items-center">
        <div class="w-[46px] h-[46px] flex-none rounded-xl flex items-center justify-center text-[22px]" :style="{ background: tenantBg(t), color: '#fff' }">
          {{ tenantEmoji(t) }}
        </div>
        <div class="text-[13px]">
          <b>{{ t.name }} {{ tenantFloor(t) }}</b><br>
          <span v-if="tenantPromo(t)" class="inline-block text-white text-[10.5px] font-extrabold px-2 py-0.5 rounded-md my-0.5" :style="{ background: '#E11D48', color: '#fff' }">{{ tenantPromo(t) }}</span>
          <p class="text-xs text-gray-500">{{ tenantRate(t) }} ★ · {{ tenantFloor(t) }} · {{ tenantHalal(t) }}</p>
        </div>
      </div>
      <p v-if="!filtered.length" class="text-center text-sm text-gray-500 py-8">Tidak ada tenant cocok. Coba ubah filter.</p>
      <!-- Skeleton 2 row pas nambah page (S2b spec) -->
      <div v-if="loadingMore" class="flex flex-col gap-2.5" aria-live="polite">
        <div v-for="i in 2" :key="i" class="border border-gray-100 rounded-2xl p-2.5 bg-white flex gap-2.5 items-center animate-pulse">
          <div class="w-[46px] h-[46px] flex-none rounded-xl" style="background:#F5F5F4" />
          <div class="flex-1"><div class="h-4 rounded w-2/3" style="background:#F5F5F4" /><div class="h-3 rounded w-1/3 mt-1.5" style="background:#F5F5F4" /></div>
        </div>
      </div>
      <!-- Sentinel infinity scroll -->
      <div v-if="hasMore" ref="sentinel" class="text-center text-xs text-gray-400 py-3">Muat tenant berikut… ({{ tenants.length }}/{{ total }})</div>
      <p v-else-if="tenants.length" class="text-center text-xs text-gray-400 py-2">Semua {{ total }} tenant tampil ✅</p>
    </div>
  </div>
</template>
