<!-- common/components/AppLoader.vue → API fetching/loading skeleton (1 component, 3 pages).
WHAT: loading placeholder (skeleton) per variant. For "mall" variant, render list‑card style skeleton; otherwise show generic spinner placeholder.
WHY: skeleton should match the shape of the content being loaded, e.g. list cards for mall directory.
-->
<script setup lang="ts">
import { computed } from "vue";
import type { LoaderVariant } from "~/common/types/loader";
import { getLoaderMeta } from "~/common/utils/loader";

const props = defineProps<{ variant: LoaderVariant }>();
const meta = computed(() => getLoaderMeta(props.variant));
</script>

<template>
  <div class="text-center py-16" role="status" aria-live="polite">
    <template v-if="props.variant === 'mall'">
      <!-- List‑card skeleton matching MallListPage cards -->
      <div
        class="mx-auto mb-4 w-3/4 rounded-md bg-gray-200 animate-pulse"
        style="height: 56px"
      ></div>
      <div
        class="h-4 w-2/3 mx-auto mb-2 rounded bg-gray-200 animate-pulse"
      ></div>
      <div class="h-3 w-1/3 mx-auto rounded bg-gray-200 animate-pulse"></div>
    </template>
    <template v-else>
      <!-- Generic spinner placeholder (pulsing circle) -->
      <div
        class="mx-auto mb-4 rounded-md bg-gray-200 animate-pulse"
        style="width: 56px; height: 56px"
      />
      <p class="font-extrabold text-[15px]" :style="{ color: meta.accent }">
        {{ meta.title }}
      </p>
    </template>
    <p class="text-[13px] text-gray-500 mt-1">{{ meta.hint }}</p>
  </div>
</template>
