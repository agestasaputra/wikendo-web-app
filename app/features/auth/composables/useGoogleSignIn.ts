/**
 * features/auth/composables/useGoogleSignIn.ts — 1-click Google login/register (single door, Supabase OAuth).
 *
 * WHAT: googleLoading + signInWithGoogle() → error message | null. signInWithOAuth is THE SAME for login & register
 *   (Supabase auto create-vs-login by email); redirect respects ?redirect= (the quiz context is not lost).
 * WHY: identical handler in LoginPage + RegisterPage → 1 composable.
 * EXAMPLE: const { googleLoading, signInWithGoogle } = useGoogleSignIn(redirect)
 */
import { ref, type Ref } from "vue";
import { useSupabaseBrowser } from "~/common/composables/useSupabaseBrowser";
import { buildOriginUrl } from "../utils/redirect";

export interface GoogleSignIn {
  googleLoading: Ref<boolean>;
  signInWithGoogle: () => Promise<string | null>;
}

export function useGoogleSignIn(redirect: string): GoogleSignIn {
  const googleLoading = ref(false);

  async function signInWithGoogle(): Promise<string | null> {
    googleLoading.value = true;
    try {
      const { error } = await useSupabaseBrowser().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: buildOriginUrl(redirect) },
      });
      return error ? error.message : null;
    } finally {
      googleLoading.value = false;
    }
  }

  return { googleLoading, signInWithGoogle };
}
