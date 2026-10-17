<!-- features/mall/MallListPage.vue → GET /mall (Directory hub index, D1 Neutral Mall Hub ⭐ + S2b infinity).
WHAT: mall card list (name + area + tenant count) + 2 CTAs per card (Lihat Tenant / Cariin yang cocok), mall label INK (#0C0A09), "Cariin" CTA rose (#E11D48), paper bg (#F5F5F4) + infinity scroll 10/page (sentinel + 2-row skeleton + sticky count).
WHY: D1 "Mall Hub · Neutral" + S2b infinity — 5 malls is light now, but the SAME pattern as detail (40 tenants) → 1 useInfiniteList composable, backward-compat API (no ?limit = legacy array). Page-1 SSR via await start() (SEO stays).
Token lock: ink stays #0C0A09, rose stays #E11D48, paper stays #F5F5F4. -->
<script setup lang="ts">
import AppLoader from "~/common/components/AppLoader.vue";
import { useInfiniteList } from "~/common/composables/useInfiniteList";
import { useSentinelObserver } from "~/common/composables/useSentinelObserver";
import type { InfiniteFetchPage } from "~/common/types/pagination";
import { getMallName, getMallShortLabel } from "~/common/utils/mall";
import type { MallItem } from "~/features/mall/@types/mall";
import { shortArea } from "~/features/mall/utils/directory";

// SEO hub: /mall = directory entrypoint (hub → 5 leaves /mall/:slug, Google likes this structure).
useHead({
  title: "Direktori Kuliner Mall Jakarta — Wikendo",
  meta: [
    {
      name: "description",
      content:
        "Direktori kuliner curated 5 mall Jakarta: Grand Indonesia, Central Park, Kokas, PIM, Aeon BSD. Males scroll? Quiz 20 detik → 5 tenant + voucher.",
    },
  ],
});

// S2b infinity: page-1 SSR (await start, SEO stays), continues on client via sentinel.
const list = useInfiniteList<MallItem>({
  pageSize: 10,
  key: "mall-list",
  keyOf: (m) => m.slug,
  fetchPage: (limit, offset) =>
    $fetch<InfiniteFetchPage<MallItem>>("/api/malls", {
      params: { limit, offset },
    }),
});
if (import.meta.server) await list.start();
else void list.start();
const { items: malls, hasMore, pending, loadingMore, error } = list;
const sentinel = useSentinelObserver(() => list.loadMore());

// D1 1:1: short area = shortest '/' segment (Thamrin, Grogol), fallback city.
function mallArea(m: MallItem): string {
  return shortArea(m.area || m.city || "");
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 pb-10" style="background: #f5f5f4">
    <div
      class="flex justify-between items-center sticky top-0 py-2"
      style="background: #f5f5f4"
    >
      <h1 class="text-xl font-extrabold">🏢 Mall</h1>
      <span class="text-xs font-bold text-gray-500">{{
        pending ? "…" : "5 mall"
      }}</span>
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
      <!-- 2-row skeleton when adding a page (S2b spec) -->
      <div v-if="loadingMore" class="flex flex-col gap-2.5" aria-live="polite">
        <div
          v-for="i in 2"
          :key="i"
          class="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse"
        >
          <div class="h-4 rounded w-2/3" style="background: #f5f5f4" />
          <div class="h-3 rounded w-1/3 mt-2" style="background: #f5f5f4" />
        </div>
      </div>
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
