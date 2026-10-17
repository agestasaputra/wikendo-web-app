<!-- common/components/AppLoader.vue → API fetching spinner (1 component, 3 pages).
WHAT: spinning ring + title + hint, accent color per variant (place orange / food red / mall teal).
WHY: used by place result + food result + mall detail → consistent message + colors. Meta from getLoaderMeta (pure, tested).
EXAMPLE: <AppLoader variant="food" /> while POST /api/food/recommend is pending. -->
<script setup lang="ts">
import { computed } from "vue";
import type { LoaderVariant } from "~/common/types/loader";
import { getLoaderMeta } from "~/common/utils/loader";

const props = defineProps<{ variant: LoaderVariant }>();
const meta = computed(() => getLoaderMeta(props.variant));
</script>

<template>
  <div class="text-center py-16" role="status" aria-live="polite">
    <div
      class="mx-auto mb-4 rounded-full animate-spin"
      style="width: 56px; height: 56px; border: 5px solid #ececec"
      :style="{ borderTopColor: meta.accent }"
    />
    <p class="font-extrabold text-[15px]">{{ meta.title }}</p>
    <p class="text-[13px] text-gray-500 mt-1">{{ meta.hint }}</p>
  </div>
</template>
