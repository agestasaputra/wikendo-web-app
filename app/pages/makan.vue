<!-- pages/makan.vue → GET /makan (Quiz MAKAN swipe, mockup E-F kombo 5+15).
  APA: engine swipe SAMA kayak quiz tempat, Q beda (mall wajib → misi → budget → rombongan+toggle), aksen Merah #ee2c4b.
  KENAPA: codebase 1x, bukan 2x (reuse engine ~10 jam hemat). Q1 mall wajib biar hasil murni tenant situ (Split PRD).
  Contoh: dibuka dari direktori (/makan?mall=gi) → Q1 di-skip otomatis via getMakanStartStep. -->
<script setup lang="ts">
import { isLastStep, getMakanStartStep, getQuizHeaderMeta, getQuizSegState, getMallShortLabel } from '~/utils/quiz-logic'

const route = useRoute()
const questions = [
  { id: 'mall_slug', question: 'Makan di mall mana? 📍', options: [
    { icon: '🏬', label: 'Grand Indonesia', desc: '40 tenant • Thamrin', value: 'grand-indonesia' },
    { icon: '🏬', label: 'Central Park', desc: 'Grogol, Jakbar', value: 'central-park' },
    { icon: '🏬', label: 'Kota Kasablanka', desc: 'Tebet, Jaksel', value: 'kota-kasablanka' },
    { icon: '🏬', label: 'Pondok Indah Mall', desc: 'PIM, Jaksel', value: 'pondok-indah-mall' },
    { icon: '🏬', label: 'Aeon BSD', desc: 'BSD, Tangerang', value: 'aeon-bsd' }
  ] },
  { id: 'mission', question: 'Misi makan kali ini? 🎯', options: [
    { icon: '⚡', label: 'Makan Cepat', desc: 'Laper, langsung makan', value: 'makan_cepat' },
    { icon: '☕', label: 'Nongkrong Lama', desc: 'Ngobrol, kerja, kopi', value: 'nongkrong_lama' },
    { icon: '👨‍👩‍👧', label: 'Keluarga', desc: 'Ajak anak / rame', value: 'keluarga' },
    { icon: '🧘', label: 'Healing', desc: 'Me time, santai', value: 'healing' }
  ] },
  { id: 'budget_tier', question: 'Budget per orang? 💰', options: [
    { icon: '💰', label: 'Hemat', desc: '< Rp 50.000', value: 'hemat' },
    { icon: '💰💰', label: 'Menengah', desc: 'Rp 50-150rb', value: 'menengah' },
    { icon: '💰💰💰', label: 'Leluasa', desc: '> Rp 150.000', value: 'leluasa' }
  ] },
  { id: 'companion', question: 'Rombongan + pantangan? 👥', toggles: true, options: [
    { icon: '🧘', label: 'Sendiri', desc: 'Me time', value: 'sendiri' },
    { icon: '💑', label: 'Berdua', desc: 'Pasangan / teman', value: 'berdua' },
    { icon: '👥', label: 'Rame-rame', desc: '3+ orang', value: 'rame' }
  ] }
]
const validSlugs = questions[0].options.map(o => o.value)
const startStep = getMakanStartStep(route.query.mall as string | undefined, validSlugs)
const step = ref(startStep)
const answers = reactive<Record<string, string>>(
  route.query.mall ? { mall_slug: route.query.mall as string } : {}
)
const halalOnly = ref(false)
const kidsFriendly = ref(false)
const q = computed(() => questions[step.value])
// M3d: header ink + label putih + dot rose, segmen blok lime + chip mall (helper tested).
const headMeta = getQuizHeaderMeta('makan')
const segState = computed(() => getQuizSegState(step.value, questions.length))
const mallShort = computed(() => answers.mall_slug ? getMallShortLabel(answers.mall_slug) : '')
const router = useRouter()
function select(v: string) {
  answers[questions[step.value].id] = v
  if (!isLastStep(step.value, questions.length)) step.value++
  else router.push({ path: '/result-makan', query: { ...answers, halal_only: String(halalOnly.value), kids_friendly: String(kidsFriendly.value) } })
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 pb-10 min-h-[80vh] flex flex-col" style="background:#F5F5F4">
    <div class="flex justify-between items-center font-bold text-[13px] py-3">
      <NuxtLink to="/" class="text-ink">← 🍜 Quiz makan</NuxtLink>
      <span class="text-gray-500">{{ step + 1 }}/{{ questions.length }} • ⏱ 20 dtk</span>
    </div>
    <!-- M3d ink header: label PUTIH + dot rose-terang, question putih, segmen blok lime -->
    <div class="rounded-[14px] p-[10px_12px]" :style="{ background: headMeta.headBg }">
      <div class="text-[10px] font-extrabold tracking-wide" :style="{ color: headMeta.labelColor }">
        <span :style="{ color: headMeta.dot }">●</span> {{ headMeta.label }}{{ mallShort ? ' · ' + mallShort + ' 📍' : '' }} · {{ step + 1 }}/{{ questions.length }}
      </div>
      <div class="text-[19px] font-extrabold leading-snug mt-1" :style="{ color: headMeta.questionColor }">{{ q.question }}</div>
      <div class="flex gap-[5px] mt-[10px]">
        <i v-for="(on, i) in segState" :key="i" class="flex-1 h-2 rounded-full" :style="{ background: on ? headMeta.segOn : 'rgba(255,255,255,.22)' }" />
      </div>
    </div>
    <p class="text-[13px] text-gray-500 mb-2 mt-2">{{ q.id === 'mall_slug' ? 'Wajib 1 — biar hasil murni tenant situ' : q.id === 'companion' ? 'Terakhir, janji 😄' : 'Tap 1 — nggak ada jawaban salah' }}</p>

    <!-- Q1 mall: chip mall horizontal (mockup E) + kartu terpilih -->
    <div v-if="q.id === 'mall_slug'" class="flex gap-2 overflow-x-auto py-3">
      <button
        v-for="o in q.options"
        :key="o.value"
        class="flex-none text-xs font-bold rounded-xl px-3 py-2.5 bg-white cursor-pointer border-[1.5px]"
        :style="answers.mall_slug === o.value || (!answers.mall_slug && o.value === 'grand-indonesia') ? 'background:#ee2c4b;color:#fff;border-color:#ee2c4b' : 'border-color:#e4e4e7'"
        @click="select(o.value)"
      >
        {{ o.label.replace('Grand Indonesia', 'GI').replace('Central Park', 'CP').replace('Kota Kasablanka', 'Kokas').replace('Pondok Indah Mall', 'PIM').replace('Aeon BSD', 'Aeon') }}
      </button>
    </div>

    <div class="flex flex-col gap-2 mt-1">
      <button
        v-for="o in q.options"
        :key="o.value"
        class="w-full bg-white rounded-[20px] p-[14px] font-bold text-sm flex gap-2.5 items-center cursor-pointer text-left border-2 transition-colors"
        :style="answers[q.id] === o.value ? `border-color:${headMeta.selBorder};background:${headMeta.selBg}` : 'border-color:#ececec'"
        style="min-height:56px"
        @click="select(o.value)"
      >
        <span class="text-2xl">{{ o.icon }}</span>
        <span>{{ o.label }} <small class="font-normal text-gray-500">{{ o.desc }}</small></span>
      </button>
    </div>

    <!-- Q4 toggle halal/kids (mockup F) -->
    <div v-if="q.toggles" class="flex gap-2 mt-2">
      <button class="flex-1 rounded-full py-2.5 font-bold text-xs bg-white border-[1.5px]" :style="halalOnly ? 'background:#18181b;color:#fff;border-color:#18181b' : 'border-color:#e4e4e7'" @click="halalOnly = !halalOnly">✅ Halal only</button>
      <button class="flex-1 rounded-full py-2.5 font-bold text-xs bg-white border-[1.5px]" :style="kidsFriendly ? 'background:#18181b;color:#fff;border-color:#18181b' : 'border-color:#e4e4e7'" @click="kidsFriendly = !kidsFriendly">👶 Kids-friendly</button>
    </div>

    <div class="flex-1" />
    <p class="text-center text-xs text-gray-400 mt-4">{{ step === questions.length - 1 ? 'Lihat 5 tenant + voucher →' : 'Quota kepake pas Generate, bukan per tanya' }}</p>
    <button v-if="step > startStep" class="mt-2 text-gray-500 text-sm" @click="step--">← Kembali</button>
  </div>
</template>
