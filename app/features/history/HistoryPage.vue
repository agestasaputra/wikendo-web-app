<!-- features/history/HistoryPage.vue → GET /history (History E1 localStorage wikendo_history).
WHAT: read history from HistoryStore (localStorage key wikendo_history, array {kind,title,sub,at} max 20 newest-first) + logged-in server page merged (Bearer auth + row→entry mapping) + honest empty state 1:1 home + Image Cards (option 9) list + quiz CTA.
WHY localStorage ZERO backend for anon: anonymous users still have history; place/food result writes on success (window guard + try/catch + dedupe + cap 20).
WHY merge (never overwrite): a logged-in user has BOTH device entries and server rows; overwriting silently loses entries.
Example: after /result-place Kopi Kekinian → /history shows "Kopi Kenangan — L2 · GI" at the top. -->
<script setup lang="ts">
/**
 * HistoryPage — riwayat dari HP (localStorage) + halaman server (Bearer) untuk user login.
 *
 * APA: daftar Image Cards (band 120px + info p-4), empty state 1:1 home, tombol hapus.
 * KENAPA skeleton dulu: load() dari localStorage itu SINKRON, jadi tanpa gate halaman sempat
 *   nge-paint "Belum ada riwayat" satu frame — user lihat kebohongan lalu kartu muncul (flash).
 *   useFirstLoad menahan skeleton minimal 260ms sampai data lokal + server selesai dibaca.
 * CONTOH: buka /history → skeleton 3 kartu → "Kopi Kenangan — L2 · GI" di paling atas.
 */
import { useSupabaseBrowser } from "~/common/composables/useSupabaseBrowser";
import { storeToRefs } from "pinia";
import { computed } from "vue";

import AppLoader from "~/common/components/AppLoader.vue";
import { useFirstLoad } from "~/common/composables/useFirstLoad";
import { useHistoryStore } from "~/common/store/HistoryStore";
import { timeAgo, mergeHistory } from "~/common/utils/history";
import { toHistoryEntries } from "~/common/utils/historyRow";
import { buildResultUrl } from "~/common/utils/resultUrl";

const history = useHistoryStore();
const { items } = storeToRefs(history);

async function load(): Promise<void> {
  // Always load localStorage first so we have something to show even if API fails.
  history.load();

  const { data: sessionData } = await useSupabaseBrowser().auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    // anonymous – localStorage only
    return;
  }
  // Logged-in: fetch the server page with Bearer auth (session lives in localStorage,
  // so cookies carry no auth) and MERGE – never overwrite the device list.
  try {
    const response = await $fetch("/api/history", {
      query: { page: 1, pageSize: 20 },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const remote = toHistoryEntries(response?.items);
    if (remote.length) {
      history.items = mergeHistory(history.items, remote);
    }
  } catch (e) {
    // Silently ignore – keep localStorage version.
    console.error("Failed to fetch remote history:", e);
  }
}

// Skeleton wins over the empty state: gate the FIRST paint, then run the real load.
const { booting } = useFirstLoad({ key: "history", task: load });
const showSkeleton = computed(() => booting.value);
</script>

<template>
  <div class="max-w-md mx-auto px-4 pb-10 py-5">
    <AppLoader v-if="showSkeleton" variant="history" />

    <template v-else>
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
            to="/place"
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

      <!-- Image Cards (option 9) — vertical cards, 120px image band, info p-4 -->
      <div v-else class="flex flex-col gap-3">
        <NuxtLink
          v-for="(it, i) in items"
          :key="i"
          :to="it.id ? buildResultUrl(it.kind, it.id) : undefined"
          class="block rounded-2xl overflow-hidden bg-white border border-stone-200"
          :class="it.id ? 'hover:shadow-md transition-shadow' : 'opacity-90'"
        >
          <div
            class="h-[120px] w-full bg-stone-100 flex items-center justify-center text-[32px]"
          >
            {{ it.kind === "food" ? "🍜" : "📍" }}
          </div>
          <div class="p-4">
            <div
              class="font-bold text-stone-900 line-clamp-1"
              style="font-size: 1.1rem"
            >
              {{ it.title }}
            </div>
            <div class="text-[12px] text-gray-500 mt-0.5 line-clamp-1">
              {{ it.sub }}
            </div>
            <div class="text-[11px] text-gray-400 mt-1">
              {{ timeAgo(it.at) }}
            </div>
            <div
              v-if="it.id"
              class="text-[11px] text-blue-600 mt-1 font-semibold"
            >
              Buka hasil →
            </div>
          </div>
        </NuxtLink>
        <button
          type="button"
          class="text-[11px] font-bold text-gray-500 underline mt-1"
          @click="history.clear()"
        >
          Hapus riwayat
        </button>
      </div>
    </template>
  </div>
</template>
