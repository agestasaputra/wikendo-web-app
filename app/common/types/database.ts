/**
 * common/types/database.ts — Supabase table rows read by the server (typed query).
 *
 * WHAT: minimal interface for `.single<T>()` / `.maybeSingle<T>()` / `.returns<T>()`.
 * WHY: Supabase client without the generic Database → query result is `never` (type-check fails).
 * Full columns: ../../docs/04-Database-Schema.md. Only columns used by the code.
 * EXAMPLE: db.from("vouchers").select("*").eq("code", c).maybeSingle<VoucherRow>()
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
