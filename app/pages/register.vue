<!-- pages/register.vue → GET /register (Auth page, Addendum 09 v1.3 APPROVED).
  APA: slicing 100% image img_19a0ea1cfdcf — banner hitam DAFTAR GRATIS 2•5 + Lanjutkan dengan Google + Email + Password (toggle intip SVG + meter bar di bawah field) + checkbox + Daftar →.
  KENAPA: user klik Register di topbar global → lihat benefit quota full + bisa daftar via Supabase (email atau Google 1-klik).
  Banner 1:1 R1 lock v9 (ink #0C0A09 + strip ember #EA580C + angka #D9F99D 17px + radius 12px + font 10px kiri).
  TAKEOUT 10 Okt 2026 (request Agesta): field Nama dihapus — user hanya isi Email + Password.
  Contoh: anon lihat 2 • 5 → Lanjutkan dengan Google / isi Email+Password → Daftar → home. -->
<script setup lang="ts">
import { supabaseBrowser } from '~/utils/supabase'

const router = useRouter()
const route = useRoute()
// SSR-safe: useRoute, bukan router.currentRoute (pitfall 500 Vercel).
// Google Auth satu pintu (11 Okt 2026): hormati ?redirect= kayak login —
// user dari quota wall yang kepencet Daftar tetap balik ke konteks quiz-nya.
const redirect = (route.query.redirect as string) || '/'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const agree = ref(true)
const errorMsg = ref('')
const loading = ref(false)
const googleLoading = ref(false)

// Meter kuat? 0-5 ikut panjang + variasi huruf/angka — render bar + label kata di bawah field.
const strength = computed(() => {
  const p = password.value
  let s = 0
  if (p.length >= 4) s += 1
  if (p.length >= 6) s += 1
  if (p.length >= 8) s += 1
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s += 1
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s += 1
  return Math.min(5, s)
})

// Label kata + warna skala merah→hijau biar user paham tanpa nebak arti kotak.
const strengthLabel = computed(() => {
  const s = strength.value
  if (s <= 1) return 'Lemah'
  if (s === 2) return 'Sedang'
  if (s === 3) return 'Kuat'
  if (s === 4) return 'Kuat'
  return 'Sangat kuat'
})
const strengthColor = computed(() => {
  const s = strength.value
  if (s <= 1) return '#DC2626'
  if (s === 2) return '#EA580C'
  if (s === 3) return '#CA8A04'
  return '#16A34A'
})

// Daftar email+password via Supabase signUp → /check-email (Opsi B magic-link, lock 10 Okt 2026).
// Link verifikasi di inbox balik ke HOME (/). Google OAuth tetap langsung (tanpa cek-email).
async function handleRegister() {
  if (loading.value) return
  errorMsg.value = ''
  loading.value = true
  try {
    const sb = supabaseBrowser()
    const { error } = await sb.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : '/'
      }
    })
    if (error) {
      errorMsg.value = error.message
      return
    }
    router.push({ path: '/check-email', query: { email: email.value } })
  } finally {
    loading.value = false
  }
}

// Google 1-klik via OAuth — SATU PINTU kayak login (best practice 11 Okt 2026).
// APA: signInWithOAuth SAMA (Supabase auto create-vs-login by email), label netral SAMA,
// redirect SAMA hormati ?redirect=, + kunci checkbox Syarat (form email wajib, Google jangan bolong).
// KENAPA: label beda = beban pikir "gue yang mana?" + redirect beda = konteks quiz hilang.
async function handleGoogle() {
  if (loading.value || googleLoading.value) return
  errorMsg.value = ''
  if (!agree.value) {
    errorMsg.value = 'Centang dulu Setuju Syarat & Privasi biar bisa lanjut.'
    return
  }
  googleLoading.value = true
  try {
    const sb = supabaseBrowser()
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? `${window.location.origin}${redirect}` : redirect }
    })
    if (error) errorMsg.value = error.message
  } finally {
    googleLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 pb-10 min-h-screen" style="background:#F5F5F4;font-family:'Plus Jakarta Sans',system-ui,sans-serif">
    <!-- 1. Banner hitam promo — 1:1 image (strip ember + radius 12 + angka lime-muda) -->
    <div class="p-2 text-white mt-4" style="background:#0C0A09;border-left:4px solid #EA580C;border-radius:12px;font-size:10px;font-weight:800">
      DAFTAR GRATIS
      <div style="color:#D9F99D;font-size:17px;font-weight:800;margin:2px 0">2 • 5</div>
      quota full + voucher 🎟️
    </div>

    <!-- 2. Tombol Google — outline abu resmi + logo G 4-warna (Opsi A board v10 lock "A").
      KENAPA outline bukan solid-putih: token solid-putih kembar pill form → user baca
      sebagai field pertama; border #DADCE0 = tema outline resmi Google + G 4-warna
      patuh branding guideline, CTA hitam tetap satu-satunya solid. -->
    <button type="button" :disabled="loading || googleLoading" class="w-full bg-white rounded-full mt-3 py-3.5 px-4 font-extrabold text-sm text-black flex items-center justify-center gap-2 disabled:opacity-60" style="border:1.5px solid #DADCE0" @click="handleGoogle">
      <svg v-if="googleLoading" class="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="#4285F4" stroke-opacity=".25" stroke-width="4" /><path d="M22 12a10 10 0 0 0-10-10" stroke="#4285F4" stroke-width="4" stroke-linecap="round" /></svg>
      <svg v-else class="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
      {{ googleLoading ? 'Menghubungkan…' : 'Lanjutkan dengan Google' }}
    </button>

    <!-- Divider ATAU: pemisah grup login-sosial vs form-email (Opsi A board v10).
      KENAPA: tanpa pemisah dua grup beda kecampur satu (Gestalt) → ATAU tegas. -->
    <div class="flex items-center gap-3 mt-3 px-1" aria-hidden="true">
      <span class="flex-1 h-px" style="background:#D6D3D1" />
      <span class="text-[10px] font-extrabold tracking-widest" style="color:#A8A29E">ATAU</span>
      <span class="flex-1 h-px" style="background:#D6D3D1" />
    </div>

    <!-- 3+4. Form Email + Password + meter kuat? (Nama di-takeout 10 Okt 2026) -->
    <form class="space-y-3 mt-3" @submit.prevent="handleRegister">
      <div class="bg-white rounded-full flex items-center gap-2 px-4 py-3.5 shadow-sm">
        <span class="text-gray-400 text-base">✉️</span>
        <input v-model="email" type="email" required placeholder="Email" class="flex-1 bg-transparent outline-none text-sm font-bold text-black placeholder:text-gray-400">
      </div>
      <div class="bg-white rounded-full flex items-center gap-2 px-4 py-3.5 shadow-sm">
        <span class="text-gray-400 text-base">🔒</span>
        <input v-model="password" :type="showPassword ? 'text' : 'password'" required placeholder="Password" class="flex-1 bg-transparent outline-none text-sm font-bold text-black placeholder:text-gray-400">
        <button type="button" :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'" class="text-gray-400 hover:text-gray-600 leading-none shrink-0" @click="showPassword = !showPassword">
          <svg v-if="showPassword" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
          <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c2.302 0 4.44.62 6.28 1.714M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 0c-.787 1.655-1.933 3.043-3.32 4.093M19.5 19.5 21 21m-3.228-3.228A9.959 9.959 0 0 1 12 19.5c-4.64 0-8.577-3.01-9.963-7.178m0 0A10.003 10.003 0 0 1 12 4.5c.795 0 1.57.066 2.322.19" /></svg>
        </button>
      </div>
      <!-- Meter kekuatan di bawah field: bar + label kata, cuma muncul setelah user ngetik -->
      <div v-if="password.length" class="px-4">
        <div class="h-1.5 rounded-full overflow-hidden" style="background:#E5E7EB">
          <div class="h-full rounded-full transition-all" :style="{ width: (strength * 20) + '%', background: strengthColor }" />
        </div>
        <p class="text-[11px] font-bold mt-1" :style="{ color: strengthColor }">Password {{ strengthLabel }}</p>
      </div>
      <div class="flex items-center gap-2 px-1">
        <input id="terms" v-model="agree" type="checkbox" required checked class="w-4 h-4 rounded border-gray-300">
        <label for="terms" class="text-xs font-bold text-black">
          Setuju Syarat & Privasi
        </label>
      </div>
      <p v-if="errorMsg" class="text-center text-xs font-bold text-red-600">{{ errorMsg }}</p>
      <!-- 6. CTA utama hitam -->
      <button type="submit" :disabled="loading || googleLoading" class="w-full rounded-full py-3.5 px-4 text-white text-sm font-extrabold disabled:opacity-60 flex items-center justify-center gap-2" style="background:#0C0A09">
        <svg v-if="loading" class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="#fff" stroke-opacity=".25" stroke-width="4" /><path d="M22 12a10 10 0 0 0-10-10" stroke="#fff" stroke-width="4" stroke-linecap="round" /></svg>
        {{ loading ? 'Tunggu…' : 'Daftar →' }}
      </button>
    </form>
  </div>
</template>
