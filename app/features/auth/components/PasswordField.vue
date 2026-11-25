<!-- features/auth/components/PasswordField.vue → Pill password field + peek toggle (Heroicons SVG, type=button, aria-label).
WHAT: Lock icon + dynamic-type input + right eye button; "trailing" slot for extra elements (e.g. the Lupa? link in login).
WHY: user must be able to check typos before submit (cuts failed logins). Standard pattern: end-right toggle, anti-submit, a11y.
EXAMPLE: <PasswordField v-model="password"><template #trailing>…Lupa?…</template></PasswordField> -->
<script setup lang="ts">
import { ref } from "vue";
import { Lock, Eye, EyeOff } from "@lucide/vue";

const model = defineModel<string>({ required: true });
const showPassword = ref(false);
</script>

<template>
  <div
    class="bg-white rounded-full flex items-center gap-2 px-4 py-3.5 shadow-sm"
  >
    <Lock class="text-gray-400" :size="16" />
    <input
      v-model="model"
      :type="showPassword ? 'text' : 'password'"
      required
      placeholder="Password"
      class="flex-1 bg-transparent outline-none text-sm font-bold text-black placeholder:text-gray-400"
    />
    <button
      type="button"
      :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
      class="text-gray-400 hover:text-gray-600 leading-none shrink-0"
      @click="showPassword = !showPassword"
    >
      <Eye v-if="showPassword" :size="20" />
      <EyeOff v-else :size="20" />
    </button>
    <slot name="trailing" />
  </div>
</template>
