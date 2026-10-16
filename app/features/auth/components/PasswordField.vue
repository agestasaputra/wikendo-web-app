<!-- features/auth/components/PasswordField.vue → Field password pill + toggle intip (SVG Heroicons, type=button, aria-label).
APA: ikon 🔒 + input type dinamis + tombol mata kanan; slot "trailing" untuk elemen tambahan (mis. link Lupa? di login).
KENAPA: user harus bisa cek typo sebelum submit (turunin gagal login). Pattern standar: toggle ujung kanan, anti-submit, a11y.
Contoh: <PasswordField v-model="password"><template #trailing>…Lupa?…</template></PasswordField> -->
<script setup lang="ts">
import { ref } from "vue";

const model = defineModel<string>({ required: true });
const showPassword = ref(false);
</script>

<template>
  <div
    class="bg-white rounded-full flex items-center gap-2 px-4 py-3.5 shadow-sm"
  >
    <span class="text-gray-400 text-base">🔒</span>
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
      <svg
        v-if="showPassword"
        class="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
        />
      </svg>
      <svg
        v-else
        class="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c2.302 0 4.44.62 6.28 1.714M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 0c-.787 1.655-1.933 3.043-3.32 4.093M19.5 19.5 21 21m-3.228-3.228A9.959 9.959 0 0 1 12 19.5c-4.64 0-8.577-3.01-9.963-7.178m0 0A10.003 10.003 0 0 1 12 4.5c.795 0 1.57.066 2.322.19"
        />
      </svg>
    </button>
    <slot name="trailing" />
  </div>
</template>
