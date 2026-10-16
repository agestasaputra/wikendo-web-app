/**
 * common/types/api.ts — KONTRAK data API (client + server).
 *
 * APA: bentuk body/response POST /api/tempat|makan/recommend, baris tabel, respons LLM.
 * KENAPA di common/: dipakai pages (client) DAN server/api — 1 sumber kebenaran.
 * ATURAN: ubah/tambah field? Edit file ini DULU, baru feature/server yang pakai.
 * Contoh: const body: QuizMakanInput = { mall_slug: "grand-indonesia", ... }
 */

/** Body POST /api/tempat/recommend (dari quiz tempat via query string). */
export interface QuizTempatInput {
  mood: string;
  companion: string;
  budget: string;
  location: string;
  time?: string;
}

/** Body POST /api/makan/recommend (dari quiz makan via query string). */
export interface QuizMakanInput {
  mall_slug: string;
  mission: string;
  budget_tier: string;
  companion: string;
  halal_only?: boolean | string;
  kids_friendly?: boolean | string;
}

/** 1 kartu hasil tempat (output generateTempat/LLM). */
export interface TempatRecommendation {
  name: string;
  category: string;
  reason: string;
  estimated_cost: string;
  location_area: string;
  best_time: string;
  confidence: string;
}

/** 1 kartu hasil makan (tenant DB + reason LLM + maps_url). */
export interface TenantRecommendation {
  name: string;
  category: string;
  lantai: string;
  halal: boolean | null;
  budget_tier: string;
  price_range: string;
  kids_friendly: boolean | null;
  hype_tiktok: boolean | null;
  reason: string;
  maps_url: string;
  data_source?: string;
  needs_survey?: boolean;
}

/** 1 baris mentah tabel `tenants` Supabase. */
export interface TenantRow {
  name: string;
  category: string;
  lantai: string;
  halal: boolean | null;
  budget_tier: string;
  price_range: string;
  kids_friendly: boolean | null;
  hype_tiktok: boolean | null;
  mission?: string[];
  mall_id?: string;
  is_open?: boolean;
  data_source?: string;
  verified_at?: string | null;
  needs_survey?: boolean;
}

/** Output rankTenants(): nama (HARUS persis dari kandidat) + reason. */
export interface RankResult {
  name: string;
  reason: string;
}

/** Bentuk mentah response LLM (choices[0].message.content). */
export interface LLMChatResponse {
  choices: { message: { content: string } }[];
}
