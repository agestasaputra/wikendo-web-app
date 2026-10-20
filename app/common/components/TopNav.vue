<!-- common/components/TopNav.vue → GLOBAL sticky 2-state header, AS6 wallet-card (Addendum 22 APPROVED).
WHAT: left = Wikendo logo on "/", circular back button on every other route; CENTRE = the page title (hidden on Home) so the user
  always knows which page they are on; right = anonymous Login/Register instead, logged in = avatar initial + Bell + dropdown
  (email, Riwayat, Wishlist Segera, Keluar).
WHY: this block previously lived in app.vue; split out so the layout stays thin + the header is testable. State from AuthStore (Pinia).
  The title comes from the pure pageTitle(path) map — ONE owner, so a new route cannot ship a blank or a differently-worded header.
EXAMPLE: mounted once in app.vue above <NuxtPage />. -->
<script setup lang="ts">
import { storeToRefs } from "pinia";
import AppSpinner from "~/common/components/AppSpinner.vue";
import { useAuthStore } from "~/common/store/AuthStore";
import { isHomePath } from "~/common/utils/nav";
import { pageTitle } from "~/common/utils/pageTitle";

const auth = useAuthStore();
const { isLoggedIn, email } = storeToRefs(auth);
const router = useRouter();
const route = useRoute();
const isHome = computed(() => isHomePath(route.path));
// Centre label = current page; null on Home (the logo is the identity there, a label would be noise).
const title = computed(() => pageTitle(route.path));
const showMenu = ref(false);
const loggingOut = ref(false);

// Back = previous page; on a direct visit (no in-app history) fall back to Home so the button is never a dead end.
function goBack(): void {
  if (window.history.state?.back) router.back();
  else router.push("/");
}

// Real logout: Supabase signOut → close menu → back to / as anonymous. Anti double-click guard + "Keluar" spinner.
async function handleLogout(): Promise<void> {
  if (loggingOut.value) return;
  loggingOut.value = true;
  try {
    await auth.signOut();
    showMenu.value = false;
    router.push("/");
  } finally {
    loggingOut.value = false;
  }
}
</script>

<template>
  <header class="bg-white sticky top-0 z-40 shadow-sm">
    <!-- 3-slot grid: two equal 2rem rails (back button | bell) + a flexible middle → the title sits dead centre
         at every width, and a long mall name truncates instead of pushing the rails out of the bar. -->
    <div
      class="container mx-auto px-4 py-3 grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-2 max-w-md"
    >
      <NuxtLink
        v-if="isHome"
        to="/"
        class="col-start-1 flex items-center justify-self-start"
        aria-label="Wikendo — beranda"
      >
        <img
          src="/brand-icon-day.png"
          alt="Wikendo"
          width="32"
          height="32"
          class="rounded-lg"
        />
      </NuxtLink>
      <button
        v-else
        type="button"
        aria-label="Kembali"
        class="col-start-1 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center justify-self-start"
        @click="goBack"
      >
        <svg
          viewBox="0 0 24 24"
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <!-- Page title: a <p> (not <h1>) so it never competes with the page's own <h1> for SEO/outline. -->
      <p
        v-if="title"
        class="col-start-2 text-sm font-extrabold text-ink text-center truncate max-w-[220px]"
      >
        {{ title }}
      </p>
      <div class="col-start-3 justify-self-end flex gap-2 items-center">
        <div v-if="isLoggedIn" class="flex gap-2 items-center">
          <button
            type="button"
            aria-label="Notifikasi"
            class="text-lg leading-none"
          >
            🔔
          </button>
        </div>
      </div>
      <!-- AS6 wallet-card mini dropdown: grey email + Riwayat + Wishlist (Segera) + red Keluar. -->
      <div
        v-if="isLoggedIn && showMenu"
        class="absolute right-4 top-full mt-1 w-56 rounded-xl bg-white shadow-lg border border-stone-200 py-2 z-50"
      >
        <p class="px-4 py-1.5 text-[11px] font-bold text-gray-500 truncate">
          {{ email }}
        </p>
        <div class="h-px bg-stone-100 mx-4" />
        <button
          type="button"
          class="w-full text-left px-4 py-2 text-xs font-extrabold hover:bg-stone-50"
          @click="showMenu = false"
        >
          Riwayat
        </button>
        <span
          class="w-full flex justify-between items-center px-4 py-2 text-xs font-extrabold text-gray-400"
        >
          Wishlist <small class="font-bold">Segera</small>
        </span>
        <div class="h-px bg-stone-100 mx-4" />
        <button
          type="button"
          :disabled="loggingOut"
          class="w-full text-left px-4 py-2 text-xs font-extrabold text-red-600 hover:bg-red-50 disabled:opacity-60 inline-flex items-center gap-2"
          @click="handleLogout"
        >
          <AppSpinner v-if="loggingOut" color="#DC2626" size="w-3.5 h-3.5" />
          {{ loggingOut ? "Keluar…" : "Keluar" }}
        </button>
      </div>
    </div>
  </header>
</template>
