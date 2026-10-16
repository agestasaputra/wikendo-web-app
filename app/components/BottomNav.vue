<!-- components/BottomNav.vue → Nav bawah E1 Home-Mall-Quiz+-Riwayat-Akun (Addendum docs/24).
APA: 5 tab max-w-md fixed bottom (aktif lime #A3E635 + dot) + Quiz+ center BUKAN route → sheet 2 intent quota jujur.
KENAPA: jempol tak sampai header; 1 tombol tak bisa bawa 2 intent quota beda (tempat 2/hari vs makan 5/hari) tanpa bohong → cost 2-tap diterima.
Contoh: tap + → sheet → Cari Tempat (sisa 1/1) → /quiz; habis → disabled Besok lagi 00.00. -->
<script setup lang="ts">
import type { QuotaStatus } from '~/types'
import { buildQuotaStatus } from '~/utils/quiz-logic'

const route = useRoute()
const showSheet = ref(false)

// Quota ikut GET /api/quota yang sudah ada (pola SAMA kayak index.vue). Gagal = fallback anon fresh 1 • 2, bukan angka bohong.
const { data: quotaData } = await useFetch<QuotaStatus>('/api/quota')
const quotaStatus = computed(() => quotaData.value || buildQuotaStatus({ tempatUsed: 0, makanUsed: 0, isLoggedIn: false }))
const tempatLeft = computed(() => quotaStatus.value.tempat.remaining)
const tempatLimit = computed(() => quotaStatus.value.tempat.limit)
const makanLeft = computed(() => quotaStatus.value.makan.remaining)
const makanLimit = computed(() => quotaStatus.value.makan.limit)

function isActive(p: string) {
  if (p === '/') return route.path === '/'
  return route.path === p || route.path.startsWith(p + '/')
}

function go(p: string) {
  showSheet.value = false
  navigateTo(p)
}
</script>

<template>
  <nav aria-label="Pilih jenis quiz dan navigasi" class="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200">
    <div class="max-w-md mx-auto px-2 pt-1.5 flex items-end justify-between" style="padding-bottom:calc(10px + env(safe-area-inset-bottom))">
      <NuxtLink to="/" aria-label="Home" class="flex-1 flex flex-col items-center gap-0.5 py-1 text-[10px] font-extrabold" :style="{ color: isActive('/') ? '#0C0A09' : '#78716c' }">
        <span class="text-xl leading-none">🏠</span>Home
        <span v-if="isActive('/')" class="w-1 h-1 rounded-full" style="background:#A3E635" />
      </NuxtLink>
      <NuxtLink to="/mall" aria-label="Mall" class="flex-1 flex flex-col items-center gap-0.5 py-1 text-[10px] font-extrabold" :style="{ color: isActive('/mall') ? '#0C0A09' : '#78716c' }">
        <span class="text-xl leading-none">🏬</span>Mall
        <span v-if="isActive('/mall')" class="w-1 h-1 rounded-full" style="background:#A3E635" />
      </NuxtLink>
      <div class="flex-1 flex flex-col items-center -mt-5">
        <button type="button" aria-label="Quiz+ buka pilihan quiz" class="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-extrabold text-white shadow-lg border-4 border-white" style="background:#0C0A09" @click="showSheet = true">+</button>
        <span class="text-[10px] font-extrabold" style="color:#0C0A09">Quiz+</span>
      </div>
      <NuxtLink to="/riwayat" aria-label="Riwayat" class="flex-1 flex flex-col items-center gap-0.5 py-1 text-[10px] font-extrabold" :style="{ color: isActive('/riwayat') ? '#0C0A09' : '#78716c' }">
        <span class="text-xl leading-none">🕒</span>Riwayat
        <span v-if="isActive('/riwayat')" class="w-1 h-1 rounded-full" style="background:#A3E635" />
      </NuxtLink>
      <NuxtLink to="/account" aria-label="Akun" class="flex-1 flex flex-col items-center gap-0.5 py-1 text-[10px] font-extrabold" :style="{ color: isActive('/account') ? '#0C0A09' : '#78716c' }">
        <span class="text-xl leading-none">👤</span>Akun
        <span v-if="isActive('/account')" class="w-1 h-1 rounded-full" style="background:#A3E635" />
      </NuxtLink>
    </div>
  </nav>

  <!-- Sheet Quiz+ 2 intent eksplisit (konsisten sheet V13B: top-border 4px ink, handle bar, kartu border). NOL API baru. -->
  <div v-if="showSheet" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/50" @click="showSheet = false" />
    <div role="dialog" aria-label="Pilih quiz tempat atau makan" class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl" style="border-top:4px solid #0C0A09">
      <div class="max-w-md mx-auto px-4 pt-2 pb-6">
        <div class="w-10 h-1 rounded-full mx-auto mb-1.5" style="background:#d6d3d1" />
        <div class="flex justify-between items-center">
          <p class="font-extrabold text-[14px]">Mau cari apa? 🎲</p>
          <button type="button" aria-label="Tutup sheet pilihan quiz" class="text-gray-500 font-extrabold px-2 py-1" @click="showSheet = false">✕</button>
        </div>
        <p class="text-[11px] font-bold text-gray-500 mb-2">Tempat ya tempat, makan ya makan — quota beda, reset 00.00</p>
        <div class="flex flex-col gap-2">
          <button type="button" :disabled="tempatLeft <= 0" class="rounded-xl p-3 flex gap-2 items-center bg-white text-left disabled:opacity-60" style="border:1.5px solid #e7e5e4" @click="go('/quiz')">
            <span class="text-2xl">🗺️</span>
            <span class="flex-1 text-[13px] font-extrabold">Cari Tempat<br><small class="font-bold text-gray-500">Quiz 30 dtk · 2/hari · sisa {{ tempatLeft }}/{{ tempatLimit }}</small></span>
            <span class="text-[12px] font-extrabold rounded-full px-3 py-1.5 text-white" style="background:#0C0A09">{{ tempatLeft <= 0 ? 'Besok lagi 00.00' : 'Mulai →' }}</span>
          </button>
          <button type="button" :disabled="makanLeft <= 0" class="rounded-xl p-3 flex gap-2 items-center bg-white text-left disabled:opacity-60" style="border:1.5px solid #e7e5e4" @click="go('/makan')">
            <span class="text-2xl">🍜</span>
            <span class="flex-1 text-[13px] font-extrabold">Cari Makan<br><small class="font-bold text-gray-500">Quiz 20 dtk · 5/hari · sisa {{ makanLeft }}/{{ makanLimit }}</small></span>
            <span class="text-[12px] font-extrabold rounded-full px-3 py-1.5 text-white" style="background:#E11D48">{{ makanLeft <= 0 ? 'Besok lagi 00.00' : 'Mulai →' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
