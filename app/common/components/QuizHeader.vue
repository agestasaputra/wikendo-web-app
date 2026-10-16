<!-- common/components/QuizHeader.vue → Header ink quiz Q2d/M3d (dipakai quiz tempat + makan).
APA: kartu ink + label putih + dot ember/rose + pertanyaan putih + segmen blok lime (isi = step+1).
KENAPA: dua halaman quiz memakai markup identik → 1 komponen. Token warna dari getQuizHeaderMeta (pure, tested).
Contoh: <QuizHeader :meta="meta" :seg-state="seg" :question="q.question" suffix=" · 1/5 · ⏱ 30 dtk" /> -->
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
