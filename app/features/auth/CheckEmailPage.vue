<!-- features/auth/CheckEmailPage.vue → GET /check-email (Option B magic-link, Agesta lock 10 Oct 2026).
  WHAT: waiting-for-verification page — title Cek email + show email from query + Kirim ulang button + inline message.
  WHY: signUp going straight in = bots pass + email typo = reset fails. Magic-link: Daftar → Cek email → click 1 link → HOME.
  Style 1:1 register (canvas = PAGE_BG from app.vue + ink banner #0C0A09 + ember strip #EA580C + radius 12 + lime number #D9F99D).
  EXAMPLE: register A@mail.com → /check-email?email=A@mail.com → click link in inbox → HOME /. -->
<script setup lang="ts">
import AppSpinner from "~/common/components/AppSpinner.vue";
import { useSupabaseBrowser } from "~/common/composables/useSupabaseBrowser";
import AuthBanner from "~/features/auth/components/AuthBanner.vue";
import { buildOriginUrl } from "~/features/auth/utils/redirect";

// SSR-safe: useRoute, not router.currentRoute (Vercel 500 pitfall).
const route = useRoute();
const displayEmail = computed(
  () => (route.query.email as string) || "email kamu",
);

const errorMsg = ref("");
const successMsg = ref("");
const loading = ref(false);

// Resend the verification link via Supabase resend type signup → back to HOME (/).
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
  <div class="max-w-md mx-auto px-4 pb-10 min-h-[calc(100vh-64px)]">
    <!-- 1. Black banner — 1:1 register (ember strip + radius 12 + light-lime number) -->
    <AuthBanner
      title="HAMPIR SELESAI"
      value="1 klik lagi"
      footer="verifikasi email biar quota 2 • 5 aktif 🎟️"
    />

    <!-- 2. White instruction card -->
    <div class="bg-white rounded-3xl mt-3 p-5 shadow-sm text-center">
      <div class="text-3xl">📩</div>
      <b class="text-lg font-extrabold text-black mt-2">Cek email kamu</b>
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
