<!-- features/auth/RegisterPage.vue → GET /register (Auth page, Addendum 09 v1.3 APPROVED).
  APA: slicing 100% image img_19a0ea1cfdcf — banner hitam DAFTAR GRATIS 2•5 + Lanjutkan dengan Google + Email + Password (toggle intip SVG + meter bar di bawah field) + checkbox + Daftar →.
  KENAPA: user klik Register di topbar global → lihat benefit quota full + bisa daftar via Supabase (email atau Google 1-klik).
  Banner 1:1 R1 lock v9 (ink #0C0A09 + strip ember #EA580C + angka #D9F99D 17px + radius 12px + font 10px kiri).
  TAKEOUT 10 Okt 2026 (request Agesta): field Nama dihapus — user hanya isi Email + Password.
  Contoh: anon lihat 2 • 5 → Lanjutkan dengan Google / isi Email+Password → Daftar → home. -->
<script setup lang="ts">
import AppSpinner from "~/common/components/AppSpinner.vue";
import { useSupabaseBrowser } from "~/common/composables/useSupabaseBrowser";
import AuthBanner from "~/features/auth/components/AuthBanner.vue";
import GoogleButton from "~/features/auth/components/GoogleButton.vue";
import PasswordField from "~/features/auth/components/PasswordField.vue";
import { useGoogleSignIn } from "~/features/auth/composables/useGoogleSignIn";
import {
  getPasswordStrength,
  getStrengthColor,
  getStrengthLabel,
} from "~/features/auth/utils/passwordStrength";
import {
  buildOriginUrl,
  getRedirectQuery,
} from "~/features/auth/utils/redirect";

const router = useRouter();
const route = useRoute();
// SSR-safe: useRoute, bukan router.currentRoute (pitfall 500 Vercel).
// Google Auth satu pintu (11 Okt 2026): hormati ?redirect= kayak login —
// user dari quota wall yang kepencet Daftar tetap balik ke konteks quiz-nya.
const redirect = getRedirectQuery(route.query.redirect);
const { googleLoading, signInWithGoogle } = useGoogleSignIn(redirect);

const email = ref("");
const password = ref("");
const agree = ref(true);
const errorMsg = ref("");
const loading = ref(false);

// Meter kuat? 0-5 ikut panjang + variasi huruf/angka — bar + label kata + warna skala di bawah field.
const strength = computed(() => getPasswordStrength(password.value));
const strengthLabel = computed(() => getStrengthLabel(strength.value));
const strengthColor = computed(() => getStrengthColor(strength.value));

// Daftar email+password via Supabase signUp → /check-email (Opsi B magic-link, lock 10 Okt 2026).
// Link verifikasi di inbox balik ke HOME (/). Google OAuth tetap langsung (tanpa cek-email).
async function handleRegister(): Promise<void> {
  if (loading.value) return;
  errorMsg.value = "";
  loading.value = true;
  try {
    const { error } = await useSupabaseBrowser().auth.signUp({
      email: email.value,
      password: password.value,
      options: { emailRedirectTo: buildOriginUrl("/") },
    });
    if (error) {
      errorMsg.value = error.message;
      return;
    }
    router.push({ path: "/check-email", query: { email: email.value } });
  } finally {
    loading.value = false;
  }
}

// Google 1-klik via OAuth — SATU PINTU kayak login (best practice 11 Okt 2026).
// APA: signInWithOAuth SAMA (Supabase auto create-vs-login by email), label netral SAMA,
// redirect SAMA hormati ?redirect=, + kunci checkbox Syarat (form email wajib, Google jangan bolong).
async function handleGoogle(): Promise<void> {
  if (loading.value || googleLoading.value) return;
  errorMsg.value = "";
  if (!agree.value) {
    errorMsg.value = "Centang dulu Setuju Syarat & Privasi biar bisa lanjut.";
    return;
  }
  const err = await signInWithGoogle();
  if (err) errorMsg.value = err;
}
</script>

<template>
  <div
    class="max-w-md mx-auto px-4 pb-10 min-h-screen"
    style="
      background: #f5f5f4;
      font-family: &quot;Plus Jakarta Sans&quot;, system-ui, sans-serif;
    "
  >
    <!-- 1. Banner hitam promo — 1:1 image (strip ember + radius 12 + angka lime-muda) -->
    <AuthBanner
      title="DAFTAR GRATIS"
      value="2 • 5"
      footer="quota full + voucher 🎟️"
    />

    <!-- 2. Tombol Google — outline abu resmi + logo G 4-warna (Opsi A board v10 lock "A"). -->
    <GoogleButton
      :loading="googleLoading"
      :disabled="loading || googleLoading"
      @click="handleGoogle"
    />

    <!-- Divider ATAU: pemisah grup login-sosial vs form-email (Opsi A board v10). -->
    <div class="flex items-center gap-3 mt-3 px-1" aria-hidden="true">
      <span class="flex-1 h-px" style="background: #d6d3d1" />
      <span
        class="text-[10px] font-extrabold tracking-widest"
        style="color: #a8a29e"
        >ATAU</span
      >
      <span class="flex-1 h-px" style="background: #d6d3d1" />
    </div>

    <!-- 3+4. Form Email + Password + meter kuat? (Nama di-takeout 10 Okt 2026) -->
    <form class="space-y-3 mt-3" @submit.prevent="handleRegister">
      <div
        class="bg-white rounded-full flex items-center gap-2 px-4 py-3.5 shadow-sm"
      >
        <span class="text-gray-400 text-base">✉️</span>
        <input
          v-model="email"
          type="email"
          required
          placeholder="Email"
          class="flex-1 bg-transparent outline-none text-sm font-bold text-black placeholder:text-gray-400"
        />
      </div>
      <PasswordField v-model="password" />
      <!-- Meter kekuatan di bawah field: bar + label kata, cuma muncul setelah user ngetik -->
      <div v-if="password.length" class="px-4">
        <div
          class="h-1.5 rounded-full overflow-hidden"
          style="background: #e5e7eb"
        >
          <div
            class="h-full rounded-full transition-all"
            :style="{
              width: strength * 20 + '%',
              background: strengthColor,
            }"
          />
        </div>
        <p class="text-[11px] font-bold mt-1" :style="{ color: strengthColor }">
          Password {{ strengthLabel }}
        </p>
      </div>
      <div class="flex items-center gap-2 px-1">
        <input
          id="terms"
          v-model="agree"
          type="checkbox"
          required
          checked
          class="w-4 h-4 rounded border-gray-300"
        />
        <label for="terms" class="text-xs font-bold text-black">
          Setuju Syarat & Privasi
        </label>
      </div>
      <p v-if="errorMsg" class="text-center text-xs font-bold text-red-600">
        {{ errorMsg }}
      </p>
      <!-- 6. CTA utama hitam -->
      <button
        type="submit"
        :disabled="loading || googleLoading"
        class="w-full rounded-full py-3.5 px-4 text-white text-sm font-extrabold disabled:opacity-60 flex items-center justify-center gap-2"
        style="background: #0c0a09"
      >
        <AppSpinner v-if="loading" color="#fff" />
        {{ loading ? "Tunggu…" : "Daftar →" }}
      </button>
    </form>
  </div>
</template>
