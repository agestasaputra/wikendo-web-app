<!-- common/components/BottomNav.vue → Nav bawah E1 Home-Mall-Quiz+-Riwayat-Akun (Addendum docs/24).
APA: 5 tab max-w-md fixed bottom (aktif lime #A3E635 + dot) + Quiz+ center BUKAN route → sheet 2 intent quota jujur.
KENAPA: jempol tak sampai header; quota ikut GET /api/quota (gagal = fallback anon fresh 1 • 2, bukan angka bohong).
Contoh: tap + → sheet → Cari Tempat (sisa 1/1) → /quiz; habis → disabled Besok lagi 00.00. -->
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
  { to: "/riwayat", label: "Riwayat", icon: "🕒" },
  { to: "/account", label: "Akun", icon: "👤" },
];

const route = useRoute();
const showSheet = ref(false);

const { data: quotaData } = await useFetch<QuotaStatus>("/api/quota", {
  key: "quota",
  lazy: true,
});
const quotaStatus = computed(
  () =>
    quotaData.value ||
    buildQuotaStatus({ tempatUsed: 0, makanUsed: 0, isLoggedIn: false }),
);
const tempatLeft = computed(() => quotaStatus.value.tempat.remaining);
const tempatLimit = computed(() => quotaStatus.value.tempat.limit);
const makanLeft = computed(() => quotaStatus.value.makan.remaining);
const makanLimit = computed(() => quotaStatus.value.makan.limit);

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
    :tempat-left="tempatLeft"
    :tempat-limit="tempatLimit"
    :makan-left="makanLeft"
    :makan-limit="makanLimit"
    @go="go"
    @close="showSheet = false"
  />
</template>
