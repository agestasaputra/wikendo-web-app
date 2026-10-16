<!-- common/components/ResultError.vue → Kotak error hasil rekomendasi (wall quota vs error biasa).
APA: isWall = kotak orange "Quota habis → Login"; selain itu kotak merah + pesan + tombol Coba lagi (disabled saat pending).
KENAPA: result tempat + result makan identik kecuali teks wall → 1 komponen; teks wall lewat prop.
Contoh: <ResultError :is-wall="isWall" :message="errorMessage" :pending="pending" wall-text="..." @retry="refresh()" /> -->
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
