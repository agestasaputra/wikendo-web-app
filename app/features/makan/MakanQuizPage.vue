<!-- features/makan/MakanQuizPage.vue → GET /makan (Quiz MAKAN swipe, mockup E-F kombo 5+15).
APA: engine swipe SAMA kayak quiz tempat, Q beda (mall wajib → misi → budget → rombongan+toggle), aksen Merah #ee2c4b.
KENAPA: codebase 1x, bukan 2x (reuse engine ~10 jam hemat). Q1 mall wajib biar hasil murni tenant situ (Split PRD).
Contoh: dibuka dari direktori (/makan?mall=gi) → Q1 di-skip otomatis via getMakanStartStep. -->
<script setup lang="ts">
import QuizHeader from "~/common/components/QuizHeader.vue";
import QuizOptionList from "~/common/components/QuizOptionList.vue";
import { getMallShortLabel } from "~/common/utils/mall";
import {
  getQuestion,
  getQuizHeaderMeta,
  getQuizSegState,
  isLastStep,
} from "~/common/utils/quiz";
import {
  MAKAN_MALL_SLUGS,
  MAKAN_QUESTIONS,
} from "~/features/makan/constants/questions";
import {
  getMakanHint,
  getMakanStartStep,
} from "~/features/makan/utils/makanQuiz";

const route = useRoute();
const router = useRouter();
const questions = MAKAN_QUESTIONS;
const mallQuery =
  typeof route.query.mall === "string" ? route.query.mall : undefined;
const startStep = getMakanStartStep(mallQuery, MAKAN_MALL_SLUGS);
const step = ref(startStep);
const answers = reactive<Record<string, string>>(
  mallQuery ? { mall_slug: mallQuery } : {},
);
const halalOnly = ref(false);
const kidsFriendly = ref(false);
const q = computed(() => getQuestion(questions, step.value));
// M3d: header ink + label putih + dot rose, segmen blok lime + chip mall (helper tested).
const headMeta = getQuizHeaderMeta("makan");
const segState = computed(() => getQuizSegState(step.value, questions.length));
const mallShort = computed(() =>
  answers.mall_slug ? getMallShortLabel(answers.mall_slug) : "",
);
const headerSuffix = computed(
  () =>
    `${mallShort.value ? " · " + mallShort.value + " 📍" : ""} · ${step.value + 1}/${questions.length}`,
);

function isMallChipActive(slug: string): boolean {
  return (
    answers.mall_slug === slug ||
    (!answers.mall_slug && slug === "grand-indonesia")
  );
}

function select(v: string): void {
  answers[q.value.id] = v;
  if (!isLastStep(step.value, questions.length)) {
    step.value++;
    return;
  }
  router.push({
    path: "/result-makan",
    query: {
      ...answers,
      halal_only: String(halalOnly.value),
      kids_friendly: String(kidsFriendly.value),
    },
  });
}
</script>

<template>
  <div
    class="max-w-md mx-auto px-4 pb-10 min-h-[80vh] flex flex-col"
    style="background: #f5f5f4"
  >
    <div class="flex justify-between items-center font-bold text-[13px] py-3">
      <NuxtLink to="/" class="text-ink">← 🍜 Quiz makan</NuxtLink>
      <span class="text-gray-500"
        >{{ step + 1 }}/{{ questions.length }} • ⏱ 20 dtk</span
      >
    </div>
    <!-- M3d ink header: label PUTIH + dot rose-terang, question putih, segmen blok lime -->
    <QuizHeader
      :meta="headMeta"
      :seg-state="segState"
      :question="q.question"
      :suffix="headerSuffix"
    />
    <p class="text-[13px] text-gray-500 mb-2 mt-2">{{ getMakanHint(q.id) }}</p>

    <!-- Q1 mall: chip mall horizontal (mockup E) + kartu terpilih -->
    <div v-if="q.id === 'mall_slug'" class="flex gap-2 overflow-x-auto py-3">
      <button
        v-for="o in q.options"
        :key="o.value"
        class="flex-none text-xs font-bold rounded-xl px-3 py-2.5 bg-white cursor-pointer border-[1.5px]"
        :style="
          isMallChipActive(o.value)
            ? 'background:#ee2c4b;color:#fff;border-color:#ee2c4b'
            : 'border-color:#e4e4e7'
        "
        @click="select(o.value)"
      >
        {{ getMallShortLabel(o.value) }}
      </button>
    </div>

    <QuizOptionList
      :options="q.options"
      :selected="answers[q.id]"
      :meta="headMeta"
      @select="select"
    />

    <!-- Q4 toggle halal/kids (mockup F) -->
    <div v-if="q.toggles" class="flex gap-2 mt-2">
      <button
        class="flex-1 rounded-full py-2.5 font-bold text-xs bg-white border-[1.5px]"
        :style="
          halalOnly
            ? 'background:#18181b;color:#fff;border-color:#18181b'
            : 'border-color:#e4e4e7'
        "
        @click="halalOnly = !halalOnly"
      >
        ✅ Halal only
      </button>
      <button
        class="flex-1 rounded-full py-2.5 font-bold text-xs bg-white border-[1.5px]"
        :style="
          kidsFriendly
            ? 'background:#18181b;color:#fff;border-color:#18181b'
            : 'border-color:#e4e4e7'
        "
        @click="kidsFriendly = !kidsFriendly"
      >
        👶 Kids-friendly
      </button>
    </div>

    <div class="flex-1" />
    <p class="text-center text-xs text-gray-400 mt-4">
      {{
        step === questions.length - 1
          ? "Lihat 5 tenant + voucher →"
          : "Quota kepake pas Generate, bukan per tanya"
      }}
    </p>
    <button
      v-if="step > startStep"
      class="mt-2 text-gray-500 text-sm"
      @click="step--"
    >
      ← Kembali
    </button>
  </div>
</template>
