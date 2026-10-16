/**
 * features/mall/@types/mall.ts — KONTRAK UI direktori mall (S2b infinity + S2c kartu tenant).
 *
 * APA: MallItem (baris list), TenantItem (kartu tenant dari API), TenantCardMeta (thumb emoji + warna),
 *   TenantView (nilai siap-render per kartu), DirectoryFilters (3 chip filter server-side).
 * Dipakai: utils/* + MallListPage + MallDetailPage + components/*.
 */
export interface MallItem {
  slug: string;
  name: string;
  city?: string;
  area?: string;
  total_tenant?: number;
}

export interface TenantItem {
  name: string;
  cat?: string;
  category?: string;
  lantai?: string;
  price?: string;
  price_range?: string;
  mission?: string[];
  halal?: boolean | null;
  hype_tiktok?: boolean | null;
  needs_survey?: boolean;
  promo?: string;
  budget_tier?: string;
  emoji?: string;
}

/** Thumb kartu tenant S2c: emoji per kategori + warna avatar kotak. */
export interface TenantCardMeta {
  emoji: string;
  bg: string;
}

export interface TenantView extends TenantCardMeta {
  floor: string;
  promo: string | null;
  rate: string;
  halal: string;
}

export interface DirectoryFilters {
  halal: boolean;
  budget: boolean;
  mission: boolean;
}
