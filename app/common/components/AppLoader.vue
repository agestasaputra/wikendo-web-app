<!--
  common/components/AppLoader.vue — loading skeleton that MIRRORS the content it replaces.
  WHAT: 6 shapes, one per real layout + `count` (how many rows/cards to draw, so a "load more"
    block reuses the SAME bones instead of hand-rolling a thinner copy). Classes are copied
    from the live components so the skeleton → content swap does not shift the page:
      mall-list    → MallListPage card (name/sub + mall pill + 2 CTAs at min-h 56px)
      tenant-list  → TenantCard row (46px thumb + name/sub + chevron)
      result-place → PlaceResultPage hero deck (5px strip + 150px photo + badges + 3 CTAs + rank box)
      result-food  → FoodResultPage BEST MATCH card (2 badges + gift banner + 2 CTAs)
      history-list → HistoryPage Image Card (120px band + p-4 title/sub/time)
      account      → AccountPage identity card (48px avatar + name/email) + 4 hub rows
  WHY: a spinner floating above a card list teaches nothing and causes layout jump. The shape
    itself is the loading affordance: the user already sees the list they are waiting for.
  Props: variant (copy + accent) · layout (override shape; mall detail uses tenant-list) ·
    count (default 4 card / 7 rows; load-more passes 2).
-->
<script setup lang="ts">
import { computed } from "vue";
import type { LoaderLayout, LoaderVariant } from "~/common/types/loader";
import {
  defaultCount,
  defaultLayout,
  getLoaderMeta,
} from "~/common/utils/loader";

const props = withDefaults(
  defineProps<{
    variant: LoaderVariant;
    layout?: LoaderLayout;
    count?: number;
  }>(),
  { layout: undefined, count: undefined },
);

const meta = computed(() => getLoaderMeta(props.variant));
/** Resolve the shape BEFORE counting: a variant can override the layout (mall detail → rows). */
const layout = computed<LoaderLayout>(
  () => props.layout ?? defaultLayout(props.variant),
);
/** How many bones to draw, from the RESOLVED layout (mall list 4 · tenant rows 7 · history 3). */
const rows = computed(() => props.count ?? defaultCount(layout.value));
const bone = "bg-gray-200 animate-pulse";
</script>

<template>
  <div role="status" aria-live="polite">
    <!-- ── mall index: the actual MallListPage card ───────────────────────── -->
    <div
      v-if="layout === 'mall-list'"
      class="flex flex-col gap-2.5"
      :class="count ? '' : 'mt-3'"
      aria-hidden="true"
    >
      <div
        v-for="i in rows"
        :key="i"
        class="bg-white rounded-2xl border border-gray-100 p-4"
      >
        <div class="flex justify-between items-center">
          <div class="flex-1">
            <div :class="bone" class="h-4 w-2/3 rounded" />
            <div :class="bone" class="h-3 w-1/3 rounded mt-2" />
          </div>
          <div :class="bone" class="h-6 w-20 rounded-full" />
        </div>
        <div class="flex gap-2 mt-3">
          <div :class="bone" class="flex-1 h-14 rounded-[14px]" />
          <div :class="bone" class="flex-1 h-14 rounded-[14px]" />
        </div>
      </div>
    </div>

    <!-- ── mall detail: the actual TenantCard row ─────────────────────────── -->
    <div
      v-else-if="layout === 'tenant-list'"
      class="flex flex-col gap-2.5"
      :class="count ? '' : 'mt-3'"
      aria-hidden="true"
    >
      <div
        v-for="i in rows"
        :key="i"
        class="border border-gray-100 rounded-2xl p-2.5 bg-white flex gap-2.5 items-center"
      >
        <div :class="bone" class="w-[46px] h-[46px] flex-none rounded-xl" />
        <div class="flex-1">
          <div :class="bone" class="h-4 w-2/3 rounded" />
          <div :class="bone" class="h-3 w-1/3 rounded mt-1.5" />
        </div>
        <div :class="bone" class="h-4 w-4 rounded" />
      </div>
    </div>

    <!-- ── place result: the actual hero deck + rank box ──────────────────── -->
    <div
      v-else-if="layout === 'result-place'"
      class="flex flex-col gap-3 mt-1"
      aria-hidden="true"
    >
      <div
        class="overflow-hidden shadow-lg relative flex"
        style="border-radius: 24px; border: 1px solid #eee; background: #fff"
      >
        <div :class="bone" class="w-[5px] flex-none" />
        <div class="flex-1">
          <div :class="bone" class="h-[150px] w-full" />
          <div class="p-[14px_16px]">
            <div class="flex gap-1.5 mb-2">
              <div :class="bone" class="h-6 w-24 rounded-full" />
              <div :class="bone" class="h-6 w-28 rounded-full" />
            </div>
            <div :class="bone" class="h-5 w-3/4 rounded" />
            <div :class="bone" class="h-3 w-full rounded mt-2" />
            <div :class="bone" class="h-3 w-5/6 rounded mt-1.5" />
            <div class="flex gap-2.5 mt-3">
              <div
                :class="bone"
                class="flex-1 rounded-2xl"
                style="min-height: 56px"
              />
              <div
                :class="bone"
                class="flex-1 rounded-2xl"
                style="min-height: 56px"
              />
              <div
                :class="bone"
                class="flex-1 rounded-2xl"
                style="min-height: 56px"
              />
            </div>
          </div>
        </div>
      </div>
      <div
        class="flex flex-col gap-2 rounded-2xl p-3"
        style="background: #f4f4f5"
      >
        <div v-for="i in 3" :key="i" class="space-y-1.5">
          <div :class="bone" class="h-3.5 w-1/2 rounded" />
          <div :class="bone" class="h-3 w-4/5 rounded" />
        </div>
      </div>
    </div>

    <!-- ── food result: the actual BEST MATCH card ────────────────────────── -->
    <div
      v-else-if="layout === 'result-food'"
      class="flex flex-col gap-3 mt-1"
      aria-hidden="true"
    >
      <div
        class="shadow-lg rounded-[24px] overflow-hidden"
        style="background: #fff; border: 1px solid #eee"
      >
        <div class="p-4">
          <div class="flex gap-1.5 flex-wrap mb-2">
            <div :class="bone" class="h-6 w-28 rounded-full" />
            <div :class="bone" class="h-6 w-20 rounded-full" />
          </div>
          <div :class="bone" class="h-5 w-4/5 rounded" />
          <div :class="bone" class="h-3 w-2/3 rounded mt-2" />
          <div :class="bone" class="h-3 w-1/2 rounded mt-1.5" />
          <div
            class="rounded-[14px] p-3 mt-3"
            style="background: #fafaf9; border: 1px solid #f5f5f4"
          >
            <div :class="bone" class="h-4 w-1/2 rounded" />
            <div :class="bone" class="h-3 w-2/3 rounded mt-2" />
          </div>
          <div class="flex gap-2.5 mt-3">
            <div
              :class="bone"
              class="flex-1 rounded-2xl"
              style="min-height: 56px"
            />
            <div
              :class="bone"
              class="flex-1 rounded-2xl"
              style="min-height: 56px"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- ── history: the actual HistoryPage Image Card (120px band + p-4) ──── -->
    <div
      v-else-if="layout === 'history-list'"
      class="flex flex-col gap-3"
      aria-hidden="true"
    >
      <div
        v-for="i in rows"
        :key="i"
        class="rounded-2xl overflow-hidden bg-white border border-stone-200"
      >
        <div :class="bone" class="h-[120px] w-full" />
        <div class="p-4">
          <div :class="bone" class="h-5 w-2/3 rounded" />
          <div :class="bone" class="h-3 w-1/3 rounded mt-1.5" />
          <div :class="bone" class="h-3 w-16 rounded mt-2" />
        </div>
      </div>
    </div>

    <!-- ── account: the actual identity card + 4 hub rows ─────────────────── -->
    <div v-else-if="layout === 'account'" aria-hidden="true">
      <div class="rounded-2xl p-4 bg-white border border-stone-200">
        <div class="flex gap-3 items-center">
          <div :class="bone" class="w-12 h-12 flex-none rounded-full" />
          <div class="flex-1">
            <div :class="bone" class="h-4 w-1/2 rounded" />
            <div :class="bone" class="h-3 w-2/3 rounded mt-1.5" />
          </div>
        </div>
        <div
          :class="bone"
          class="w-full mt-3 rounded-2xl"
          style="height: 46px"
        />
      </div>
      <div
        class="rounded-2xl bg-white border border-stone-200 mt-3 overflow-hidden"
      >
        <div
          v-for="i in 4"
          :key="i"
          class="flex justify-between items-center px-4 py-3.5 border-b border-stone-100"
        >
          <div :class="bone" class="h-3.5 w-28 rounded" />
          <div :class="bone" class="h-3.5 w-3.5 rounded" />
        </div>
      </div>
    </div>

    <!-- ── fallback ──────────────────────────────────────────────────────── -->
    <div v-else class="py-10 text-center" aria-hidden="true">
      <div :class="bone" class="mx-auto mb-3 h-14 w-14 rounded-2xl" />
      <div :class="bone" class="mx-auto h-4 w-48 rounded" />
      <div :class="bone" class="mx-auto h-3 w-36 rounded mt-2" />
    </div>

    <p class="sr-only">{{ meta.title }} — {{ meta.hint }}</p>
  </div>
</template>
