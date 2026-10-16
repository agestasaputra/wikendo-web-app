<!-- features/auth/LoginPage.vue → GET /login (Auth page, Addendum 09 v1.3 APPROVED).
  APA: slicing 100% L1 EMBER HERO — banner hitam quota + Google + Email + Password•Lupa? + Masuk + pill + Daftar.
  KENAPA: user anon quota habis klik Login di topbar global → harus lihat angka real + bisa masuk via Supabase.
  Banner 1:1 L1 lock v9 (ink #0C0A09 + strip ember #EA580C + angka #D9F99D 17px + radius 12px + font 10px)
  + referensi hero HomePage (getHomeHeroMeta — 1 sumber token, bukan hardcode beda).
  Contoh: anon habis lihat 0 • 0 → Lanjutkan dengan Google / isi Email+Password → Masuk → balik ke ?redirect=. -->
<script setup lang="ts">
import AppSpinner from "~/common/components/AppSpinner.vue";
import { useSupabaseBrowser } from "~/common/composables/useSupabaseBrowser";
import type { QuotaStatus } from "~/common/types/quota";
import AuthBanner from "~/features/auth/components/AuthBanner.vue";
import GoogleButton from "~/features/auth/components/GoogleButton.vue";
import PasswordField from "~/features/auth/components/PasswordField.vue";
import { useGoogleSignIn } from "~/features/auth/composables/useGoogleSignIn";
import { getRedirectQuery } from "~/features/auth/utils/redirect";

// Quota real: GET /api/quota (cookie anon). Gagal fetch = fallback anon habis 0 • 0 kayak image.
const { data: quotaData } = await useFetch<QuotaStatus>("/api/quota");
const tempatSisa = computed(() => quotaData.value?.tempat.remaining ?? 0);
const makanSisa = computed(() => quotaData.value?.makan.remaining ?? 0);

const router = useRouter();
const route = useRoute();
// SSR-safe: useRoute, bukan router.currentRoute (pitfall 500 Vercel).
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

// Login email+password via Supabase → hormati ?redirect= (balik ke quiz/result yang dikunci).
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

// Login sekali klik via Google OAuth.
async function handleGoogle(): Promise<void> {
  if (busy.value) return;
  errorMsg.value = "";
  const err = await signInWithGoogle();
  if (err) errorMsg.value = err;
}

// Link Lupa? → email reset password Supabase. Butuh Email terisi dulu.
async function handleForgot(): Promise<void> {
  if (busy.value) return;
  errorMsg.value = "";
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
    <!-- 1. Banner hitam quota — 1:1 L1 EMBER HERO (strip ember + radius 12 + angka lime-muda) -->
    <AuthBanner
      title="QUOTA HABIS • reset 00.00"
      :value="`${tempatSisa} • ${makanSisa}`"
      footer="Login gratis → buka 2 + 5"
    >
      <!-- fallback literal ikut image 0 • 0 -->
      <span class="hidden">0 • 0</span>
    </AuthBanner>

    <!-- 2. Tombol Google — outline abu resmi + logo G 4-warna (Opsi A board v10, selaras register). -->
    <GoogleButton
      :loading="googleLoading"
      :disabled="busy"
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

    <!-- 3+4. Form Email + Password • Lupa? -->
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
      <PasswordField v-model="password">
        <template #trailing>
          <button
            type="button"
            :disabled="busy"
            class="text-sm font-bold text-black underline disabled:opacity-60 inline-flex items-center gap-1"
            @click="handleForgot"
          >
            <AppSpinner
              v-if="forgotLoading"
              color="#0C0A09"
              size="w-3.5 h-3.5"
            />
            {{ forgotLoading ? "Mengirim…" : "Lupa?" }}
          </button>
        </template>
      </PasswordField>
      <p v-if="errorMsg" class="text-center text-xs font-bold text-red-600">
        {{ errorMsg }}
      </p>
      <!-- 5. CTA utama hitam -->
      <button
        type="submit"
        :disabled="busy"
        class="w-full rounded-full py-3.5 px-4 text-white text-sm font-extrabold disabled:opacity-60 flex items-center justify-center gap-2"
        style="background: #0c0a09"
      >
        <AppSpinner v-if="loading" color="#fff" />
        {{ loading ? "Tunggu…" : "Masuk →" }}
      </button>
    </form>

    <!-- 6. Pill info kecil -->
    <div
      class="bg-white rounded-full mt-3 py-2.5 px-4 text-center text-[11px] font-bold text-black shadow-sm"
    >
      10 detik • quota reset tiap hari • gratis
    </div>

    <!-- 7. Footer tanpa kotak -->
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
