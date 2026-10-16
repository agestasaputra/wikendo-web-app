<!-- pages/riwayat.vue → GET /riwayat (Riwayat E1 localStorage wikendo_history).
APA: baca localStorage key wikendo_history (array {kind,title,sub,at} max 20 newest-first) + kosong jujur 1:1 home + list kartu + CTA quiz.
KENAPA localStorage NOL backend: NOL tabel + NOL API + anon tetap punya riwayat; result.vue/result-makan.vue tulis pas sukses (guard window + try/catch + dedupe + cap 20).
Contoh: habis /result Kopi Kekinian → /riwayat muncul "Kopi Kekinian — GI L2" paling atas. -->
<script setup lang="ts">
type Hist = { kind: 'tempat' | 'makan', title: string, sub: string, at: number }
const items = ref<Hist[]>([])

function load() {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem('wikendo_history')
    if (!raw) return
    const arr = JSON.parse(raw)
    if (Array.isArray(arr)) items.value = arr.slice(0, 20)
  } catch { /* ignore */ }
}
function timeAgo(at: number): string {
  const d = Date.now() - at
  if (d < 60_000) return 'barusan'
  if (d < 3600_000) return Math.floor(d / 60000) + 'm lalu'
  if (d < 86400_000) return Math.floor(d / 3600000) + 'j lalu'
  return new Date(at).toLocaleDateString('id-ID')
}
function clearAll() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem('wikendo_history')
  items.value = []
}
onMounted(load)
</script>

<template>
  <div class="max-w-md mx-auto px-4 pb-10">
    <div class="flex justify-between items-center font-bold text-[13px] py-3">
      <span class="font-extrabold">🕒 Riwayat</span>
      <NuxtLink to="/" class="text-gray-500 underline text-xs">Home →</NuxtLink>
    </div>
    <p class="text-[11px] font-bold text-gray-500 mb-3">Terakhir dilihat — max 20 · simpan di HP ini</p>

    <div v-if="!items.length" class="rounded-2xl p-6 text-center bg-white border border-stone-200">
      <p class="font-extrabold text-sm">Belum ada riwayat — mulai quiz pertamamu →</p>
      <p class="text-[11px] text-gray-500 mt-1">Hasil quiz tempat & makan bakal muncul di sini</p>
      <div class="flex gap-2 mt-3">
        <NuxtLink to="/quiz" class="flex-1 text-center text-white rounded-2xl py-3 font-extrabold text-sm" style="background:#0C0A09">Cari Tempat →</NuxtLink>
        <NuxtLink to="/makan" class="flex-1 text-center rounded-2xl py-3 font-extrabold text-sm bg-white border-2 border-gray-200">Cari Makan →</NuxtLink>
      </div>
    </div>

    <div v-else class="flex flex-col gap-2">
      <div v-for="(it, i) in items" :key="i" class="rounded-2xl p-3 bg-white border border-stone-200 flex gap-2 items-center">
        <span class="text-xl">{{ it.kind === 'makan' ? '🍜' : '🗺️' }}</span>
        <div class="flex-1 min-w-0">
          <p class="font-extrabold text-[13px] truncate">{{ it.title }}</p>
          <p class="text-[11px] text-gray-500 truncate">{{ it.sub }}</p>
        </div>
        <span class="text-[10px] font-bold text-gray-400 whitespace-nowrap">{{ timeAgo(it.at) }}</span>
      </div>
      <button type="button" class="text-[11px] font-bold text-gray-500 underline mt-1" @click="clearAll">Hapus riwayat</button>
    </div>
  </div>
</template>
