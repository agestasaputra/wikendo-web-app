/**
 * features/mall/@types/mall.ts — UI CONTRACT for the mall directory (S2b infinity + S2c tenant card).
 *
 * WHAT: MallItem (list row), TenantItem (tenant card from API), TenantCardMeta (thumb emoji + color),
 *   TenantView (ready-to-render value per card), DirectoryFilters (3 server-side filter chips).
 * Used by: utils/* + MallListPage + MallDetailPage + components/*.
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
  floor?: string;
  price_min?: number | null;
  price_max?: number | null;
  mission?: string[];
  halal?: boolean | null;
  hype_tiktok?: boolean | null;
  needs_survey?: boolean;
  promo?: string;
  budget_tier?: string;
  emoji?: string;
}

/** S2c tenant card thumb: emoji per category + square avatar color. */
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
