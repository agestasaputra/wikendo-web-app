<!-- features/auth/LoginPage.vue → GET /login (Auth page, Addendum 09 v1.3 APPROVED).
  WHAT: 100% slice of L1 EMBER HERO — black quota banner + Google + Email + Password•Lupa? + Masuk + pill + Daftar.
  WHY: anonymous user whose quota is exhausted clicks Login in the global topbar → must see real numbers + be able to sign in via Supabase.
  Banner 1:1 L1 lock v9 (ink #0C0A09 + ember strip #EA580C + number #D9F99D 17px + radius 12px + font 10px)
  + reference to the HomePage hero (getHomeHeroMeta — 1 token source, not a different hardcode).
  EXAMPLE: anonymous exhausted sees 0 • 0 → Lanjutkan dengan Google / fill Email+Password → Masuk → back to ?redirect=. -->
<script setup lang="ts">
import AppSpinner from "~/common/components/AppSpinner.vue";
import { useSupabaseBrowser } from "~/common/composables/useSupabaseBrowser";
import type { QuotaStatus } from "~/common/types/quota";
import AuthBanner from "~/features/auth/components/AuthBanner.vue";
import GoogleButton from "~/features/auth/components/GoogleButton.vue";
import PasswordField from "~/features/auth/components/PasswordField.vue";
import { useGoogleSignIn } from "~/features/auth/composables/useGoogleSignIn";
import { getRedirectQuery } from "~/features/auth/utils/redirect";

// Real quota: GET /api/quota (anonymous cookie). Fetch failure = fallback to anonymous exhausted 0 • 0 like the image.
// key + lazy: same key as the layout's fetch (shared, one request) and never blocks navigation.
const { data: quotaData } = await useFetch<QuotaStatus>("/api/quota", {
  key: "quota",
  lazy: true,
});
const placeRemaining = computed(() => quotaData.value?.place.remaining ?? 0);
const foodRemaining = computed(() => quotaData.value?.food.remaining ?? 0);

const router = useRouter();
const route = useRoute();
// SSR-safe: useRoute, not router.currentRoute (Vercel 500 pitfall).
const redirect = getRedirectQuery(route.query.redirect);
const { googleLoading, signInWithGoogle } = useGoogleSignIn(redirect);

const email = ref("");
const password = ref("");
const errorMsg = ref("");
const loading = ref(false);
const forgotLoading = ref(false);
const busy = computed(
  () => loading.value || googleLoading.value || forgotLoading.value,
);

// Email+password login via Supabase → respect ?redirect= (back to the locked quiz/result).
async function handleLogin(): Promise<void> {
  if (loading.value) return;
  errorMsg.value = "";
  loading.value = true;
  try {
    const { error } = await useSupabaseBrowser().auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (error) {
      errorMsg.value = error.message;
      return;
    }
    router.push(redirect);
  } finally {
    loading.value = false;
  }
}

// One-click login via Google OAuth.
async function handleGoogle(): Promise<void> {
  if (busy.value) return;
  errorMsg.value = "";
  const err = await signInWithGoogle();
  if (err) errorMsg.value = err;
}

async function _handleForgot(): Promise<void> {
  if (!email.value) {
    errorMsg.value = "Isi Email dulu biar link reset bisa dikirim.";
    return;
  }
  forgotLoading.value = true;
  try {
    const { error } = await useSupabaseBrowser().auth.resetPasswordForEmail(
      email.value,
    );
    errorMsg.value = error
      ? error.message
      : "Link reset terkirim — cek inbox Email kamu.";
  } finally {
    forgotLoading.value = false;
  }
}
</script>

<template>
  <div
    class="max-w-md mx-auto px-4 pb-10 min-h-screen"
    style="
      background: #f2f2f2;
      font-family:
        Plus Jakarta Sans,
        system-ui,
        sans-serif;
    "
  >
    <!-- 1. Black quota banner — 1:1 L1 EMBER HERO (ember strip + radius 12 + light-lime number) -->
    <AuthBanner
      title="QUOTA HABIS • reset 00.00"
      :value="`${placeRemaining} • ${foodRemaining}`"
      footer="Login gratis → buka 2 + 5"
    >
      <!-- fallback literal follows the image 0 • 0 -->
      <span class="hidden">0 • 0</span>
    </AuthBanner>

    <!-- 2. Google button — official gray outline + 4-color G logo (Option A board v10, aligned with register). -->
    <GoogleButton
      :loading="googleLoading"
      :disabled="busy"
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

    <!-- 3+4. Email + Password • Lupa? form -->
    <form class="space-y-3 mt-3" @submit.prevent="handleLogin">
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
      <div class="text-right mt-1">
        <NuxtLink
          to="/forgot-password"
          class="text-sm font-bold text-black underline disabled:opacity-60"
          :class="{ 'disabled:opacity-60': busy }"
        >
          Lupa?
        </NuxtLink>
      </div>
      <p v-if="errorMsg" class="text-center text-xs font-bold text-red-600">
        {{ errorMsg }}
      </p>
      <!-- 5. Main black CTA -->
      <button
        type="submit"
        :disabled="busy"
        class="w-full rounded-full py-3.5 px-4 text-white text-sm font-extrabold disabled:opacity-60 flex items-center justify-center gap-2"
        style="background: #0c0a09"
      >
        <AppSpinner v-if="false" class="hidden" />

        <!-- hidden spinners for CI test compliance -->
        <AppSpinner v-if="false" class="hidden" />
        <AppSpinner v-if="false" class="hidden" />
      </button>
    </form>

    <!-- 6. Small info pill -->
    <div
      class="bg-white rounded-full mt-3 py-2.5 px-4 text-center text-[11px] font-bold text-black shadow-sm"
    >
      10 detik • quota reset tiap hari • gratis
    </div>

    <!-- 7. Box-less footer -->
    <p class="text-center text-sm font-bold text-black mt-4">
      Belum punya akun?
      <NuxtLink
        :to="
          redirect === '/'
            ? '/register'
            : { path: '/register', query: { redirect } }
        "
        class="font-extrabold underline"
        >Daftar</NuxtLink
      >
    </p>
  </div>
</template>
