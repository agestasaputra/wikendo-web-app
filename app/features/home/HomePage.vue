<!-- features/home/HomePage.vue → GET / (Home Superapp I17 V2 Ember P1, full slice from the V2 screenshot).
WHAT: greeting header + quota hero ink with ember strip + 2 ink CTAs + 4 icons + recommendations + AI + history.
WHY: home has only 1 job — push landing→quiz >40% (PRD §4). Hero = honest scarcity following GET /api/quota.
EXAMPLE: real quota is wired to GET /api/quota (server/api/quota.get.ts endpoint); loading = skeleton, error = fallback 1 • 2.
Tokens via getHomeHeroMeta(): ink #0C0A09 + ember strip #EA580C + number #D9F99D + lime pill #A3E635. -->
<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useAuthStore } from "~/common/store/AuthStore";
import { useAuthFetch } from "~/common/composables/useAuthFetch";
import type { QuotaStatus } from "~/common/types/quota";
import { buildQuotaStatus, buildWalletLabel } from "~/common/utils/quota";
import { getHomeHeroMeta } from "~/features/home/utils/homeHero";

// Auth-state AS6 wallet-card: anonymous 1:1, logged-in greeting Halo {displayName} + Sisa kamu sub.
const { isLoggedIn, displayName, initial } = storeToRefs(useAuthStore());
// Home SEO: GEO-friendly (og + description ID). /mall/:slug directory comes later in slice-4.
useHead({
  title: "Wikendo — Bingung Weekend Mau Kemana?",
  meta: [
    {
      name: "description",
      content:
        "Quiz 30 detik → 5 rekomendasi tempat weekend. Quiz 20 detik → 5 tenant mall + voucher. Gratis, quota reset tiap hari.",
    },
    {
      property: "og:title",
      content: "Wikendo — Bingung Weekend Mau Kemana?",
    },
    {
      property: "og:description",
      content:
        "Quiz 30 detik → 5 rekomendasi tempat. Quiz makan → 5 tenant + voucher. Gratis.",
    },
    { property: "og:url", content: "https://www.wikendo.id/" },
  ],
  link: [{ rel: "canonical", href: "https://www.wikendo.id/" }],
});
// Hero tokens I17 V2 Ember P1 — single source of truth, not hardcoded hex in the template.
const hero = getHomeHeroMeta();
// Real quota: GET /api/quota → logged-in 2•5, anonymous 1•1 (server-counted from `generations`).
// WHY 2 fetchers: in the browser the Bearer token is REQUIRED (the Supabase session lives in
// localStorage); during SSR there is no token but the incoming cookies MUST be forwarded or the
// anonymous gate would count a brand-new device on every render. Failed fetch = fresh anon fallback.
const quotaFetch = import.meta.server ? useRequestFetch() : useAuthFetch();
const {
  data: quotaData,
  pending: quotaPending,
  error: quotaError,
} = await useFetch<QuotaStatus>("/api/quota", {
  key: "quota",
  lazy: true,
  $fetch: quotaFetch,
});
const quotaStatus = computed(
  () =>
    quotaData.value ||
    buildQuotaStatus({ placeUsed: 0, foodUsed: 0, isLoggedIn: false }),
);
// The payload can be SWR-cached; re-read on mount + whenever auth flips so the wallet (and
// BottomNav's copy of it) never shows a stale number after a quiz success.
onMounted(() => void refreshNuxtData("quota"));
watch(
  () => isLoggedIn.value,
  () => void refreshNuxtData("quota"),
);
const wallet = computed(() => buildWalletLabel(quotaStatus.value));
</script>

<template>
  <div class="max-w-md mx-auto px-4 pb-10">
    <!-- Greeting header — AS6 wallet-card: anonymous 1:1 (👦 + teman Wikendo), logged in avatar initial + Halo {displayName} + Sisa kamu sub -->
    <div class="flex justify-between items-center font-bold text-sm py-3">
      <span class="flex items-center gap-2">
        <span
          class="w-6 h-6 rounded-full flex items-center justify-center text-[13px] text-white"
          :style="{ background: hero.headBg }"
          >{{ isLoggedIn ? initial : "👦" }}</span
        >
        <span
          >Halo,
          {{ isLoggedIn && displayName ? displayName : "teman Wikendo" }}</span
        >
      </span>
    </div>
    <p v-if="isLoggedIn" class="text-[11px] font-bold opacity-60 -mt-1.5 mb-2">
      Sisa kamu: {{ quotaPending ? "…" : wallet.headline }}
    </p>

    <!-- QUOTA HARI INI hero — ink + ember strip V2 + dice watermark -->
    <div
      class="rounded-2xl p-3 text-white relative overflow-hidden"
      :style="{
        background: hero.headBg,
        borderLeft: '5px solid ' + hero.strip,
      }"
    >
      <p class="text-[10px] font-extrabold tracking-wide opacity-75">
        QUOTA HARI INI • reset 00.00
      </p>
      <p
        class="text-2xl font-extrabold leading-tight mt-0.5"
        :style="{ color: hero.numColor }"
      >
        {{ quotaPending ? "…" : wallet.headline }}
      </p>
      <p class="text-[11px] font-bold opacity-80 mt-0.5">
        {{
          isLoggedIn
            ? "Sisa kamu hari ini — reset 00.00"
            : "Gratis hari ini — login dapat 2 tempat + 5 makan + riwayat lintas device"
        }}
      </p>
      <div class="flex gap-1.5 mt-2">
        <span
          class="flex-1 rounded-lg px-1 py-1.5 text-center text-[10px] font-extrabold bg-white/10"
          >👥 {{ quotaPending ? "…" : wallet.placeChip }}</span
        >
        <span
          class="flex-1 rounded-lg px-1 py-1.5 text-center text-[10px] font-extrabold bg-white/10"
          >🍜 {{ quotaPending ? "…" : wallet.foodChip }}</span
        >
      </div>
      <NuxtLink
        to="/place"
        class="inline-block mt-2.5 rounded-full px-3.5 py-[7px] text-[11px] font-extrabold"
        :style="{ background: hero.pillBg, color: hero.pillColor }"
        >Mulai Quiz →</NuxtLink
      >
      <span
        class="absolute -right-2 top-1/2 -translate-y-1/2 text-[70px] opacity-20 pointer-events-none"
        >🎲</span
      >
      <NuxtLink
        v-if="!quotaPending && !quotaError && wallet.exhausted"
        to="/login"
        class="block text-center text-xs font-extrabold mt-2.5 underline"
        >🔒 Gratis hari ini sudah dipakai — Login gratis → 2 tempat + 5 makan +
        riwayat lintas device</NuxtLink
      >
    </div>

    <!-- 2 big ink CTAs — thumb-zone min 56px -->
    <div class="grid grid-cols-2 gap-1.5 mt-2">
      <NuxtLink
        to="/place"
        class="rounded-xl p-2.5 font-extrabold text-[10.5px] text-center leading-snug"
        :style="{
          background: hero.ctaBg,
          color: hero.ctaColor,
          minHeight: '56px',
        }"
      >
        🗺️<br />Cari Tempat<br /><small class="font-normal">quiz 30 dtk</small>
      </NuxtLink>
      <NuxtLink
        to="/food"
        class="rounded-xl p-2.5 font-extrabold text-[10.5px] text-center leading-snug"
        :style="{
          background: hero.ctaBg,
          color: hero.ctaColor,
          minHeight: '56px',
        }"
      >
        🍜<br />Cari Makan<br /><small class="font-normal">quiz 20 dtk</small>
      </NuxtLink>
    </div>

    <!-- 4 quick icons -->
    <div class="grid grid-cols-4 gap-1.5 mt-2">
      <NuxtLink to="/mall" class="text-center text-[9.5px] font-extrabold"
        ><i
          class="flex items-center justify-center w-[38px] h-[38px] rounded-full mx-auto mb-[3px] not-italic text-base bg-white shadow"
          >🏬</i
        >Mall</NuxtLink
      >
      <span class="text-center text-[9.5px] font-extrabold"
        ><i
          class="flex items-center justify-center w-[38px] h-[38px] rounded-full mx-auto mb-[3px] not-italic text-base bg-white shadow"
          >🎁</i
        >Promo</span
      >
      <span class="text-center text-[9.5px] font-extrabold"
        ><i
          class="flex items-center justify-center w-[38px] h-[38px] rounded-full mx-auto mb-[3px] not-italic text-base bg-white shadow"
          >❤️</i
        >Wishlist</span
      >
      <span class="text-center text-[9.5px] font-extrabold"
        ><i
          class="flex items-center justify-center w-[38px] h-[38px] rounded-full mx-auto mb-[3px] not-italic text-base bg-white shadow"
          >🕒</i
        >Riwayat</span
      >
    </div>

    <!-- Recommendations for you -->
    <div
      class="mt-2 rounded-xl px-2.5 py-2.5 bg-white shadow"
      :style="{ background: hero.cardBg }"
    >
      <div class="flex justify-between text-[11px] font-extrabold mb-1.5">
        <span>Rekomendasi buatmu</span>
        <small class="opacity-55 font-bold">Lihat Semua →</small>
      </div>
      <div
        class="flex justify-between items-center text-[10.5px] font-extrabold px-2 py-[7px] rounded-lg bg-[#FAFAF9] mt-1"
      >
        <span
          >🗺️ Rooftop Senayan<small
            class="block font-bold opacity-60 text-[9.5px]"
            >Senayan • 4,8 ★</small
          ></span
        >
        <b
          class="text-[9px] rounded-full px-2 py-0.5"
          :style="{ background: hero.tagBg, color: hero.tagColor }"
          >-20%</b
        >
      </div>
      <div
        class="flex justify-between items-center text-[10.5px] font-extrabold px-2 py-[7px] rounded-lg bg-[#FAFAF9] mt-1"
      >
        <span
          >☕ Kopi Kekinian<small
            class="block font-bold opacity-60 text-[9.5px]"
            >GI • 4,9 ★</small
          ></span
        >
        <b
          class="text-[9px] rounded-full px-2 py-0.5"
          :style="{ background: hero.tagBg, color: hero.tagColor }"
          >Voucher</b
        >
      </div>
    </div>

    <!-- AI assistant -->
    <div
      class="flex gap-2 items-center mt-2 rounded-[14px] p-2.5 bg-white shadow"
      :style="{ background: hero.cardBg }"
    >
      <span
        class="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[15px] text-white flex-none"
        :style="{ background: hero.headBg }"
        >🤖</span
      >
      <span class="flex-1 text-[10.5px] font-extrabold"
        >Wikendo AI<small class="block font-bold opacity-65 text-[9.5px]"
          >Ceritain mood → rekomendasi instan</small
        ></span
      >
      <span class="text-sm font-extrabold">→</span>
    </div>

    <!-- Nearest Mall (M3 directory entrypoint, lock M1+M3 Oct 9) -->
    <NuxtLink
      to="/mall"
      class="flex gap-2 items-center mt-2 rounded-[14px] p-2.5 bg-white shadow"
      :style="{ background: hero.cardBg }"
    >
      <span
        class="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[15px] text-white flex-none"
        :style="{ background: hero.headBg }"
        >🏬</span
      >
      <span class="flex-1 text-[10.5px] font-extrabold"
        >Mall Terdekat<small class="block font-bold opacity-65 text-[9.5px]"
          >5 mall • 200 tenant → tanpa login</small
        ></span
      >
      <span class="text-sm font-extrabold">→</span>
    </NuxtLink>

    <!-- Recently viewed -->
    <div
      class="mt-2 rounded-xl px-2.5 py-2.5 bg-white shadow text-[10.5px]"
      :style="{ background: hero.cardBg }"
    >
      <b class="text-[11px]">Terakhir dilihat 👀</b>
      <p class="opacity-65 text-[10px] font-bold mt-0.5">
        Belum ada riwayat — mulai quiz pertamamu →
      </p>
    </div>
    <p class="mt-6 text-[9.5px] font-bold opacity-55 text-center">
      Result tidak dicampur: tempat ya tempat, makan ya makan.
    </p>
  </div>
</template>
