<!-- app.vue — GLOBAL layout combining 5+10+15 + E1 BottomNav (Addendum 09 v1.3 + 24 E1 APPROVED).
WHAT: AppHeader sticky + <NuxtPage/> (stretched vertically down to the top of BottomNav) + BottomNav 5-tab sticky bottom-0 inside a max-w-md thumb-zone (no bottom padding hack).
WHY: 1 layout used by every page → consistent + saves work. Header/nav contents live in common/components (layout stays thin).
  Page canvas background is OWNED BY THIS LAYOUT via PAGE_BG: features only fill content, so every route
  (home, history, account, mall, legal, quiz, result) shares one colour and cannot drift apart again.
EXAMPLE: short page (History) → main grows to the top of BottomNav; long page → nav stays stuck at the viewport bottom. -->
<script setup lang="ts">
import AppHeader from "~/common/components/AppHeader.vue";
import BottomNav from "~/common/components/BottomNav.vue";
import { PAGE_BG } from "~/common/constants/theme";
import { useAuthStore } from "~/common/store/AuthStore";

// Load Supabase session + listen for auth changes (client only, idempotent).
const auth = useAuthStore();
onMounted(() => auth.init());

// Tinted page background so the max-w-md app column reads as a separate surface on wide screens (also covers overscroll).
useHead({ bodyAttrs: { class: "bg-stone-200" } });
</script>

<template>
  <div
    class="max-w-md mx-auto min-h-dvh flex flex-col text-ink shadow-[0_0_32px_rgba(0,0,0,0.14)]"
    :style="{
      background: PAGE_BG,
      fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
    }"
  >
    <AppHeader class="w-full" />
    <!-- Page root grows to the top of BottomNav; w-full because the pages' mx-auto would otherwise shrink them in a flex column. -->
    <main class="flex-1 flex flex-col [&>*]:flex-1 [&>*]:w-full">
      <NuxtPage />
    </main>
    <!-- Public footer (Addendum 25): product copy + Privacy/Terms links, #tentang anchor for the Account page shortcut. No dev jargon. -->
    <footer
      id="tentang"
      class="text-center text-xs text-gray-400 py-6 flex flex-col gap-1"
    >
      <p>Wikendo — biar weekend nggak bingung lagi.</p>
      <p>
        © 2026 Wikendo ·
        <NuxtLink to="/privacy" class="underline">Privacy</NuxtLink> ·
        <NuxtLink to="/terms" class="underline">Terms</NuxtLink>
      </p>
    </footer>
    <BottomNav />
  </div>
</template>
