<!-- common/components/QuizHeader.vue → Quiz ink header Q2d/M3d (used by the place + food quiz).
WHAT: ink card + white label + ember/rose dot + white question + lime block segments (filled = step+1).
WHY: the two quiz pages use identical markup → 1 component. Color tokens from getQuizHeaderMeta (pure, tested).
EXAMPLE: <QuizHeader :meta="meta" :seg-state="seg" :question="q.question" suffix=" · 1/5 · ⏱ 30 dtk" /> -->
<script setup lang="ts">
import type { QuizHeaderMeta } from "~/common/types/quiz";

defineProps<{
  meta: QuizHeaderMeta;
  segState: boolean[];
  question: string;
  suffix: string;
}>();
</script>

<template>
  <div
    class="rounded-[14px] p-[10px_12px]"
    :style="{ background: meta.headBg }"
  >
    <div
      class="text-[10px] font-extrabold tracking-wide"
      :style="{ color: meta.labelColor }"
    >
      <span :style="{ color: meta.dot }">●</span> {{ meta.label }}{{ suffix }}
    </div>
    <div
      class="text-[19px] font-extrabold leading-snug mt-1"
      :style="{ color: meta.questionColor }"
    >
      {{ question }}
    </div>
    <div class="flex gap-[5px] mt-[10px]">
      <i
        v-for="(on, i) in segState"
        :key="i"
        class="flex-1 h-2 rounded-full"
        :style="{ background: on ? meta.segOn : 'rgba(255,255,255,.22)' }"
      />
    </div>
  </div>
</template>
