/**
 * common/composables/useSupabaseBrowser.ts — Client Supabase BROWSER (anon key, aman ke browser).
 *
 * APA: singleton createClient pakai runtimeConfig.public (supabaseUrl + supabaseAnonKey).
 * KENAPA: auth dari browser (signIn, OAuth, reset password). BEDA dgn server/utils/db.ts
 *   (service key, server-only — dilarang diimport dari kode browser, lihat eslint.config.mjs).
 * Contoh: const sb = useSupabaseBrowser(); await sb.auth.signInWithPassword({ email, password })
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
