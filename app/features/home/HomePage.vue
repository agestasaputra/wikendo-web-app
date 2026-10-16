<!-- features/home/HomePage.vue → GET / (Home Superapp I17 V2 Ember P1, slicing full dari screenshot V2).
APA: header sapaan + hero quota ink strip ember + 2 CTA ink + 4 ikon + rekomendasi + AI + riwayat.
KENAPA: tugas home cuma 1 — dorong landing→quiz >40% (PRD §4). Hero = scarcity jujur ikut GET /api/quota.
Contoh: quota real di-wire ke GET /api/quota (endpoint server/api/quota.get.ts); loading = skeleton, error = fallback 1 • 2.
Token via getHomeHeroMeta(): ink #0C0A09 + strip ember #EA580C + angka #D9F99D + pill lime #A3E635. -->
<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useAuthStore } from "~/common/store/AuthStore";
import type { QuotaStatus } from "~/common/types/quota";
import { buildQuotaStatus, buildWalletLabel } from "~/common/utils/quota";
import { getHomeHeroMeta } from "~/features/home/utils/homeHero";

// Auth-state AS6 wallet-card: anon 1:1, login greeting Halo {displayName} + sub Sisa kamu.
const { isLoggedIn, displayName, initial } = storeToRefs(useAuthStore());
// SEO Home: GEO-friendly (og + description ID). Direktori /mall/:slug nyusul slice-4.
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
  ],
});
// Token hero I17 V2 Ember P1 — 1 sumber kebenaran, bukan hardcode hex di template.
const hero = getHomeHeroMeta();
// Quota real: GET /api/quota (cookie anon). Gagal fetch = fallback anon fresh (1 • 2), bukan angka bohong register.
const {
  data: quotaData,
  pending: quotaPending,
  error: quotaError,
} = await useFetch<QuotaStatus>("/api/quota");
const quotaStatus = computed(
  () =>
    quotaData.value ||
    buildQuotaStatus({ tempatUsed: 0, makanUsed: 0, isLoggedIn: false }),
);
const wallet = computed(() => buildWalletLabel(quotaStatus.value));
</script>

<template>
  <div class="max-w-md mx-auto px-4 pb-10" :style="{ background: hero.pageBg }">
    <!-- Header sapaan — AS6 wallet-card: anon 1:1 (👦 + teman Wikendo), login avatar initial + Halo {displayName} + sub Sisa kamu -->
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

    <!-- Hero QUOTA HARI INI — ink + strip ember V2 + watermark dadu -->
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
            : "Gratis hari ini — login buka 2 + 5"
        }}
      </p>
      <div class="flex gap-1.5 mt-2">
        <span
          class="flex-1 rounded-lg px-1 py-1.5 text-center text-[10px] font-extrabold bg-white/10"
          >👥 {{ quotaPending ? "…" : wallet.tempatChip }}</span
        >
        <span
          class="flex-1 rounded-lg px-1 py-1.5 text-center text-[10px] font-extrabold bg-white/10"
          >🍜 {{ quotaPending ? "…" : wallet.makanChip }}</span
        >
      </div>
      <NuxtLink
        to="/quiz"
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
        to="/quiz"
        class="block text-center text-xs font-extrabold mt-2.5 underline"
        >🔒 Quota habis — Login gratis → buka 2 tempat + 5 makan/hari</NuxtLink
      >
    </div>

    <!-- 2 CTA gede ink — thumb-zone min 56px -->
    <div class="grid grid-cols-2 gap-1.5 mt-2">
      <NuxtLink
        to="/quiz"
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
        to="/makan"
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

    <!-- 4 ikon cepat -->
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

    <!-- Rekomendasi buatmu -->
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

    <!-- Asisten AI -->
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

    <!-- Mall Terdekat (M3 entrypoint direktori, lock M1+M3 9 Okt) -->
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

    <!-- Terakhir dilihat -->
    <div
      class="mt-2 rounded-xl px-2.5 py-2.5 bg-white shadow text-[10.5px]"
      :style="{ background: hero.cardBg }"
    >
      <b class="text-[11px]">Terakhir dilihat 👀</b>
      <p class="opacity-65 text-[10px] font-bold mt-0.5">
        Belum ada riwayat — mulai quiz pertamamu →
      </p>
    </div>
    <p class="mt-2 text-[9.5px] font-bold opacity-55 text-center">
      Result tidak dicampur: tempat ya tempat, makan ya makan.
    </p>
  </div>
</template>
