<!-- features/legal/LegalPage.vue → konten halaman Privacy & Terms (MVP, jujur, gate review Google OAuth).
APA: 1 komponen 2 varian (kind: privacy|terms) + daftar section {heading, body}; route tipis di pages/.
KENAPA: sebelum share publik, user Google butuh halaman ini (syarat review OAuth + kepercayaan).
  Isi disesuaikan realita MVP: Supabase auth + kuota anonim via cookie. Revisit saat monetisasi.
Contoh: pages/privacy.vue → <LegalPage kind="privacy" /> -->
<script setup lang="ts">
interface LegalSection {
  heading: string;
  body: string[];
}
interface LegalCopy {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

const props = defineProps<{ kind: "privacy" | "terms" }>();

const COPY: Record<"privacy" | "terms", LegalCopy> = {
  privacy: {
    title: "Kebijakan Privasi",
    updated: "Terakhir diperbarui: 17 Oktober 2026",
    intro:
      "Wikendo menghargai privasi kamu. Halaman ini menjelaskan data apa yang kami kumpulkan dan kenapa.",
    sections: [
      {
        heading: "Data yang kami kumpulkan",
        body: [
          "Email + nama (kalau kamu daftar/login, termasuk via Google).",
          "Jawaban quiz kamu — dipakai sekali untuk bikin rekomendasi, tidak dijual ke siapa pun.",
          "Cookie anonim untuk hitung kuota gratis harian (2 tempat + 5 makan) — tanpa cookie ini kuota tidak bisa jujur.",
        ],
      },
      {
        heading: "Yang TIDAK kami lakukan",
        body: [
          "Tidak menjual data kamu ke pihak ketiga.",
          "Tidak mengirim spam. Email hanya untuk verifikasi & hal penting akun.",
          "Tidak menyimpan password kamu — login via Supabase Auth (Google/email).",
        ],
      },
      {
        heading: "Layanan pihak ketiga",
        body: [
          "Supabase (database + auth) — data tersimpan terenkripsi.",
          "Vercel (hosting) — tempat web ini jalan.",
          "Google Analytics 4 — statistik kunjungan anonim untuk tahu fitur mana yang dipakai.",
        ],
      },
      {
        heading: "Hak kamu",
        body: [
          "Minta hapus akun + data: email ke founder@wikendo.id, kami proses maksimal 7 hari kerja.",
        ],
      },
    ],
  },
  terms: {
    title: "Syarat & Ketentuan",
    updated: "Terakhir diperbarui: 17 Oktober 2026",
    intro:
      "Dengan pakai Wikendo, kamu setuju dengan aturan main sederhana berikut.",
    sections: [
      {
        heading: "Layanan",
        body: [
          "Wikendo bantu kamu cari tempat & tenant makan weekend lewat quiz cepat.",
          "Rekomendasi bersifat saran, bukan jaminan. Jam buka/promo tenant bisa berubah — cek dulu di lokasi atau aplikasi tenant.",
        ],
      },
      {
        heading: "Kuota gratis",
        body: [
          "Anonim: 2 quiz tempat + 5 quiz makan per hari (reset 00.00 WIB).",
          "Kuota dipakai untuk menjaga biaya AI tetap sehat supaya layanan bisa gratis.",
        ],
      },
      {
        heading: "Voucher",
        body: [
          "Voucher dari tenant (contoh: diskon 20%) tunduk pada syarat tenant masing-masing.",
          "1 klaim per tenant per hari; penyalahgunaan (spam klaim) bisa membuat kuota kamu dibatasi.",
        ],
      },
      {
        heading: "Kontak",
        body: ["Ada pertanyaan? Email founder@wikendo.id."],
      },
    ],
  },
};

const copy = computed(() => COPY[props.kind]);

useHead(() => ({
  title: `${copy.value.title} — Wikendo`,
  meta: [
    {
      name: "description",
      content: `${copy.value.title} Wikendo — transparan, bahasa manusia.`,
    },
  ],
}));
</script>

<template>
  <div class="max-w-md mx-auto px-4 pb-10">
    <p class="text-xs text-gray-500 pt-3 mb-1">Home / {{ copy.title }}</p>
    <h1 class="text-xl font-extrabold mb-1">{{ copy.title }}</h1>
    <p class="text-[11px] text-gray-400 mb-3">{{ copy.updated }}</p>
    <div
      class="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-4"
    >
      <p class="text-[13px] text-gray-600 leading-relaxed">{{ copy.intro }}</p>
      <div v-for="s in copy.sections" :key="s.heading">
        <h2 class="text-sm font-bold mb-1">{{ s.heading }}</h2>
        <ul
          class="text-[13px] text-gray-600 leading-relaxed list-disc pl-4 flex flex-col gap-1"
        >
          <li v-for="(line, i) in s.body" :key="i">{{ line }}</li>
        </ul>
      </div>
      <NuxtLink to="/" class="text-xs font-bold underline"
        >← Balik ke Home</NuxtLink
      >
    </div>
  </div>
</template>
