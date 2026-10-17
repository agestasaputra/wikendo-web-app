<!-- features/tempat/TempatQuizPage.vue → GET /quiz (Quiz TEMPAT swipe, mockup B-C kombo 5+10+15).
APA: 1 layar 1 tanya + progress + opt-card + tombol 56px Orange #f97316, base #fffdf9.
KENAPA: 1 keputusan kecil per layar = completion >70% (PRD §4). Engine sama dipakai quiz makan → codebase 1x.
Contoh: tap opsi langsung next (tanpa tombol Lanjut) — quota kepake pas Generate, bukan per tanya. -->
<script setup lang="ts">
import QuizHeader from "~/common/components/QuizHeader.vue";
import QuizOptionList from "~/common/components/QuizOptionList.vue";
import {
  getQuestion,
  getQuizHeaderMeta,
  getQuizSegState,
  isLastStep,
} from "~/common/utils/quiz";
import { TEMPAT_QUESTIONS } from "~/features/tempat/constants/questions";

const questions = TEMPAT_QUESTIONS;
const step = ref(0);
const answers = reactive<Record<string, string>>({});
const q = computed(() => getQuestion(questions, step.value));
// Q2d: header ink + label putih + dot ember, segmen blok lime (helper tested).
const headMeta = getQuizHeaderMeta("tempat");
const segState = computed(() => getQuizSegState(step.value, questions.length));
const headerSuffix = computed(
  () => ` · ${step.value + 1}/${questions.length} · ⏱ 30 dtk`,
);
const router = useRouter();

function select(v: string): void {
  answers[q.value.id] = v;
  if (!isLastStep(step.value, questions.length)) step.value++;
  else router.push({ path: "/result", query: { ...answers } });
}
</script>

<template>
  <div
    class="max-w-md mx-auto px-4 pb-10 min-h-[80vh] flex flex-col"
    style="background: #f5f5f4"
  >
    <div class="flex justify-between items-center font-bold text-[13px] py-3">
      <NuxtLink to="/" class="text-ink">← 🗺️ Quiz tempat</NuxtLink>
      <span class="text-gray-500"
        >{{ step + 1 }}/{{ questions.length }} • ⏱ 30 dtk</span
      >
    </div>
    <!-- Q2d ink header: label PUTIH + dot ember-terang, question putih, segmen blok lime -->
    <QuizHeader
      :meta="headMeta"
      :seg-state="segState"
      :question="q.question"
      :suffix="headerSuffix"
    />
    <p class="text-[13px] text-gray-500 mb-2 mt-2">
      Tap 1 — nggak ada jawaban salah
    </p>
    <QuizOptionList
      :options="q.options"
      :selected="answers[q.id]"
      :meta="headMeta"
      @select="select"
    />
    <div class="flex-1" />
    <p class="text-center text-xs text-gray-400 mt-4">
      Quota kepake pas Generate, bukan per tanya
    </p>
    <button v-if="step > 0" class="mt-2 text-gray-500 text-sm" @click="step--">
      ← Kembali
    </button>
  </div>
</template>
