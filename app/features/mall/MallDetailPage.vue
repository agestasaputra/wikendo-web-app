<!-- features/mall/MallDetailPage.vue → GET /mall/:slug (SEO Directory, S2c Tenant Photo + S2b infinity + FD14 filter).
WHAT: search + FD14 filter drawer (halal/budget/mission) + tenant photo card + pre-filled quiz CTA,
  46px thumb + promo badge overlay, paper bg = PAGE_BG (app.vue) + infinity 10/page
  (sentinel + 2-row skeleton + sticky count "10/40").
WHY: S2b infinity — 40 tenants at once is heavy on low-end phones → 10/page, page-1 SSR stays (SEO safe),
  continues on client. Quiz CTA + search + chips STICKY so they aren't thrown off by scroll.
  Server-side filter (reset page); client-side keyword on top of loaded items (spec S2b: filtered = keyword(client) + page(server)).
FD14: chip dikelompokkan + pill Urutkan + footer "Terapkan Filter" rose → satu komponen FilterDrawer
  dipakai Mall List / Mall Detail / History supaya kontrol filter konsisten.
Token lock: ink stays #0C0A09, rose stays #E11D48, paper = PAGE_BG (one owner). -->
<script setup lang="ts">
import AppLoader from "~/common/components/AppLoader.vue";
import FilterDrawer from "~/common/components/FilterDrawer.vue";
import { PAGE_BG } from "~/common/constants/theme";
import { useInfiniteList } from "~/common/composables/useInfiniteList";
import { useSentinelObserver } from "~/common/composables/useSentinelObserver";
import { computed, reactive, ref, watch } from "vue";
import type { InfiniteFetchPage } from "~/common/types/pagination";
import { getMallName, getMallShortLabel } from "~/common/utils/mall";
import type { DirectoryFilters, TenantItem } from "~/features/mall/@types/mall";
import PromoStrip from "~/features/mall/components/PromoStrip.vue";
import TenantCard from "~/features/mall/components/TenantCard.vue";
import {
  buildDirCountLabel,
  buildTenantQuery,
} from "~/features/mall/utils/directory";
import { getTenantPromo } from "~/features/mall/utils/tenantCard";

// Filter drawer (FD14): grup Halal / Budget / Mission — nilai token `halal:true`, `budget:mid`,
// `mission:long_hangout`. Server-side via query, changing filter = reset page.
const FILTER_GROUPS = [
  {
    title: "Preferensi",
    mode: "multi" as const,
    options: [{ value: "halal:true", label: "✅ Halal" }],
  },
  {
    title: "Budget",
    mode: "multi" as const,
    options: [{ value: "budget:mid", label: "💰 50-100rb" }],
  },
  {
    title: "Mission",
    mode: "multi" as const,
    options: [{ value: "mission:long_hangout", label: "☕ Nongkrong Lama" }],
  },
];

const route = useRoute();
const slug = route.params.slug as string;
const mallName = computed(() => getMallName(slug));
// S2c 1:1: breadcrumb short label (GI), not the raw slug.
const mallShort = computed(() => getMallShortLabel(slug));
const keyword = ref("");
const filters = reactive<DirectoryFilters>({
  halal: false,
  budget: false,
  mission: false,
});
const showFilter = ref(false);
const activeFilters = ref<string[]>([]);

let searchTimer: ReturnType<typeof setTimeout> | null = null;
const searchQuery = ref("");
watch(
  keyword,
  (value) => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery.value = value.trim();
      list.reset();
    }, 300);
  },
  { immediate: false },
);

// Directory SEO: title + description per mall (Google → tenant → quiz funnel).
useHead({
  title: `Direktori Kuliner ${mallName.value} — Wikendo`,
  meta: [
    {
      name: "description",
      content: `List tenant ${mallName.value} curated: halal, budget, kids-friendly. Males scroll? Quiz 20 detik → 5 tenant + voucher.`,
    },
    {
      property: "og:title",
      content: `Direktori ${mallName.value} — Wikendo`,
    },
    {
      property: "og:description",
      content: `Tenant ${mallName.value} curated: halal, budget, kids-friendly.`,
    },
    { property: "og:url", content: `https://www.wikendo.id/mall/${slug}` },
    {
      property: "og:image",
      content: "https://www.wikendo.id/og-default.png",
    },
  ],
  link: [{ rel: "canonical", href: `https://www.wikendo.id/mall/${slug}` }],
});

// S2b infinity: server-side filter (reset page), client-side keyword (spec: keyword(client) + page(server)).
const list = useInfiniteList<TenantItem>({
  pageSize: 10,
  key: `mall-detail-${slug}`,
  keyOf: (t) => t.name,
  fetchPage: (limit, offset) =>
    $fetch<InfiniteFetchPage<TenantItem>>(`/api/malls/${slug}/tenants`, {
      params: {
        limit,
        offset,
        ...buildTenantQuery(filters),
        ...(searchQuery.value ? { search: searchQuery.value } : {}),
      },
    }),
});
if (import.meta.server) await list.start();
else void list.start();
const { items: tenants, total, hasMore, pending, loadingMore, error } = list;
const sentinel = useSentinelObserver(() => list.loadMore());

function syncFiltersFromTokens(tokens: string[]): void {
  filters.halal = tokens.includes("halal:true");
  filters.budget = tokens.includes("budget:mid");
  filters.mission = tokens.includes("mission:long_hangout");
}

function onFilterApply(payload: { filters: string[]; sort: string }): void {
  activeFilters.value = payload.filters;
  syncFiltersFromTokens(payload.filters);
  list.reset();
}

function onFilterReset(): void {
  activeFilters.value = [];
  syncFiltersFromTokens([]);
  list.reset();
}

// Infinity pill S2c 1:1 (tested): 🟢 loaded/total tenants · scroll ↓ (only show when more results exist)
const dirCount = computed(() =>
  hasMore.value
    ? buildDirCountLabel(
        tenants.value.length,
        total.value || tenants.value.length,
      )
    : `🟢 ${tenants.value.length}/${total.value || tenants.value.length} tenant (semua)`,
);
const filtered = computed(() => tenants.value);
// V13C promo strip (Addendum 23 v1.1): tenants that HAVE a real promo badge, above the list; slice 3 to save low-end phones.
const promoStrip = computed(() =>
  tenants.value.filter((t) => !!getTenantPromo(t)).slice(0, 3),
);
</script>

<template>
  <div class="max-w-md mx-auto px-4 py-2 pb-10">
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-extrabold">🏢 {{ mallName }}</h1>
      <span class="text-xs font-bold text-gray-500">{{
        pending ? "…" : `${total || tenants.length} tenant`
      }}</span>
    </div>

    <!-- Sticky: search + filter button (side by side) + CTA (S2b spec: not thrown off by scroll) -->
    <div class="sticky top-0 pt-2 pb-2" :style="{ background: PAGE_BG }">
      <div class="flex gap-2 items-stretch">
        <div
          class="flex-1 min-w-0 h-11 bg-white border border-[#e4e4e7] rounded-xl px-3.5 text-[13px] text-gray-500 flex gap-2 items-center"
        >
          🔍
          <input
            v-model="keyword"
            placeholder="Cari tenant... mis. kopi, ramen"
            class="bg-transparent outline-none flex-1 min-w-0 text-ink placeholder:text-gray-400"
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

      <!-- Directory → quiz bridge CTA (S2c ASSISTANT CARD: lime strip + ink-lime avatar + 2 lines + arrow) -->
      <NuxtLink
        :to="`/food?mall=${slug}`"
        class="block rounded-[14px] p-3.5 bg-white border border-gray-100 mt-1"
        style="border-left: 4px solid #a3e635"
      >
        <div class="flex gap-2.5 items-center">
          <div
            class="w-9 h-9 flex-none rounded-full flex items-center justify-center text-[16px]"
            style="background: #0c0a09"
          >
            🤖
          </div>
          <div class="flex-1 text-[13px] leading-snug">
            <b>Ceritain mau makan apa →</b><br />
            <small class="text-gray-500"
              >quiz 20 dtk · tanpa login · hasil murni {{ mallShort }}</small
            >
          </div>
          <div class="font-extrabold">→</div>
        </div>
      </NuxtLink>
    </div>

    <!-- S2c infinity count pill -->
    <p
      v-if="!pending && tenants.length"
      class="inline-block text-[11px] font-extrabold px-2.5 py-1 rounded-full mt-3"
      style="background: #0c0a09; color: #fff"
    >
      {{ dirCount }}
    </p>

    <PromoStrip
      v-if="!pending && promoStrip.length"
      :tenants="promoStrip"
      :slug="slug"
      :mall-short="mallShort"
    />

    <!-- Tenant card (S2c Tenant Photo mockup): 46px photo thumb + promo badge overlay -->
    <AppLoader v-if="pending" variant="mall" layout="tenant-list" />
    <div
      v-else-if="error"
      class="rounded-2xl p-4 text-sm font-bold mt-3"
      style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b"
    >
      Gagal muat tenant.<br /><button
        class="underline mt-1 disabled:opacity-60"
        :disabled="pending"
        @click="list.reset()"
      >
        Coba lagi →
      </button>
    </div>
    <div v-else class="flex flex-col gap-2.5 mt-3">
      <TenantCard v-for="t in filtered" :key="t.name" :tenant="t" />
      <p v-if="!filtered.length" class="text-center text-sm text-gray-500 py-8">
        Tidak ada tenant cocok. Coba ubah filter.
      </p>
      <!-- 2-row skeleton when adding a page (S2b spec) — same row as TenantCard above -->
      <AppLoader
        v-if="loadingMore"
        variant="mall"
        layout="tenant-list"
        :count="2"
      />
      <!-- Infinity scroll sentinel — also tappable fallback if IntersectionObserver never fires -->
      <button
        v-if="hasMore"
        ref="sentinel"
        type="button"
        class="w-full text-center text-xs text-gray-400 py-3 disabled:opacity-50"
        :disabled="loadingMore"
        @click="list.loadMore()"
      >
        Muat tenant berikut… ({{ tenants.length }}/{{ total }})
      </button>
      <p
        v-else-if="tenants.length"
        class="text-center text-xs text-gray-400 py-2"
      >
        Semua {{ total }} tenant tampil ✅
      </p>
    </div>

    <FilterDrawer
      v-model:open="showFilter"
      title="Filter Tenant"
      :groups="FILTER_GROUPS"
      :sort-options="[]"
      :initial-filters="activeFilters"
      :initial-sort="''"
      @apply="onFilterApply"
      @reset="onFilterReset"
    />
  </div>
</template>
