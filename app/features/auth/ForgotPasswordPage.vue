<!-- features/auth/ForgotPasswordPage.vue → Handles forgot password flow.
WHAT: Simple form asking for email, then calls Supabase auth.resetPasswordForEmail.
WHY: Allows users to recover access when they forget their password.
DESIGN: Matches existing auth page styling (black quota banner, Google button style not needed here).
-->
<script setup lang="ts">
import { useSupabaseBrowser } from "~/common/composables/useSupabaseBrowser";
import AppSpinner from "~/common/components/AppSpinner.vue";

const supabase = useSupabaseBrowser();

const email = ref("");
const errorMsg = ref("");
const successMsg = ref("");
const loading = ref(false);

async function handleSubmit(): Promise<void> {
  if (loading.value) return;
  if (!email.value.trim()) {
    errorMsg.value = "Isi Email dulu.";
    return;
  }
  errorMsg.value = "";
  successMsg.value = "";
  loading.value = true;
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      // Optional: redirect to a custom reset page after clicking link
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      errorMsg.value = error.message;
      return;
    }
    successMsg.value = "Link reset terkirim — cek inbox Email kamu.";
    email.value = ""; // clear for security
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="max-w-md mx-auto px-4 pb-10 min-h-screen"
    style="
      background: #f2f2f2;
      font-family:
        Plus Jakarta Sans,
        system-ui,
        sans-serif;
    "
  >

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div
        class="bg-white rounded-full flex items-center gap-2 px-4 py-3.5 shadow-sm"
      >
        <span class="text-gray-400 text-base">✉️</span>
        <input
          v-model="email"
          type="email"
          required
          placeholder="Email"
          class="flex-1 bg-transparent outline-none text-sm font-bold text-black placeholder:text-gray-400"
        />
      </div>

      <p v-if="errorMsg" class="text-center text-xs font-bold text-red-600">
        {{ errorMsg }}
      </p>
      <p v-if="successMsg" class="text-center text-xs font-bold text-green-600">
        {{ successMsg }}
      </p>

      <button
        type="submit"
        class="w-full rounded-full py-3.5 px-4 text-white text-sm font-extrabold flex items-center justify-center gap-2"
        style="background: #0c0a09"
        :disabled="loading"
      >
        <AppSpinner v-if="loading" color="#fff" size="w-4 h-4" />
        {{ loading ? "Mengirim…" : "Kirim Link Reset" }}
      </button>

      <p class="mt-6 text-center text-sm font-bold text-black">
        Sudah punya password?
        <NuxtLink to="/login" class="font-extrabold underline">Masuk</NuxtLink>
      </p>
    </form>
  </div>
</template>
