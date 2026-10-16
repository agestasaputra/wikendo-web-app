<!-- pages/account.vue → GET /account (Hub Akun E1, cermin header AS6).
APA: hub Akun 2-state anon (Login/Daftar + note 2+5) vs login (avatar initial + nama + email grey + Keluar merah spinner+guard) + 4 baris hub Riwayat/Wishlist Segera/WA/Tentang.
KENAPA cermin AS6: header sudah punya dropdown, tapi jempol tak sampai header → butuh hub thumb-zone di BottomNav; 1 file ringan tanpa /profile full/foto Google/quota-server (ikut guard Addendum 22).
Contoh: anon → Login → /login; login Siska → avatar S + siskadptr@gmail.com + Keluar → signOut → / anon. -->
<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const { isLoggedIn, email, displayName, initial, signOut } = useAuth()
const router = useRouter()
const loggingOut = ref(false)
async function handleLogout() {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await signOut()
    router.push('/')
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 pb-10">
    <div class="flex justify-between items-center font-bold text-[13px] py-3">
      <span class="font-extrabold">👤 Akun</span>
      <NuxtLink to="/" class="text-gray-500 underline text-xs">Home →</NuxtLink>
    </div>

    <!-- Anon state -->
    <div v-if="!isLoggedIn" class="rounded-2xl p-4 bg-white border border-stone-200">
      <p class="font-extrabold text-[15px]">Belum login</p>
      <p class="text-[12px] text-gray-500 mt-1">Login gratis → buka <b>2 tempat + 5 makan</b>/hari · reset 00.00</p>
      <div class="flex gap-2 mt-3">
        <NuxtLink to="/login" class="flex-1 text-center text-white rounded-2xl py-3 font-extrabold text-sm" style="background:#0C0A09">Login →</NuxtLink>
        <NuxtLink to="/register" class="flex-1 text-center rounded-2xl py-3 font-extrabold text-sm bg-white border-2 border-gray-200">Daftar →</NuxtLink>
      </div>
      <p class="text-[11px] text-gray-400 text-center mt-2">gratis selamanya · 10 detik pakai Google</p>
    </div>

    <!-- Login state -->
    <div v-else class="rounded-2xl p-4 bg-white border border-stone-200">
      <div class="flex gap-3 items-center">
        <div class="w-12 h-12 rounded-full flex items-center justify-center text-lg font-extrabold text-white avatar-initial" style="background:#0C0A09">{{ initial }}</div>
        <div class="flex-1 min-w-0">
          <p class="font-extrabold text-[14px] truncate">{{ displayName }}</p>
          <p class="text-[11px] font-bold text-gray-500 truncate">{{ email }}</p>
        </div>
      </div>
      <button type="button" :disabled="loggingOut" class="w-full mt-3 rounded-2xl py-3 font-extrabold text-sm text-red-600 bg-red-50 border border-red-200 disabled:opacity-60 inline-flex items-center justify-center gap-2" @click="handleLogout">
        <svg v-if="loggingOut" class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="#DC2626" stroke-opacity=".25" stroke-width="4" /><path d="M22 12a10 10 0 0 0-10-10" stroke="#DC2626" stroke-width="4" stroke-linecap="round" /></svg>
        {{ loggingOut ? 'Keluar…' : 'Keluar' }}
      </button>
    </div>

    <!-- 4 baris hub LOCKED (urutan Addendum 24): Riwayat/Wishlist Segera/WA/Tentang -->
    <div class="rounded-2xl bg-white border border-stone-200 mt-3 overflow-hidden">
      <NuxtLink to="/riwayat" class="flex justify-between items-center px-4 py-3.5 font-extrabold text-[13px] hover:bg-stone-50 border-b border-stone-100">
        <span>🕒 Riwayat</span><span class="text-gray-400">→</span>
      </NuxtLink>
      <div class="flex justify-between items-center px-4 py-3.5 font-extrabold text-[13px] text-gray-400 border-b border-stone-100">
        <span>❤️ Wishlist</span><span class="text-[11px] font-bold bg-stone-100 rounded-full px-2 py-0.5">Segera</span>
      </div>
      <a href="https://wa.me/6280000000000" target="_blank" class="flex justify-between items-center px-4 py-3.5 font-extrabold text-[13px] hover:bg-stone-50 border-b border-stone-100">
        <span>💬 Hubungi kami</span><span class="text-gray-400">↗</span>
      </a>
      <a href="/#tentang" class="flex justify-between items-center px-4 py-3.5 font-extrabold text-[13px] hover:bg-stone-50">
        <span>ℹ️ Tentang</span><span class="text-gray-400">→</span>
      </a>
    </div>
    <p class="text-[11px] text-gray-400 text-center mt-3">Wishlist segera hadir · Hubungi kami via WhatsApp · Tentang di footer</p>
  </div>
</template>
