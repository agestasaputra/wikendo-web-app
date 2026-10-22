<!--
 features/about/AboutPage.vue → GET /about.
 WHAT: statis "Tentang Wikendo" — apa itu, cara kerja, gratis & jujur, privasi, kontak, teknologi.
 WHY: single source of truth halaman About; footer publik & baris "Tentang" di /account mengarah ke sini
   (sebelumnya cuma anchor #tentang di footer — bukan halaman yang bisa dibagikan / di-index).
 EXAMPLE: user buka /account → tap "Tentang" → /about → 6 section + link /privacy & /terms + CTA quiz. -->
<script setup lang="ts">
import {
  ANON_FOOD_LIMIT,
  ANON_PLACE_LIMIT,
  MEMBER_FOOD_LIMIT,
  MEMBER_PLACE_LIMIT,
} from "~/common/constants/quota";

interface AboutLink {
  label: string;
  to: string;
}

interface AboutSection {
  title: string;
  body: string;
  links?: AboutLink[];
}

const TITLE = "Tentang Wikendo";
const DESCRIPTION =
  "Wikendo: quiz 30 detik → 5 rekomendasi tempat weekend + voucher tenant. Gratis, kuota reset tiap hari, tanpa akun wajib.";

const anonQuota = `${ANON_PLACE_LIMIT} tempat + ${ANON_FOOD_LIMIT} makan`;
const memberQuota = `${MEMBER_PLACE_LIMIT} tempat + ${MEMBER_FOOD_LIMIT} makan`;

// SEO: canonical + og:url absolut — sama pola dengan HomePage (Addendum 25 SEO P0).
useHead({
  title: TITLE,
  meta: [
    { name: "description", content: DESCRIPTION },
    { property: "og:title", content: TITLE },
    { property: "og:description", content: DESCRIPTION },
    { property: "og:url", content: "https://www.wikendo.id/about" },
  ],
  link: [{ rel: "canonical", href: "https://www.wikendo.id/about" }],
});

// Isi halaman = data, bukan mark-up berulang: 1 sumber copy, gampang diedit tanpa sentuh template.
const sections: AboutSection[] = [
  {
    title: "Apa itu Wikendo?",
    body: "Wikendo bantu kamu putuskan weekend mau ke mana — tempat atau makan — lewat quiz cepat, bukan scroll daftar panjang. Hasilnya 5 rekomendasi personal, dipilih dari preferensi yang kamu isi sendiri.",
  },
  {
    title: "Cara kerja",
    body: "1) Isi quiz preferensi ±30 detik. 2) AI menganalisis jawaban kamu. 3) Dapat 5 rekomendasi + voucher tenant yang bisa langsung dipakai.",
  },
  {
    title: "Gratis & jujur",
    body: `Kuota anonim ${anonQuota} per hari, reset 00.00 WIB; login gratis (Google, 10 detik) buka ${memberQuota}. Tidak ada biaya tersembunyi — voucher datang dari tenant, bukan dari kamu.`,
  },
  {
    title: "Data & privasi",
    body: "Kami hanya menyimpan data yang perlu untuk rekomendasi dan hitung kuota. Tidak dijual ke pihak ketiga. Detailnya ada di halaman kebijakan.",
    links: [
      { label: "Kebijakan Privasi", to: "/privacy" },
      { label: "Syarat & Ketentuan", to: "/terms" },
    ],
  },
  {
    title: "Kontak",
    body: "Pertanyaan, saran, atau laporan bug? Email founder@wikendo.id — kami baca semua pesan dan balas maksimal 7 hari kerja.",
  },
  {
    title: "Teknologi",
    body: "Dibangun dengan Nuxt, Supabase, dan Vercel. Mobile-first, tanpa iklan yang mengganggu, dan tanpa pop-up yang menghalangi konten.",
  },
];
</script>

<template>
  <!-- Kanvas tetap milik app.vue; halaman ini hanya mengisi konten (pola LegalPage). -->
  <div class="max-w-md mx-auto px-4 pb-10">
    <p class="text-xs text-gray-500 pt-3 mb-1">Home / {{ TITLE }}</p>
    <h1 class="text-xl font-extrabold mb-1">{{ TITLE }}</h1>
    <p class="text-[12px] text-gray-500 mb-3">
      Bingung weekend mau ke mana? Kami bantu putuskan.
    </p>

    <div class="flex flex-col gap-3">
      <section
        v-for="s in sections"
        :key="s.title"
        class="bg-white rounded-2xl border border-gray-100 p-4"
      >
        <h2 class="text-sm font-bold mb-1">{{ s.title }}</h2>
        <p class="text-[13px] text-gray-600 leading-relaxed">{{ s.body }}</p>
        <div v-if="s.links" class="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          <NuxtLink
            v-for="link in s.links"
            :key="link.to"
            :to="link.to"
            class="text-xs font-bold underline"
            >{{ link.label }}</NuxtLink
          >
        </div>
      </section>
    </div>

    <!-- CTA: halaman About tetap punya satu jalan keluar ke produk, bukan jalan buntu. -->
    <NuxtLink
      to="/"
      class="mt-4 flex items-center justify-center rounded-2xl py-3 text-sm font-extrabold text-white bg-ink"
      >Mulai quiz →</NuxtLink
    >
    <NuxtLink to="/" class="mt-3 block text-center text-xs font-bold underline"
      >← Balik ke Home</NuxtLink
    >

    <p class="text-[10px] text-gray-400 text-center mt-6">© 2026 Wikendo</p>
  </div>
</template>
