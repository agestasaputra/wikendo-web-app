<!-- features/auth/components/GoogleButton.vue → "Lanjutkan dengan Google" button (official outline + 4-color G logo, Option A board v10).
WHAT: gray outline #DADCE0 (not the solid-white twin of the form) + official G logo + "Menghubungkan…" spinner while loading.
WHY: login + register are one auth family — SAME look; border #DADCE0 + official G comply with Google branding, the black CTA stays the only solid one.
EXAMPLE: <GoogleButton :loading="googleLoading" :disabled="loading || googleLoading" @click="handleGoogle" /> -->
<script setup lang="ts">
import AppSpinner from "~/common/components/AppSpinner.vue";

defineProps<{ loading: boolean; disabled: boolean }>();
const emit = defineEmits<{ click: [] }>();
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="w-full bg-white rounded-full mt-3 py-3.5 px-4 font-extrabold text-sm text-black flex items-center justify-center gap-2 disabled:opacity-60"
    style="border: 1.5px solid #dadce0"
    @click="emit('click')"
  >
    <AppSpinner v-if="loading" color="#4285F4" size="w-5 h-5" />
    <svg v-else class="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
    {{ loading ? "Menghubungkan…" : "Lanjutkan dengan Google" }}
  </button>
</template>
