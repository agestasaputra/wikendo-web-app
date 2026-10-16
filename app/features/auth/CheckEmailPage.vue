<!-- features/auth/CheckEmailPage.vue → GET /check-email (Opsi B magic-link, lock Agesta 10 Okt 2026).
  APA: halaman tunggu verifikasi — judul Cek email + tampilkan email dari query + tombol Kirim ulang + pesan inline.
  KENAPA: signUp langsung masuk = bot lolos + typo email = reset gagal. Magic-link: Daftar → Cek email → klik 1 link → HOME.
  Style 1:1 register (paper #F5F5F4 + banner ink #0C0A09 + strip ember #EA580C + radius 12 + angka lime #D9F99D).
  Contoh: daftar A@mail.com → /check-email?email=A@mail.com → klik link di inbox → HOME /. -->
<script setup lang="ts">
import AppSpinner from "~/common/components/AppSpinner.vue";
import { useSupabaseBrowser } from "~/common/composables/useSupabaseBrowser";
import AuthBanner from "~/features/auth/components/AuthBanner.vue";
import { buildOriginUrl } from "~/features/auth/utils/redirect";

// SSR-safe: useRoute, bukan router.currentRoute (pitfall 500 Vercel).
const route = useRoute();
const displayEmail = computed(
  () => (route.query.email as string) || "email kamu",
);

const errorMsg = ref("");
const successMsg = ref("");
const loading = ref(false);

// Kirim ulang link verifikasi via Supabase resend type signup → balik ke HOME (/).
async function handleResend(): Promise<void> {
  if (loading.value) return;
  errorMsg.value = "";
  successMsg.value = "";
  const email = route.query.email as string;
  if (!email) {
    errorMsg.value = "Email hilang — daftar ulang dari /register.";
    return;
  }
  loading.value = true;
  try {
    const { error } = await useSupabaseBrowser().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: buildOriginUrl("/") },
    });
    if (error) {
      errorMsg.value = error.message;
      return;
    }
    successMsg.value = "Link baru terkirim — cek inbox.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="max-w-md mx-auto px-4 pb-10 min-h-screen"
    style="
      background: #f5f5f4;
      font-family:
        Plus Jakarta Sans,
        system-ui,
        sans-serif;
    "
  >
    <!-- 1. Banner hitam — 1:1 register (strip ember + radius 12 + angka lime-muda) -->
    <AuthBanner
      title="HAMPIR SELESAI"
      value="1 klik lagi"
      footer="verifikasi email biar quota 2 • 5 aktif 🎟️"
    />

    <!-- 2. Kartu instruksi putih -->
    <div class="bg-white rounded-3xl mt-3 p-5 shadow-sm text-center">
      <div class="text-3xl">📩</div>
      <h1 class="text-lg font-extrabold text-black mt-2">Cek email kamu</h1>
      <p class="text-sm font-bold text-black mt-1 break-all">
        {{ displayEmail }}
      </p>
      <p class="text-xs text-gray-500 mt-2 leading-relaxed">
        Link verifikasi udah dikirim. Klik link di inbox → otomatis masuk HOME.
        Cek juga folder spam/promosi kalau belum masuk.
      </p>
      <p
        v-if="successMsg"
        class="text-center text-xs font-bold text-green-700 mt-2"
      >
        {{ successMsg }}
      </p>
      <p
        v-if="errorMsg"
        class="text-center text-xs font-bold text-red-600 mt-2"
      >
        {{ errorMsg }}
      </p>
      <button
        type="button"
        :disabled="loading"
        class="w-full rounded-full py-3.5 px-4 text-white text-sm font-extrabold mt-3 disabled:opacity-60 flex items-center justify-center gap-2"
        style="background: #0c0a09"
        @click="handleResend"
      >
        <AppSpinner v-if="loading" color="#fff" />
        {{ loading ? "Mengirim…" : "Kirim ulang" }}
      </button>
      <NuxtLink
        to="/login"
        class="inline-block text-xs font-bold text-gray-500 mt-3 underline"
      >
        Salah email? Balik ke login
      </NuxtLink>
    </div>
  </div>
</template>
