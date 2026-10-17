<!-- features/account/AccountPage.vue → GET /account (Account Hub E1, mirrors the AS6 header).
WHAT: 2-state Account hub anonymous (Login/Daftar + 2+5 note) vs logged in (avatar initial + name + grey email + red Keluar with spinner+guard) + 4 hub rows Riwayat/Wishlist Segera/WA/Tentang.
WHY mirrors AS6: the header already has a dropdown, but the thumb can't reach the header → needs a thumb-zone hub in BottomNav; 1 lightweight file without full /profile/Google photo/server quota (follows the Addendum 22 guard).
Example: anonymous → Login → /login; Budi logged in → avatar S + budi@example.com + Keluar → signOut → / anonymous. -->
<script setup lang="ts">
import { storeToRefs } from "pinia";
import AppSpinner from "~/common/components/AppSpinner.vue";
import { useAuthStore } from "~/common/store/AuthStore";

const auth = useAuthStore();
const { isLoggedIn, email, displayName, initial } = storeToRefs(auth);
const router = useRouter();
const loggingOut = ref(false);

async function handleLogout(): Promise<void> {
  if (loggingOut.value) return;
  loggingOut.value = true;
  try {
    await auth.signOut();
    router.push("/");
  } finally {
    loggingOut.value = false;
  }
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 p-5">
    <!-- Anonymous state -->
    <div
      v-if="!isLoggedIn"
      class="rounded-2xl p-4 bg-white border border-stone-200"
    >
      <p class="font-extrabold text-[15px]">Belum login</p>
      <p class="text-[12px] text-gray-500 mt-1">
        Login gratis → buka <b>2 tempat + 5 makan</b>/hari · reset 00.00
      </p>
      <div class="flex gap-2 mt-3">
        <NuxtLink
          to="/login"
          class="flex-1 text-center text-white rounded-2xl py-3 font-extrabold text-sm"
          style="background: #0c0a09"
          >Login →</NuxtLink
        >
        <NuxtLink
          to="/register"
          class="flex-1 text-center rounded-2xl py-3 font-extrabold text-sm bg-white border-2 border-gray-200"
          >Daftar →</NuxtLink
        >
      </div>
      <p class="text-[11px] text-gray-400 text-center mt-2">
        gratis selamanya · 10 detik pakai Google
      </p>
    </div>

    <!-- Logged-in state -->
    <div v-else class="rounded-2xl p-4 bg-white border border-stone-200">
      <div class="flex gap-3 items-center">
        <div
          class="w-12 h-12 rounded-full flex items-center justify-center text-lg font-extrabold text-white avatar-initial"
          style="background: #0c0a09"
        >
          {{ initial }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-extrabold text-[14px] truncate">{{ displayName }}</p>
          <p class="text-[11px] font-bold text-gray-500 truncate">
            {{ email }}
          </p>
        </div>
      </div>
      <button
        type="button"
        :disabled="loggingOut"
        class="w-full mt-3 rounded-2xl py-3 font-extrabold text-sm text-red-600 bg-red-50 border border-red-200 disabled:opacity-60 inline-flex items-center justify-center gap-2"
        @click="handleLogout"
      >
        <AppSpinner v-if="loggingOut" color="#DC2626" />
        {{ loggingOut ? "Keluar…" : "Keluar" }}
      </button>
    </div>

    <!-- 4 hub rows LOCKED (Addendum 24 order): Riwayat/Wishlist Segera/WA/Tentang -->
    <div
      class="rounded-2xl bg-white border border-stone-200 mt-3 overflow-hidden"
    >
      <NuxtLink
        to="/history"
        class="flex justify-between items-center px-4 py-3.5 font-extrabold text-[13px] hover:bg-stone-50 border-b border-stone-100"
      >
        <span>🕒 Riwayat</span><span class="text-gray-400">→</span>
      </NuxtLink>
      <div
        class="flex justify-between items-center px-4 py-3.5 font-extrabold text-[13px] text-gray-400 border-b border-stone-100"
      >
        <span>❤️ Wishlist</span
        ><span
          class="text-[11px] font-bold bg-stone-100 rounded-full px-2 py-0.5"
          >Segera</span
        >
      </div>
      <a
        href="https://wa.me/6280000000000"
        target="_blank"
        class="flex justify-between items-center px-4 py-3.5 font-extrabold text-[13px] hover:bg-stone-50 border-b border-stone-100"
      >
        <span>💬 Hubungi kami</span><span class="text-gray-400">↗</span>
      </a>
      <a
        href="/#tentang"
        class="flex justify-between items-center px-4 py-3.5 font-extrabold text-[13px] hover:bg-stone-50"
      >
        <span>ℹ️ Tentang</span><span class="text-gray-400">→</span>
      </a>
    </div>
  </div>
</template>
