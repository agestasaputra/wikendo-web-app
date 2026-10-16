/**
 * common/types/database.ts — Baris tabel Supabase yang dibaca server (typed query).
 *
 * APA: interface minimal untuk `.single<T>()` / `.maybeSingle<T>()` / `.returns<T>()`.
 * KENAPA: client Supabase tanpa generic Database → hasil query `never` (type-check gagal).
 * Kolom lengkap: ../../docs/04-Database-Schema.md. Hanya kolom yang dipakai kode.
 * Contoh: db.from("vouchers").select("*").eq("code", c).maybeSingle<VoucherRow>()
 */
export interface MallRow {
  id: string;
  slug: string;
  name: string;
  city?: string;
  area?: string;
  is_active?: boolean;
}

export interface VoucherRow {
  id: string;
  code: string;
  tenant_id: string;
  promo_text: string;
  discount_percent: number;
  promo_active?: boolean | null;
  valid_from: string;
  valid_until: string;
}
