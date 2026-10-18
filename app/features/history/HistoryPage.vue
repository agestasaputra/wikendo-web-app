<!-- features/history/HistoryPage.vue → GET /history (History E1 localStorage wikendo_history).
WHAT: read history from HistoryStore (localStorage key wikendo_history, array {kind,title,sub,at} max 20 newest-first) + honest empty state 1:1 home + card list + quiz CTA.
WHY localStorage ZERO backend: ZERO tables + ZERO API + anonymous users still have history; place/food result writes on success (window guard + try/catch + dedupe + cap 20).
Example: after /result Kopi Kekinian → /history shows "Kopi Kekinian — GI L2" at the top. -->
<script setup lang="ts">
import { useSupabaseBrowser } from "~/common/composables/useSupabaseBrowser";
import { storeToRefs } from "pinia";
import { onMounted } from "vue";

import { useHistoryStore } from "~/common/store/HistoryStore";
import { timeAgo } from "~/common/utils/history";

const history = useHistoryStore();
const { items } = storeToRefs(history);

onMounted(async () => {
  // Always load localStorage first so we have something to show even if API fails.
  history.load();

  const { data: sessionData } = await useSupabaseBrowser().auth.getSession();
  const user = sessionData?.session?.user ?? null;
  if (!user) {
    // anonymous – nothing else to do
    return;
  }
  // Logged‑in: attempt remote history fetch. Include cookies for auth.
  try {
    const response = await $fetch("/api/history", {
      query: { page: 1, pageSize: 10 },
      credentials: "include",
    });
    if (response?.items?.length) {
      // Overwrite with server‑side history if any records returned.
      history.items = response.items;
    }
  } catch (e) {
    // Silently ignore – keep localStorage version.
    console.error("Failed to fetch remote history:", e);
  }
});
</script>

<template>
  <div class="max-w-md mx-auto px-4 pb-10 py-5">
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
      <div class="grid3">
        <div v-for="(it, i) in items" :key="i" class="card">
          <div class="thumb"></div>
          <div class="info">
            <div class="title">{{ it.title }}</div>
            <div class="sub">{{ it.sub }}</div>
            <div class="time">{{ timeAgo(it.at) }}</div>
          </div>
        </div>
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
