<!-- components/AppLoader.vue → Spinner fetching API (1 komponen, 3 pages).
  APA: cincin spin + judul + hint, warna aksen per variant (tempat orange / makan merah / mall teal).
  KENAPA: 1 komponen dipakai result.vue + result-makan.vue + mall/[slug].vue → pesan + warna
  konsisten, bukan hardcode emoji pulse beda-beda di tiap page. Meta dari getLoaderMeta (pure, tested).
  Contoh: <AppLoader variant="makan" /> pas POST /api/makan/recommend pending. -->
<script setup lang="ts">
import { getLoaderMeta } from '~/utils/quiz-logic'
import type { LoaderVariant } from '~/types'

const props = defineProps<{ variant: LoaderVariant }>()
const meta = computed(() => getLoaderMeta(props.variant))
</script>

<template>
  <div class="text-center py-16" role="status" aria-live="polite">
    <div
      class="mx-auto mb-4 rounded-full animate-spin"
      style="width:56px;height:56px;border:5px solid #ececec"
      :style="{ borderTopColor: meta.accent }"
    />
    <p class="font-extrabold text-[15px]">{{ meta.title }}</p>
    <p class="text-[13px] text-gray-500 mt-1">{{ meta.hint }}</p>
  </div>
</template>
