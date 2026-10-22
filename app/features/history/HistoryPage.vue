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
import { computed, ref } from "vue";

import AppLoader from "~/common/components/AppLoader.vue";
import FilterDrawer from "~/common/components/FilterDrawer.vue";
import { useFirstLoad } from "~/common/composables/useFirstLoad";
import { useHistoryStore } from "~/common/store/HistoryStore";
import { timeAgo, mergeHistory } from "~/common/utils/history";
import { toHistoryEntries } from "~/common/utils/historyRow";
import { buildResultUrl } from "~/common/utils/resultUrl";

const historyFilter = ref<"all" | "place" | "food">("all");
const historySort = ref<"newest" | "oldest" | "title_asc" | "title_desc">(
  "newest",
);

const showFilter = ref(false);
const activeFilters = ref<string[]>([]);
const searchQuery = ref("");

const history = useHistoryStore();
const { items } = storeToRefs(history);

const HISTORY_SORTS = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "title_asc", label: "A→Z" },
  { value: "title_desc", label: "Z→A" },
];

const HISTORY_GROUPS = [
  {
    title: "Jenis",
    mode: "single" as const,
    options: [
      { value: "kind:all", label: "Semua" },
      { value: "kind:place", label: "Tempat" },
      { value: "kind:food", label: "Makanan" },
    ],
  },
];

function kindTokenToValue(token: string | undefined): "all" | "place" | "food" {
  if (token === "place") return "place";
  if (token === "food") return "food";
  return "all";
}

const sortedItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const filtered = items.value.filter((it) => {
    if (historyFilter.value !== "all" && it.kind !== historyFilter.value)
      return false;
    if (!q) return true;
    return (
      it.title.toLowerCase().includes(q) ||
      (it.sub || "").toLowerCase().includes(q)
    );
  });
  return [...filtered].sort((a, b) => {
    switch (historySort.value) {
      case "oldest":
        return a.at - b.at;
      case "title_asc":
        return a.title.localeCompare(b.title, "id", { sensitivity: "base" });
      case "title_desc":
        return b.title.localeCompare(a.title, "id", { sensitivity: "base" });
      case "newest":
      default:
        return b.at - a.at;
    }
  });
});

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
const initialFilters = computed(() => activeFilters.value);
const initialSortToken = computed(() => "sort:" + historySort.value);
const emptyState = computed(() => !sortedItems.value.length);
const showSkeleton = computed(() => booting.value);

// Copy for the empty state — placed AFTER the skeleton gate on purpose: the gate must win first paint.
const emptyMessage = computed(() => {
  if (searchQuery.value.trim())
    return `Tidak ada riwayat untuk "${searchQuery.value.trim()}"`;
  if (historyFilter.value === "all")
    return "Belum ada riwayat — mulai quiz pertamamu →";
  return `Belum ada riwayat ${historyFilter.value === "place" ? "tempat" : "makanan"} — mulai quiz pertamamu →`;
});
function onFilterApply(payload: { filters: string[]; sort: string }): void {
  const kindToken = payload.filters.find((t) => t.startsWith("kind:"));
  const kindVal = kindToken ? kindToken.split(":")[1] : "all";
  historyFilter.value = kindTokenToValue(kindVal);
  if (payload.sort) {
    const sortVal = payload.sort.startsWith("sort:")
      ? payload.sort.slice(5)
      : payload.sort;
    if (HISTORY_SORTS.some((s) => s.value === sortVal))
      historySort.value = sortVal as typeof historySort.value;
  }
  activeFilters.value = payload.filters;
}

function onFilterReset(): void {
  historyFilter.value = "all";
  historySort.value = "newest";
  activeFilters.value = [];
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 pb-10 py-5">
    <AppLoader v-if="showSkeleton" variant="history" />

    <template v-else>
      <p class="text-[11px] font-bold text-gray-500 mb-3">
        Terakhir dilihat — max 20 · simpan di HP ini
      </p>
      <!-- Search + filter button (side by side); filter drawer FD14 handles jenis + sort. -->
      <div class="flex gap-2 mb-3 items-stretch">
        <div
          class="flex-1 min-w-0 h-11 bg-white border border-[#e4e4e7] rounded-xl px-3.5 text-[13px] text-gray-500 flex gap-2 items-center"
        >
          🔍
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Cari riwayat... mis. kopi"
            class="bg-transparent outline-none flex-1 min-w-0 text-ink placeholder:text-gray-400"
            data-testid="history-search"
          />
        </div>
        <button
          type="button"
          class="flex-none h-11 text-[12px] font-extrabold rounded-xl px-3.5 border-[1.5px] flex items-center gap-1"
          :style="
            activeFilters.length
              ? 'background:#18181b;color:#fff;border-color:#18181b'
              : 'background:#fff;color:#18181b;border-color:#e4e4e7'
          "
          data-testid="open-filter"
          @click="showFilter = true"
        >
          Filter
          <span
            v-if="activeFilters.length"
            class="text-[10px] font-extrabold rounded-full px-1.5"
            style="background: #e11d48; color: #fff"
            >{{ activeFilters.length }}</span
          >
        </button>
      </div>

      <div
        v-if="emptyState"
        class="rounded-2xl p-6 text-center bg-white border border-stone-200"
      >
        <p class="font-extrabold text-sm">
          {{ emptyMessage }}
        </p>
        <p class="text-[11px] text-gray-500 mt-1">
          {{
            searchQuery.trim()
              ? "Coba kata kunci lain atau ubah filter."
              : "Hasil quiz tempat & makan bakal muncul di sini"
          }}
        </p>
        <div v-if="!searchQuery.trim()" class="flex gap-2 mt-3">
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
          v-for="(it, i) in sortedItems"
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
  <FilterDrawer
    v-model:open="showFilter"
    title="Filter Riwayat"
    :groups="HISTORY_GROUPS"
    :sort-options="
      HISTORY_SORTS.map((s) => ({ value: 'sort:' + s.value, label: s.label }))
    "
    :initial-filters="initialFilters"
    :initial-sort="initialSortToken"
    @apply="onFilterApply"
    @reset="onFilterReset"
  />
</template>
