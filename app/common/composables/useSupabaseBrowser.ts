/**
 * common/composables/useSupabaseBrowser.ts — BROWSER Supabase client (anon key, safe for the browser).
 *
 * WHAT: singleton createClient using runtimeConfig.public (supabaseUrl + supabaseAnonKey).
 * WHY: auth from the browser (signIn, OAuth, reset password). DIFFERENT from server/utils/db.ts
 *   (service key, server-only — importing it from browser code is forbidden, see eslint.config.mjs).
 * EXAMPLE: const sb = useSupabaseBrowser(); await sb.auth.signInWithPassword({ email, password })
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browser: SupabaseClient | null = null;

export function useSupabaseBrowser(): SupabaseClient {
  if (!browser) {
    const config = useRuntimeConfig();
    browser = createClient(
      config.public.supabaseUrl as string,
      config.public.supabaseAnonKey as string,
    );
  }
  return browser;
}
