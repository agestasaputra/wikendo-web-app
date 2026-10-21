<!-- features/mall/MallListPage.vue → GET /mall (Directory hub index, D1 Neutral Mall Hub ⭐ + S2b infinity).
WHAT: mall card list (name + area + tenant count) + 2 CTAs per card (Lihat Tenant / Cariin yang cocok), mall label INK (#0C0A09), "Cariin" CTA rose (#E11D48), paper bg = PAGE_BG (app.vue) + infinity scroll 10/page (sentinel + 2-row skeleton + sticky count).
WHY: D1 "Mall Hub · Neutral" + S2b infinity — 5 malls is light now, but the SAME pattern as detail (40 tenants) → 1 useInfiniteList composable, backward-compat API (no ?limit = legacy array). Page-1 SSR via await start() (SEO stays).
Token lock: ink stays #0C0A09, rose stays #E11D48, paper = PAGE_BG (one owner). -->
<script setup lang="ts">
import AppLoader from "~/common/components/AppLoader.vue";
import { PAGE_BG } from "~/common/constants/theme";
import { useInfiniteList } from "~/common/composables/useInfiniteList";
import { useSentinelObserver } from "~/common/composables/useSentinelObserver";
import type { InfiniteFetchPage } from "~/common/types/pagination";
import { getMallName, getMallShortLabel } from "~/common/utils/mall";
import type { MallItem } from "~/features/mall/@types/mall";
import { shortArea } from "~/features/mall/utils/directory";
import { ref, watch } from "vue";

const searchMall = ref("");
const sortOption = ref("name_asc"); // name_asc | name_desc | tenant_asc | tenant_desc
const searchMallQuery = ref("");
let mallSearchTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchMall, (value) => {
  if (mallSearchTimer) clearTimeout(mallSearchTimer);
  // 300ms debounce: typing "grand" must not fire 5 mall requests.
  mallSearchTimer = setTimeout(() => {
    searchMallQuery.value = value.trim();
  }, 300);
});

// SEO hub: /mall = directory entrypoint (hub → 5 leaves /mall/:slug, Google likes this structure).
useHead({
  title: "Direktori Kuliner Mall Jakarta — Wikendo",
  meta: [
    {
      name: "description",
      content:
        "Direktori kuliner curated 5 mall Jakarta: Grand Indonesia, Central Park, Kokas, PIM, Aeon BSD. Males scroll? Quiz 20 detik → 5 tenant + voucher.",
    },
    {
      property: "og:title",
      content: "Direktori Kuliner Mall Jakarta — Wikendo",
    },
    { property: "og:url", content: "https://www.wikendo.id/mall" },
  ],
  link: [{ rel: "canonical", href: "https://www.wikendo.id/mall" }],
});

// S2b infinity: page-1 SSR (await start, SEO stays), continues on client via sentinel.
const list = useInfiniteList<MallItem>({
  pageSize: 10,
  key: "mall-list",
  keyOf: (m) => m.slug,
  fetchPage: (limit, offset) =>
    $fetch<InfiniteFetchPage<MallItem>>("/api/malls", {
      params: {
        limit,
        offset,
        ...(searchMallQuery.value ? { search: searchMallQuery.value } : {}),
        ...(sortOption.value !== "name_asc" ? { sort: sortOption.value } : {}),
      },
    }),
});
// Any change of query/sort = new result set → back to page 1 (never append stale pages).
watch(
  [searchMallQuery, sortOption],
  () => {
    void list.reset();
  },
  { deep: true },
);
if (import.meta.server) await list.start();
else void list.start();
const { items: malls, total, hasMore, pending, loadingMore, error } = list;
const sentinel = useSentinelObserver(() => list.loadMore());
const SORT_OPTIONS = [
  { value: "name_asc", label: "A→Z" },
  { value: "name_desc", label: "Z→A" },
  { value: "tenant_desc", label: "Tenant terbanyak" },
  { value: "tenant_asc", label: "Tenant paling sedikit" },
];

// D1 1:1: short area = shortest '/' segment (Thamrin, Grogol), fallback city.
function mallArea(m: MallItem): string {
  return shortArea(m.area || m.city || "");
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 pb-10">
    <div
      class="flex justify-between items-center sticky top-0 py-2"
      :style="{ background: PAGE_BG }"
    >
      <h1 class="text-xl font-extrabold">🏢 Mall</h1>
      <span class="text-xs font-bold text-gray-500">{{
        pending ? "…" : `${malls.length}/${total || malls.length} mall`
      }}</span>
    </div>

    <!-- Search + sort (server-side, reset page on change): 5 malls now, stays correct when the hub grows. -->
    <div class="sticky top-[38px] pt-1 pb-2" :style="{ background: PAGE_BG }">
      <div
        class="bg-white border border-[#e4e4e7] rounded-xl px-3.5 py-2.5 text-[13px] text-gray-500 flex gap-2 items-center"
      >
        🔍
        <input
          v-model="searchMall"
          placeholder="Cari mall... mis. grand, BSD"
          class="bg-transparent outline-none flex-1 text-ink placeholder:text-gray-400"
        />
        <button
          v-if="searchMall"
          type="button"
          class="text-gray-400 font-bold"
          aria-label="Hapus pencarian"
          @click="searchMall = ''"
        >
          ✕
        </button>
      </div>
      <div class="flex gap-1.5 mt-2 overflow-x-auto pb-0.5">
        <button
          v-for="opt in SORT_OPTIONS"
          :key="opt.value"
          type="button"
          :disabled="pending"
          class="text-[11.5px] font-bold rounded-full px-3 py-1.5 bg-white border-[1.5px] whitespace-nowrap disabled:opacity-60"
          :style="
            sortOption === opt.value
              ? 'background:#18181b;color:#fff;border-color:#18181b'
              : 'border-color:#e4e4e7'
          "
          @click="sortOption = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
    <AppLoader v-if="pending" variant="mall" />
    <div
      v-else-if="error"
      class="rounded-2xl p-4 text-sm font-bold mt-3"
      style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b"
    >
      Gagal muat mall.<br /><button
        class="underline mt-1 disabled:opacity-60"
        :disabled="pending"
        @click="list.reset()"
      >
        Coba lagi →
      </button>
    </div>
    <div v-else class="flex flex-col gap-2.5 mt-3">
      <div
        v-for="m in malls"
        :key="m.slug"
        class="bg-white rounded-2xl border border-gray-100 p-4"
      >
        <div class="flex justify-between items-center">
          <div>
            <b class="text-[15px]">{{ getMallName(m.slug) }}</b>
            <p class="text-xs text-gray-500">
              {{ mallArea(m) }} ·
              {{ m.total_tenant ? m.total_tenant + " tenant" : "40 tenant" }}
            </p>
          </div>
          <span
            class="text-[11px] font-extrabold px-2.5 py-1 rounded-full"
            style="background: #0c0a09; color: #fff"
            >{{ getMallShortLabel(m.slug) }}</span
          >
        </div>
        <div class="flex gap-2 mt-3">
          <NuxtLink
            :to="`/mall/${m.slug}`"
            class="flex-1 text-center bg-white rounded-[14px] p-3 font-extrabold text-[13px] border-2 border-gray-200"
            style="min-height: 56px"
          >
            🏢 Lihat Tenant →
          </NuxtLink>
          <NuxtLink
            :to="`/food?mall=${m.slug}`"
            class="flex-1 text-center text-white rounded-[14px] p-3 font-extrabold text-[13px]"
            style="background: #e11d48; min-height: 56px"
          >
            ✨ Carlin →
          </NuxtLink>
        </div>
      </div>
      <!-- 2-row skeleton when adding a page (S2b spec) — same bones as the card above -->
      <AppLoader v-if="loadingMore" variant="mall" :count="2" />
      <!-- Infinity scroll sentinel -->
      <div
        v-if="hasMore"
        ref="sentinel"
        class="text-center text-xs text-gray-400 py-3"
      >
        Muat mall berikut…
      </div>
    </div>
  </div>
</template>
