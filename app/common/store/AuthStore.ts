/**
 * common/store/AuthStore.ts — Auth session single source of truth (Pinia, replaces the useAuth composable).
 *
 * WHAT: isLoggedIn/email/displayName/initial + init() (getSession + onAuthStateChange) + signOut().
 * WHY store: used by TopNav + Home + Akun → shared state across features (hub-chat: common/store).
 *   init() is idempotent — previously every useAuth() caller attached a new listener.
 * EXAMPLE: const auth = useAuthStore(); auth.init(); auth.isLoggedIn
 */
import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useSupabaseBrowser } from "../composables/useSupabaseBrowser";
import { buildDisplayName, getInitial, type AuthUser } from "../utils/authUser";
import { useClaimAnonHistory } from "../composables/useClaimAnonHistory";

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
      // offline / SSR without session → stay anonymous, don't crash
    }
  }

  // Load session + listen to auth changes (once). getSession + onAuthStateChange are required.
  function init(): void {
    if (listening || typeof window === "undefined") return;
    listening = true;
    void refresh();
    try {
      useSupabaseBrowser().auth.onAuthStateChange((_event, session) => {
        applyUser(session?.user ?? null);
        if (session?.user && typeof $fetch !== "undefined")
          void useClaimAnonHistory()().catch(() => {});
      });
    } catch {
      // ignore — anonymous still works
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
