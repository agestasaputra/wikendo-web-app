<!-- common/components/QuizOptionList.vue → Quiz answer option list (56px cards, tap = select).
WHAT: one button per option; selected = border + bg per flow (place ember / food rose).
WHY: identical markup in the place + food quiz → 1 component. Tap emits select right away (no "Lanjut" button).
EXAMPLE: <QuizOptionList :options="q.options" :selected="answers[q.id]" :meta="meta" @select="select" /> -->
<script setup lang="ts">
import type { QuizHeaderMeta, QuizOption } from "~/common/types/quiz";

defineProps<{
  options: QuizOption[];
  selected: string | undefined;
  meta: QuizHeaderMeta;
}>();
const emit = defineEmits<{ select: [value: string] }>();
</script>

<template>
  <div class="flex flex-col gap-2 mt-1">
    <button
      v-for="o in options"
      :key="o.value"
      class="w-full bg-white rounded-[20px] p-[14px] font-bold text-sm flex gap-2.5 items-center cursor-pointer text-left border-2 transition-colors"
      :style="
        selected === o.value
          ? `border-color:${meta.selBorder};background:${meta.selBg}`
          : 'border-color:#ececec'
      "
      style="min-height: 56px"
      @click="emit('select', o.value)"
    >
      <span class="text-2xl">{{ o.icon }}</span>
      <span
        >{{ o.label }}
        <small class="font-normal text-gray-500">{{ o.desc }}</small></span
      >
    </button>
  </div>
</template>
