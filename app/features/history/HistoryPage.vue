<!-- features/history/HistoryPage.vue → GET /history (History E1 localStorage wikendo_history).
WHAT: read history from HistoryStore (localStorage key wikendo_history, array {kind,title,sub,at} max 20 newest-first) + honest empty state 1:1 home + card list + quiz CTA.
WHY localStorage ZERO backend: ZERO tables + ZERO API + anonymous users still have history; place/food result writes on success (window guard + try/catch + dedupe + cap 20).
Example: after /result Kopi Kekinian → /history shows "Kopi Kekinian — GI L2" at the top. -->
<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useHistoryStore } from "~/common/store/HistoryStore";
import { timeAgo } from "~/common/utils/history";

const history = useHistoryStore();
const { items } = storeToRefs(history);
onMounted(() => history.load());
</script>

<template>
  <div class="max-w-md mx-auto px-4 pb-10">
    <div class="flex justify-between items-center font-bold text-[13px] py-3">
      <span class="font-extrabold">🕒 Riwayat</span>
      <NuxtLink to="/" class="text-gray-500 underline text-xs">Home →</NuxtLink>
    </div>
    <p class="text-[11px] font-bold text-gray-500 mb-3">
      Terakhir dilihat — max 20 · simpan di HP ini
    </p>

    <div
      v-if="!items.length"
      class="rounded-2xl p-6 text-center bg-white border border-stone-200"
    >
      <p class="font-extrabold text-sm">
        Belum ada riwayat — mulai quiz pertamamu →
      </p>
      <p class="text-[11px] text-gray-500 mt-1">
        Hasil quiz tempat & makan bakal muncul di sini
      </p>
      <div class="flex gap-2 mt-3">
        <NuxtLink
          to="/quiz"
          class="flex-1 text-center text-white rounded-2xl py-3 font-extrabold text-sm"
          style="background: #0c0a09"
          >Cari Tempat →</NuxtLink
        >
        <NuxtLink
          to="/food"
          class="flex-1 text-center rounded-2xl py-3 font-extrabold text-sm bg-white border-2 border-gray-200"
          >Cari Makan →</NuxtLink
        >
      </div>
    </div>

    <div v-else class="flex flex-col gap-2">
      <div
        v-for="(it, i) in items"
        :key="i"
        class="rounded-2xl p-3 bg-white border border-stone-200 flex gap-2 items-center"
      >
        <span class="text-xl">{{ it.kind === "food" ? "🍜" : "🗺️" }}</span>
        <div class="flex-1 min-w-0">
          <p class="font-extrabold text-[13px] truncate">{{ it.title }}</p>
          <p class="text-[11px] text-gray-500 truncate">{{ it.sub }}</p>
        </div>
        <span class="text-[10px] font-bold text-gray-400 whitespace-nowrap">{{
          timeAgo(it.at)
        }}</span>
      </div>
      <button
        type="button"
        class="text-[11px] font-bold text-gray-500 underline mt-1"
        @click="history.clear()"
      >
        Hapus riwayat
      </button>
    </div>
  </div>
</template>
