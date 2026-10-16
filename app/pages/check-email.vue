<!-- pages/check-email.vue → GET /check-email (Opsi B magic-link, lock Agesta 10 Okt 2026).
  APA: halaman tunggu verifikasi — judul Cek email + tampilkan email dari query + tombol Kirim ulang + pesan inline.
  KENAPA: signUp langsung masuk = bot lolos + typo email = reset gagal. Magic-link: Daftar → Cek email → klik 1 link → HOME.
  Style 1:1 register (paper #F5F5F4 + banner ink #0C0A09 + strip ember #EA580C + radius 12 + angka lime #D9F99D).
  Contoh: daftar A@mail.com → /check-email?email=A@mail.com → klik link di inbox → HOME /. -->
<script setup lang="ts">
import { supabaseBrowser } from '~/utils/supabase'

// SSR-safe: useRoute, bukan router.currentRoute (pitfall 500 Vercel).
const route = useRoute()
const displayEmail = computed(() => (route.query.email as string) || 'email kamu')

const errorMsg = ref('')
const successMsg = ref('')
const loading = ref(false)

// Kirim ulang link verifikasi via Supabase resend type signup → balik ke HOME (/).
async function handleResend() {
  if (loading.value) return
  errorMsg.value = ''
  successMsg.value = ''
  const email = route.query.email as string
  if (!email) {
    errorMsg.value = 'Email hilang — daftar ulang dari /register.'
    return
  }
  loading.value = true
  try {
    const sb = supabaseBrowser()
    const { error } = await sb.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : '/'
      }
    })
    if (error) {
      errorMsg.value = error.message
      return
    }
    successMsg.value = 'Link baru terkirim — cek inbox.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 pb-10 min-h-screen" style="background:#F5F5F4;font-family:'Plus Jakarta Sans',system-ui,sans-serif">
    <!-- 1. Banner hitam — 1:1 register (strip ember + radius 12 + angka lime-muda) -->
    <div class="p-2 text-white mt-4" style="background:#0C0A09;border-left:4px solid #EA580C;border-radius:12px;font-size:10px;font-weight:800">
      HAMPIR SELESAI
      <div style="color:#D9F99D;font-size:17px;font-weight:800;margin:2px 0">1 klik lagi</div>
      verifikasi email biar quota 2 • 5 aktif 🎟️
    </div>

    <!-- 2. Kartu instruksi putih -->
    <div class="bg-white rounded-3xl mt-3 p-5 shadow-sm text-center">
      <div class="text-3xl">📩</div>
      <h1 class="text-lg font-extrabold text-black mt-2">Cek email kamu</h1>
      <p class="text-sm font-bold text-black mt-1 break-all">{{ displayEmail }}</p>
      <p class="text-xs text-gray-500 mt-2 leading-relaxed">
        Link verifikasi udah dikirim. Klik link di inbox → otomatis masuk HOME.
        Cek juga folder spam/promosi kalau belum masuk.
      </p>
      <p v-if="successMsg" class="text-center text-xs font-bold text-green-700 mt-2">{{ successMsg }}</p>
      <p v-if="errorMsg" class="text-center text-xs font-bold text-red-600 mt-2">{{ errorMsg }}</p>
      <button type="button" :disabled="loading" class="w-full rounded-full py-3.5 px-4 text-white text-sm font-extrabold mt-3 disabled:opacity-60 flex items-center justify-center gap-2" style="background:#0C0A09" @click="handleResend">
        <svg v-if="loading" class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="#fff" stroke-opacity=".25" stroke-width="4" /><path d="M22 12a10 10 0 0 0-10-10" stroke="#fff" stroke-width="4" stroke-linecap="round" /></svg>
        {{ loading ? 'Mengirim…' : 'Kirim ulang' }}
      </button>
      <NuxtLink to="/login" class="inline-block text-xs font-bold text-gray-500 mt-3 underline">
        Salah email? Balik ke login
      </NuxtLink>
    </div>
  </div>
</template>
