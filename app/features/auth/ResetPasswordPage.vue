<!-- features/auth/ResetPasswordPage.vue → Reset password after email link.
WHAT: Reads access_token from URL (set by Supabase reset link), shows form to enter new password.
WHY: Completes the forgot password flow.
DESIGN: Similar styling to other auth pages.
-->
<script setup lang="ts">
import { useSupabaseBrowser } from "~/common/composables/useSupabaseBrowser";
import { useRouter, useRoute } from "#app";
import AppSpinner from "~/common/components/AppSpinner.vue";

const router = useRouter();
const route = useRoute();
const supabase = useSupabaseBrowser();

const access_token = ref((route.query.access_token as string) || "");

const password = ref("");
const passwordConfirm = ref("");
const errorMsg = ref("");
const successMsg = ref("");
const loading = ref(false);

// If token missing, redirect to login with error.
if (!access_token.value) {
  // Supabase should have added token; if missing, maybe link expired or used.
  errorMsg.value = "Link reset tidak valid atau sudah kadaluarsa.";
}

// For security, we could verify token via supabase.auth.getUser() but updateUser will fail if not authenticated.
async function handleSubmit(): Promise<void> {
  if (loading.value) return;
  if (!password.value || !passwordConfirm.value) {
    errorMsg.value = "Isi kedua kolom password.";
    return;
  }
  if (password.value !== passwordConfirm.value) {
    errorMsg.value = "Password tidak cocok.";
    return;
  }
  if (password.value.length < 6) {
    errorMsg.value = "Password minimal 6 karakter.";
    return;
  }
  errorMsg.value = "";
  successMsg.value = "";
  loading.value = true;
  try {
    // Ensure we have a session from the token in URL (supabase js reads from window.location)
    const { error } = await supabase.auth.updateUser({
      password: password.value,
    });
    if (error) {
      errorMsg.value = error.message;
      return;
    }
    successMsg.value = "Password berhasil diperbarui. Silakan masuk.";
    // Clear form
    password.value = "";
    passwordConfirm.value = "";
    // Optionally redirect to login after a short delay
    setTimeout(() => {
      router.push("/login");
    }, 1500);
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
      padding-top: 2rem;
    "
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div
        class="bg-white rounded-full flex items-center gap-2 px-4 py-3.5 shadow-sm"
      >
        <span class="text-gray-400 text-base">🔒</span>
        <input
          v-model="password"
          type="password"
          required
          placeholder="Password baru"
          class="flex-1 bg-transparent outline-none text-sm font-bold text-black placeholder:text-gray-400"
        />
      </div>
      <div
        class="bg-white rounded-full flex items-center gap-2 px-4 py-3.5 shadow-sm"
      >
        <span class="text-gray-400 text-base">🔒</span>
        <input
          v-model="passwordConfirm"
          type="password"
          required
          placeholder="Ulangi Password"
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
        {{ loading ? "Tunggu…" : "Ubah Password" }}
      </button>

      <p class="mt-6 text-center text-sm font-bold text-black">
        Ingat password?
        <NuxtLink to="/login" class="font-extrabold underline">Masuk</NuxtLink>
      </p>
    </form>
  </div>
</template>
