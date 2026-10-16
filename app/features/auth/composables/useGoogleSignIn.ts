/**
 * features/auth/composables/useGoogleSignIn.ts — Login/daftar Google 1-klik (satu pintu, Supabase OAuth).
 *
 * APA: googleLoading + signInWithGoogle() → pesan error | null. signInWithOAuth SAMA untuk login & register
 *   (Supabase auto create-vs-login by email); redirect hormati ?redirect= (konteks quiz tidak hilang).
 * KENAPA: handler identik di LoginPage + RegisterPage → 1 composable.
 * Contoh: const { googleLoading, signInWithGoogle } = useGoogleSignIn(redirect)
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
