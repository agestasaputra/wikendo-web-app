/**
 * server/utils/db.ts — Supabase connection (ADMIN, server-only).
 *
 * WHAT: Singleton Supabase client using the SERVICE ROLE key (bypasses RLS).
 * WHY singleton: 1 client reused, saves DB connections.
 * RULE: this file is ONLY imported from server/. DON'T import it from browser code
 * (service key = secret; guarded by ESLint no-restricted-imports, see eslint.config.mjs).
 * EXAMPLE: const db = supabaseAdmin(); const { data } = await db.from('malls').select('*')
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!admin) {
    const config = useRuntimeConfig();
    admin = createClient(config.public.supabaseUrl, config.supabaseServiceKey);
  }
  return admin;
}
