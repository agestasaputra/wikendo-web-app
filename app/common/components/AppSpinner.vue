<!-- common/components/AppSpinner.vue → Small spinner icon for buttons that are requesting the API.
WHAT: SVG ring with animate-spin; color + size via props.
WHY: the SVG spinner was previously copied ±8x across login/register/check-email/account/header/result → 1 component.
EXAMPLE: <AppSpinner v-if="loading" color="#fff" size="w-4 h-4" /> -->
<script setup lang="ts">
withDefaults(defineProps<{ color?: string; size?: string }>(), {
  color: "currentColor",
  size: "w-4 h-4",
});
</script>

<template>
  <!-- Replace spinner with a skeleton placeholder (pulsing) -->
  <div
    :class="[size, 'bg-gray-200 rounded animate-pulse']"
    aria-hidden="true"
  />
</template>
