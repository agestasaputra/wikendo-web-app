<!-- app.vue — GLOBAL layout combining 5+10+15 + E1 BottomNav (Addendum 09 v1.3 + 24 E1 APPROVED).
WHAT: AppHeader sticky + <NuxtPage/> + footer id tentang + BottomNav 5-tab fixed inside a max-w-md thumb-zone, pb-24 anti-covered.
WHY: 1 layout used by every page → consistent + saves work. Header/nav contents live in common/components (layout stays thin).
EXAMPLE: footer id tentang → Akun/Tentang anchor #tentang scroll; pb-24 prevents content being covered by the fixed nav. -->
<script setup lang="ts">
import AppHeader from "~/common/components/AppHeader.vue";
import BottomNav from "~/common/components/BottomNav.vue";
import { useAuthStore } from "~/common/store/AuthStore";

// Load Supabase session + listen for auth changes (client only, idempotent).
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
