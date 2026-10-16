<!-- common/components/AppHeader.vue → Header GLOBAL sticky 2-state AS6 wallet-card (Addendum 22 APPROVED).
APA: anon = Login/Register; login = avatar initial + Bell + dropdown (email, Riwayat, Wishlist Segera, Keluar).
KENAPA: dulu blok ini hidup di app.vue; dipisah supaya layout tipis + header testable. State dari AuthStore (Pinia).
Contoh: dipasang sekali di app.vue di atas <NuxtPage />. -->
<script setup lang="ts">
import { storeToRefs } from "pinia";
import AppSpinner from "~/common/components/AppSpinner.vue";
import { useAuthStore } from "~/common/store/AuthStore";

const auth = useAuthStore();
const { isLoggedIn, email, displayName, initial } = storeToRefs(auth);
const router = useRouter();
const showMenu = ref(false);
const loggingOut = ref(false);

function toggleMenu(): void {
  showMenu.value = !showMenu.value;
}

// Logout real: signOut Supabase → tutup menu → balik / sebagai anon. Guard anti double-klik + spinner Keluar.
async function handleLogout(): Promise<void> {
  if (loggingOut.value) return;
  loggingOut.value = true;
  try {
    await auth.signOut();
    showMenu.value = false;
    router.push("/");
  } finally {
    loggingOut.value = false;
  }
}
</script>

<template>
  <header class="bg-white sticky top-0 z-40 shadow-sm relative">
    <div
      class="container mx-auto px-4 py-3 flex justify-between items-center max-w-md"
    >
      <NuxtLink to="/" class="flex items-center" aria-label="Wikendo — beranda">
        <img
          src="/brand-icon-day.png"
          alt="Wikendo"
          width="32"
          height="32"
          class="rounded-lg"
        />
      </NuxtLink>
      <div v-if="!isLoggedIn" class="flex gap-3 items-center">
        <button
          type="button"
          aria-label="Login"
          class="text-sm font-bold leading-none text-red-600 hover:text-orange-500"
          @click="router.push('/login')"
        >
          Login
        </button>
        <button
          type="button"
          aria-label="Register"
          class="text-sm font-bold leading-none text-orange-600 hover:text-red-500"
          @click="router.push('/register')"
        >
          Register
        </button>
      </div>
      <div v-else class="flex gap-2 items-center">
        <button
          type="button"
          :aria-label="'Menu profil ' + displayName"
          class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold text-white avatar-initial"
          :style="{ background: '#0C0A09' }"
          @click="toggleMenu"
        >
          {{ initial }}
        </button>
        <button
          type="button"
          aria-label="Notifikasi"
          class="text-lg leading-none"
        >
          🔔
        </button>
      </div>
      <!-- Dropdown mini AS6 wallet-card: email grey + Riwayat + Wishlist (Segera) + Keluar merah. -->
      <div
        v-if="isLoggedIn && showMenu"
        class="absolute right-4 top-full mt-1 w-56 rounded-xl bg-white shadow-lg border border-stone-200 py-2 z-50"
      >
        <p class="px-4 py-1.5 text-[11px] font-bold text-gray-500 truncate">
          {{ email }}
        </p>
        <div class="h-px bg-stone-100 mx-4" />
        <button
          type="button"
          class="w-full text-left px-4 py-2 text-xs font-extrabold hover:bg-stone-50"
          @click="showMenu = false"
        >
          Riwayat
        </button>
        <span
          class="w-full flex justify-between items-center px-4 py-2 text-xs font-extrabold text-gray-400"
        >
          Wishlist <small class="font-bold">Segera</small>
        </span>
        <div class="h-px bg-stone-100 mx-4" />
        <button
          type="button"
          :disabled="loggingOut"
          class="w-full text-left px-4 py-2 text-xs font-extrabold text-red-600 hover:bg-red-50 disabled:opacity-60 inline-flex items-center gap-2"
          @click="handleLogout"
        >
          <AppSpinner v-if="loggingOut" color="#DC2626" size="w-3.5 h-3.5" />
          {{ loggingOut ? "Keluar…" : "Keluar" }}
        </button>
      </div>
    </div>
  </header>
</template>
