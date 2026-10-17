<!-- features/auth/RegisterPage.vue → GET /register (Auth page, Addendum 09 v1.3 APPROVED).
  WHAT: 100% slice of image img_19a0ea1cfdcf — black DAFTAR GRATIS 2•5 banner + Lanjutkan dengan Google + Email + Password (SVG peek toggle + meter bar below the field) + checkbox + Daftar →.
  WHY: user clicks Register in the global topbar → sees the full-quota benefit + can register via Supabase (email or 1-click Google).
  Banner 1:1 R1 lock v9 (ink #0C0A09 + ember strip #EA580C + number #D9F99D 17px + radius 12px + font 10px left).
  TAKEOUT 10 Oct 2026 (Agesta request): Nama field removed — user only fills Email + Password.
  EXAMPLE: anonymous sees 2 • 5 → Lanjutkan dengan Google / fill Email+Password → Daftar → home. -->
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
// SSR-safe: useRoute, not router.currentRoute (Vercel 500 pitfall).
// Single-door Google Auth (11 Oct 2026): respect ?redirect= like login —
// a user coming from the quota wall who pressed Daftar still returns to their quiz context.
const redirect = getRedirectQuery(route.query.redirect);
const { googleLoading, signInWithGoogle } = useGoogleSignIn(redirect);

const email = ref("");
const password = ref("");
const agree = ref(true);
const errorMsg = ref("");
const loading = ref(false);

// Strength? meter 0-5 follows length + letter/number variety — bar + word label + scale color below the field.
const strength = computed(() => getPasswordStrength(password.value));
const strengthLabel = computed(() => getStrengthLabel(strength.value));
const strengthColor = computed(() => getStrengthColor(strength.value));

// Email+password register via Supabase signUp → /check-email (Option B magic-link, locked 10 Oct 2026).
// The verification link in the inbox returns to HOME (/). Google OAuth stays immediate (no check-email).
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

// 1-click Google via OAuth — SINGLE DOOR like login (best practice 11 Oct 2026).
// WHAT: signInWithOAuth is THE SAME (Supabase auto create-vs-login by email), neutral label THE SAME,
// redirect THE SAME respecting ?redirect=, + locks the Syarat checkbox (required for the email form, Google must not be a loophole).
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
      font-family:
        Plus Jakarta Sans,
        system-ui,
        sans-serif;
    "
  >
    <!-- 1. Black promo banner — 1:1 image (ember strip + radius 12 + light-lime number) -->
    <AuthBanner
      title="DAFTAR GRATIS"
      value="2 • 5"
      footer="quota full + voucher 🎟️"
    />

    <!-- 2. Google button — official gray outline + 4-color G logo (Option A board v10 lock "A"). -->
    <GoogleButton
      :loading="googleLoading"
      :disabled="loading || googleLoading"
      @click="handleGoogle"
    />

    <!-- ATAU divider: separates the social-login group from the email form (Option A board v10). -->
    <div class="flex items-center gap-3 mt-3 px-1" aria-hidden="true">
      <span class="flex-1 h-px" style="background: #d6d3d1" />
      <span
        class="text-[10px] font-extrabold tracking-widest"
        style="color: #a8a29e"
        >ATAU</span
      >
      <span class="flex-1 h-px" style="background: #d6d3d1" />
    </div>

    <!-- 3+4. Email + Password + strength? meter form (Nama taken out 10 Oct 2026) -->
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
      <!-- Strength meter below the field: bar + word label, only appears after the user types -->
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
      <!-- 6. Main black CTA -->
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
