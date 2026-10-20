<!-- features/place/PlaceQuizPage.vue → GET /place (PLACE quiz swipe, mockup B-C combo 5+10+15).
WHAT: 1 screen 1 question + progress + opt-card + 56px Orange #f97316 button, base #fffdf9.
WHY: 1 small decision per screen = completion >70% (PRD §4). Same engine used by the food quiz → codebase 1x.
EXAMPLE: tapping an option goes next immediately (no Next button) — quota is used at Generate, not per question. -->
<script setup lang="ts">
import QuizHeader from "~/common/components/QuizHeader.vue";
import QuizOptionList from "~/common/components/QuizOptionList.vue";
import {
  getQuestion,
  getQuizHeaderMeta,
  getQuizSegState,
  isLastStep,
} from "~/common/utils/quiz";
import { PLACE_QUESTIONS } from "~/features/place/constants/questions";

const questions = PLACE_QUESTIONS;
const step = ref(0);
const answers = reactive<Record<string, string>>({});
const q = computed(() => getQuestion(questions, step.value));
// Q2d: ink header + white label + ember dot, lime block segment (tested helper).
const headMeta = getQuizHeaderMeta("place");
const segState = computed(() => getQuizSegState(step.value, questions.length));
const headerSuffix = computed(
  () => ` · ${step.value + 1}/${questions.length} · ⏱ 30 dtk`,
);
const router = useRouter();

function select(v: string): void {
  answers[q.value.id] = v;
  if (!isLastStep(step.value, questions.length)) step.value++;
  else router.push({ path: "/result-place", query: { ...answers } });
}
</script>

<template>
  <div
    class="max-w-md mx-auto px-4 pb-10 py-5 min-h-[80vh] flex flex-col"
    style="background: #f5f5f4"
  >
    <!-- Q2d ink header: WHITE label + bright-ember dot, white question, lime block segment -->
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
