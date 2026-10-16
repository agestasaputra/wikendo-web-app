<!-- app.vue — Layout GLOBAL kombo 5+10+15 + E1 BottomNav (Addendum 09 v1.3 + 24 E1 APPROVED).
APA: header sticky + <NuxtPage/> + footer id tentang + BottomNav 5-tab fixed dalam max-w-md thumb-zone, pb-24 anti-ketutup.
KENAPA 1 layout dipakai 6 pages → konsisten + hemat. BottomNav global: jempol tak sampai header → nav thumb-zone; E1 5-tab Home-Mall-Quiz+-Riwayat-Akun NOL tab mati; Quiz+ buka sheet (bukan route) karena 1 tombol tak bisa bawa 2 intent quota beda.
Contoh: footer id tentang → Akun/Tentang anchor #tentang scroll; pb-24 cegah konten ketutup nav fixed. -->
<script setup lang="ts">
// Header 2-state AS6 wallet-card (Addendum 22 APPROVED): anon = Login/Register, login = avatar initial + Bell + dropdown.
import { useAuth } from '~/composables/useAuth'

const { isLoggedIn, email, displayName, initial, signOut } = useAuth()
const router = useRouter()
const showMenu = ref(false)
const loggingOut = ref(false)

function toggleMenu() {
  showMenu.value = !showMenu.value
}

// Logout real: signOut Supabase → tutup menu → balik / sebagai anon. Guard anti double-klik + spinner Keluar.
async function handleLogout() {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await signOut()
    showMenu.value = false
    router.push('/')
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-base text-ink pb-24" style="font-family:'Plus Jakarta Sans',system-ui,sans-serif">
    <header class="bg-white sticky top-0 z-40 shadow-sm relative">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center max-w-md">
        <NuxtLink to="/" class="flex items-center" aria-label="Wikendo — beranda"><img src="/brand-icon-day.png" alt="Wikendo" width="32" height="32" class="rounded-lg"></NuxtLink>
        <div v-if="!isLoggedIn" class="flex gap-3 items-center">
          <button type="button" aria-label="Login" class="text-sm font-bold leading-none text-red-600 hover:text-orange-500" @click="$router.push('/login')">Login</button>
          <button type="button" aria-label="Register" class="text-sm font-bold leading-none text-orange-600 hover:text-red-500" @click="$router.push('/register')">Register</button>
        </div>
        <div v-else class="flex gap-2 items-center">
          <button type="button" :aria-label="'Menu profil ' + displayName" class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold text-white avatar-initial" :style="{ background: '#0C0A09' }" @click="toggleMenu">{{ initial }}</button>
          <button type="button" aria-label="Notifikasi" class="text-lg leading-none">🔔</button>
        </div>
        <!-- Dropdown mini AS6 wallet-card: email grey + Riwayat + Wishlist (Segera) + Keluar merah. Avatar + initial di atas. -->
        <div v-if="isLoggedIn && showMenu" class="absolute right-4 top-full mt-1 w-56 rounded-xl bg-white shadow-lg border border-stone-200 py-2 z-50">
          <p class="px-4 py-1.5 text-[11px] font-bold text-gray-500 truncate">{{ email }}</p>
          <div class="h-px bg-stone-100 mx-4" />
          <button type="button" class="w-full text-left px-4 py-2 text-xs font-extrabold hover:bg-stone-50" @click="showMenu = false">Riwayat</button>
          <span class="w-full flex justify-between items-center px-4 py-2 text-xs font-extrabold text-gray-400">Wishlist <small class="font-bold">Segera</small></span>
          <div class="h-px bg-stone-100 mx-4" />
          <button type="button" :disabled="loggingOut" class="w-full text-left px-4 py-2 text-xs font-extrabold text-red-600 hover:bg-red-50 disabled:opacity-60 inline-flex items-center gap-2" @click="handleLogout"><svg v-if="loggingOut" class="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="#DC2626" stroke-opacity=".25" stroke-width="4" /><path d="M22 12a10 10 0 0 0-10-10" stroke="#DC2626" stroke-width="4" stroke-linecap="round" /></svg>{{ loggingOut ? 'Keluar…' : 'Keluar' }}</button>
        </div>
      </div>
    </header>
    <NuxtPage />
    <footer id="tentang" class="text-center text-xs text-gray-400 py-8">
      Wikendo MVP • $0/month • Nuxt 4 + Supabase + Hermes-combo — <a href="#tentang" class="underline">Tentang</a>
    </footer>
    <BottomNav />
  </div>
</template>
