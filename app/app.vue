<!-- app.vue — Layout GLOBAL kombo 5+10+15 + E1 BottomNav (Addendum 09 v1.3 + 24 E1 APPROVED).
APA: AppHeader sticky + <NuxtPage/> + footer id tentang + BottomNav 5-tab fixed dalam max-w-md thumb-zone, pb-24 anti-ketutup.
KENAPA 1 layout dipakai semua halaman → konsisten + hemat. Isi header/nav ada di common/components (layout tetap tipis).
Contoh: footer id tentang → Akun/Tentang anchor #tentang scroll; pb-24 cegah konten ketutup nav fixed. -->
<script setup lang="ts">
import AppHeader from "~/common/components/AppHeader.vue";
import BottomNav from "~/common/components/BottomNav.vue";
import { useAuthStore } from "~/common/store/AuthStore";

// Load session Supabase + dengar perubahan auth (client only, idempotent).
const auth = useAuthStore();
onMounted(() => auth.init());
</script>

<template>
  <div
    class="min-h-screen bg-base text-ink pb-24"
    style="
      font-family:
        Plus Jakarta Sans,
        system-ui,
        sans-serif;
    "
  >
    <AppHeader />
    <NuxtPage />
    <footer id="tentang" class="text-center text-xs text-gray-400 py-8">
      Wikendo MVP • $0/month • Nuxt 4 + Supabase + Hermes-combo —
      <a href="#tentang" class="underline">Tentang</a>
    </footer>
    <BottomNav />
  </div>
</template>
