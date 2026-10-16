<!-- common/components/AppSpinner.vue → Ikon spinner kecil untuk tombol yang sedang request API.
APA: cincin SVG animate-spin; warna + ukuran via prop.
KENAPA: SVG spinner dulu disalin ±8x di login/register/check-email/account/header/result → 1 komponen.
Contoh: <AppSpinner v-if="loading" color="#fff" size="w-4 h-4" /> -->
<script setup lang="ts">
withDefaults(defineProps<{ color?: string; size?: string }>(), {
  color: "currentColor",
  size: "w-4 h-4",
});
</script>

<template>
  <svg
    :class="['animate-spin', size]"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      :stroke="color"
      stroke-opacity=".25"
      stroke-width="4"
    />
    <path
      d="M22 12a10 10 0 0 0-10-10"
      :stroke="color"
      stroke-width="4"
      stroke-linecap="round"
    />
  </svg>
</template>
