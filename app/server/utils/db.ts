/**
 * server/utils/db.ts — Koneksi Supabase (ADMIN, server-only).
 *
 * APA: Singleton client Supabase pakai SERVICE ROLE key (bypass RLS).
 * KENAPA singleton: 1 client dipakai ulang, hemat koneksi DB.
 * ATURAN: file ini HANYA di-import dari server/. JANGAN import dari kode browser
 * (service key = rahasia; dijaga ESLint no-restricted-imports, lihat eslint.config.mjs).
 * Contoh: const db = supabaseAdmin(); const { data } = await db.from('malls').select('*')
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
