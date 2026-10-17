<!-- common/components/ResultError.vue → Recommendation result error box (quota wall vs regular error).
WHAT: isWall = orange box "Quota habis → Login"; otherwise red box + message + "Coba lagi" button (disabled while pending).
WHY: place result + food result are identical except the wall text → 1 component; wall text via prop.
EXAMPLE: <ResultError :is-wall="isWall" :message="errorMessage" :pending="pending" wall-text="..." @retry="refresh()" /> -->
<script setup lang="ts">
defineProps<{
  isWall: boolean;
  message: string;
  pending: boolean;
  wallText: string;
}>();
const emit = defineEmits<{ retry: [] }>();
</script>

<template>
  <div
    class="rounded-2xl p-4 text-sm font-bold"
    :style="
      isWall
        ? 'background:#fff7ed;border:2px solid #f97316;color:#9a3412'
        : 'background:#fef2f2;border:1px solid #fecaca;color:#991b1b'
    "
  >
    <template v-if="isWall">
      {{ wallText }}<br />
      <NuxtLink to="/" class="underline">Login / balik Home →</NuxtLink>
    </template>
    <template v-else>
      {{ message }}<br />
      <button
        class="underline mt-1 disabled:opacity-60"
        :disabled="pending"
        @click="emit('retry')"
      >
        Coba lagi → (quota nggak kepotong)
      </button>
    </template>
  </div>
</template>
