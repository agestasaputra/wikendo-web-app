<!-- common/components/BottomNav.vue → E1 bottom nav Home-Mall-Quiz+-Riwayat-Akun (Addendum docs/24).
WHAT: 5 tabs in a fixed max-w-md bottom bar (active lime #A3E635 + dot) + Quiz+ in the center is NOT a route → sheet with 2 honest quota intents.
WHY: thumbs can't reach the header; quota follows GET /api/quota (on failure = fallback to fresh anonymous 1 • 2, not fake numbers).
EXAMPLE: tap + → sheet → Cari Tempat (remaining 1/1) → /quiz; empty → disabled Besok lagi 00.00. -->
<script setup lang="ts">
import { computed, ref } from "vue";
import QuizPlusSheet from "~/common/components/QuizPlusSheet.vue";
import type { QuotaStatus } from "~/common/types/quota";
import { isNavActive } from "~/common/utils/nav";
import { buildQuotaStatus } from "~/common/utils/quota";

interface NavTab {
  to: string;
  label: string;
  icon: string;
}

const LEFT_TABS: NavTab[] = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/mall", label: "Mall", icon: "🏬" },
];
const RIGHT_TABS: NavTab[] = [
  { to: "/history", label: "Riwayat", icon: "🕒" },
  { to: "/account", label: "Akun", icon: "👤" },
];

const route = useRoute();
const showSheet = ref(false);

const { data: quotaData } = await useFetch<QuotaStatus>("/api/quota");
const quotaStatus = computed(
  () =>
    quotaData.value ||
    buildQuotaStatus({ placeUsed: 0, foodUsed: 0, isLoggedIn: false }),
);
const placeLeft = computed(() => quotaStatus.value.place.remaining);
const placeLimit = computed(() => quotaStatus.value.place.limit);
const foodLeft = computed(() => quotaStatus.value.food.remaining);
const foodLimit = computed(() => quotaStatus.value.food.limit);

function go(path: string): void {
  showSheet.value = false;
  navigateTo(path);
}
</script>

<template>
  <nav
    aria-label="Pilih jenis quiz dan navigasi"
    class="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200"
  >
    <div
      class="max-w-md mx-auto px-2 pt-1.5 flex items-end justify-between"
      style="padding-bottom: calc(10px + env(safe-area-inset-bottom))"
    >
      <NuxtLink
        v-for="tab in LEFT_TABS"
        :key="tab.to"
        :to="tab.to"
        :aria-label="tab.label"
        class="flex-1 flex flex-col items-center gap-0.5 py-1 text-[10px] font-extrabold"
        :style="{
          color: isNavActive(tab.to, route.path) ? '#0C0A09' : '#78716c',
        }"
      >
        <span class="text-xl leading-none">{{ tab.icon }}</span
        >{{ tab.label }}
        <span
          v-if="isNavActive(tab.to, route.path)"
          class="w-1 h-1 rounded-full"
          style="background: #a3e635"
        />
      </NuxtLink>
      <div class="flex-1 flex flex-col items-center -mt-5">
        <button
          type="button"
          aria-label="Quiz+ buka pilihan quiz"
          class="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-extrabold text-white shadow-lg border-4 border-white"
          style="background: #0c0a09"
          @click="showSheet = true"
        >
          +
        </button>
        <span class="text-[10px] font-extrabold" style="color: #0c0a09"
          >Quiz+</span
        >
      </div>
      <NuxtLink
        v-for="tab in RIGHT_TABS"
        :key="tab.to"
        :to="tab.to"
        :aria-label="tab.label"
        class="flex-1 flex flex-col items-center gap-0.5 py-1 text-[10px] font-extrabold"
        :style="{
          color: isNavActive(tab.to, route.path) ? '#0C0A09' : '#78716c',
        }"
      >
        <span class="text-xl leading-none">{{ tab.icon }}</span
        >{{ tab.label }}
        <span
          v-if="isNavActive(tab.to, route.path)"
          class="w-1 h-1 rounded-full"
          style="background: #a3e635"
        />
      </NuxtLink>
    </div>
  </nav>

  <QuizPlusSheet
    v-if="showSheet"
    :place-left="placeLeft"
    :place-limit="placeLimit"
    :food-left="foodLeft"
    :food-limit="foodLimit"
    @go="go"
    @close="showSheet = false"
  />
</template>
