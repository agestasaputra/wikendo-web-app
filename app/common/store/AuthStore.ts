/**
 * common/store/AuthStore.ts — Session auth sumber kebenaran (Pinia, ganti composable useAuth).
 *
 * APA: isLoggedIn/email/displayName/initial + init() (getSession + onAuthStateChange) + signOut().
 * KENAPA store: dipakai AppHeader + Home + Akun → state bersama lintas feature (hub-chat: common/store).
 *   init() idempotent — dulu tiap pemanggil useAuth() pasang listener baru.
 * Contoh: const auth = useAuthStore(); auth.init(); auth.isLoggedIn
 */
import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useSupabaseBrowser } from "../composables/useSupabaseBrowser";
import { buildDisplayName, getInitial, type AuthUser } from "../utils/authUser";

export const useAuthStore = defineStore("authStore", () => {
  const isLoggedIn = ref(false);
  const email = ref("");
  const displayName = ref("");
  const initial = computed(() => getInitial(displayName.value, email.value));
  let listening = false;

  function applyUser(user: AuthUser | null): void {
    isLoggedIn.value = user !== null;
    email.value = user?.email ?? "";
    displayName.value = user ? buildDisplayName(user) : "";
  }

  async function refresh(): Promise<void> {
    try {
      const { data } = await useSupabaseBrowser().auth.getSession();
      applyUser(data.session?.user ?? null);
    } catch {
      // offline / SSR tanpa session → tetap anon, jangan crash
    }
  }

  // Load session + dengar perubahan auth (sekali). getSession + onAuthStateChange wajib ada.
  function init(): void {
    if (listening || typeof window === "undefined") return;
    listening = true;
    void refresh();
    try {
      useSupabaseBrowser().auth.onAuthStateChange((_event, session) => {
        applyUser(session?.user ?? null);
      });
    } catch {
      // abaikan — anon tetap jalan
    }
  }

  async function signOut(): Promise<void> {
    try {
      await useSupabaseBrowser().auth.signOut();
    } finally {
      applyUser(null);
    }
  }

  return { isLoggedIn, email, displayName, initial, init, refresh, signOut };
});
