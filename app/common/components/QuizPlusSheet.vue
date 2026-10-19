<!-- common/components/QuizPlusSheet.vue → Quiz+ sheet with 2 explicit intents (Addendum docs/24 E1).
WHAT: backdrop + dialog with 2 cards (Cari Tempat → /quiz, Cari Makan → /food) showing the REAL remaining/limit from GET /api/quota (anon 1•1, member 2•5) + login upsell for anonymous; empty = disabled "Besok lagi 00.00".
WHY: 1 "+" button can't carry 2 different quota intents without lying → the 2-tap cost is accepted. ZERO new API.
WHY dynamic numbers: a hardcoded per-tier number was a lie for anonymous users (1•1) and could disagree with the wallet after a refresh.
EXAMPLE: <QuizPlusSheet :place-left="1" :place-limit="1" :food-left="0" :food-limit="1" :is-logged-in="false" @go="go" @close="close" /> -->
<script setup lang="ts">
defineProps<{
  placeLeft: number;
  placeLimit: number;
  foodLeft: number;
  foodLimit: number;
  isLoggedIn: boolean;
}>();
const emit = defineEmits<{ go: [path: string]; close: [] }>();
</script>

<template>
  <div class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/50" @click="emit('close')" />
    <div
      role="dialog"
      aria-label="Pilih quiz tempat atau makan"
      class="absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-2xl"
      style="border-top: 4px solid #0c0a09"
    >
      <div class="max-w-md mx-auto px-4 pt-2 pb-6">
        <div
          class="w-10 h-1 rounded-full mx-auto mb-1.5"
          style="background: #d6d3d1"
        />
        <div class="flex justify-between items-center">
          <p class="font-extrabold text-[14px]">Mau cari apa? 🎲</p>
          <button
            type="button"
            aria-label="Tutup sheet pilihan quiz"
            class="text-gray-500 font-extrabold px-2 py-1"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>
        <p class="text-[11px] font-bold text-gray-500 mb-2">
          Tempat ya tempat, makan ya makan — quota beda, reset 00.00
        </p>
        <div class="flex flex-col gap-2">
          <button
            type="button"
            :disabled="placeLeft <= 0"
            class="rounded-xl p-3 flex gap-2 items-center bg-white text-left disabled:opacity-60"
            style="border: 1.5px solid #e7e5e4"
            @click="emit('go', '/quiz')"
          >
            <span class="text-2xl">🗺️</span>
            <span class="flex-1 text-[13px] font-extrabold">
              Cari Tempat<br />
              <small class="font-bold text-gray-500">
                Quiz 30 dtk · sisa {{ placeLeft }}/{{ placeLimit }}
              </small>
            </span>
            <span
              class="text-[12px] font-extrabold rounded-full px-3 py-1.5 text-white"
              style="background: #0c0a09"
            >
              {{ placeLeft <= 0 ? "Besok lagi 00.00" : "Mulai →" }}
            </span>
          </button>
          <button
            type="button"
            :disabled="foodLeft <= 0"
            class="rounded-xl p-3 flex gap-2 items-center bg-white text-left disabled:opacity-60"
            style="border: 1.5px solid #e7e5e4"
            @click="emit('go', '/food')"
          >
            <span class="text-2xl">🍜</span>
            <span class="flex-1 text-[13px] font-extrabold">
              Cari Makan<br />
              <small class="font-bold text-gray-500">
                Quiz 20 dtk · sisa {{ foodLeft }}/{{ foodLimit }}
              </small>
            </span>
            <span
              class="text-[12px] font-extrabold rounded-full px-3 py-1.5 text-white"
              style="background: #e11d48"
            >
              {{ foodLeft <= 0 ? "Besok lagi 00.00" : "Mulai →" }}
            </span>
          </button>
        </div>
        <NuxtLink
          v-if="!isLoggedIn"
          to="/login"
          class="block text-center text-[11px] font-extrabold underline mt-2.5"
          >Login gratis: 2 tempat + 5 makan/hari + riwayat lintas device
          →</NuxtLink
        >
      </div>
    </div>
  </div>
</template>
