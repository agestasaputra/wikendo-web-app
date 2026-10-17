/**
 * common/types/api.ts — API data CONTRACT (client + server).
 *
 * WHAT: body/response shape of POST /api/place|food/recommend, table rows, LLM response.
 * WHY in common/: used by pages (client) AND server/api — single source of truth.
 * RULES: change/add a field? Edit this file FIRST, then the feature/server that uses it.
 * EXAMPLE: const body: QuizFoodInput = { mall_slug: "grand-indonesia", ... }
 */

/** Body POST /api/place/recommend (from place quiz via query string). */
export interface QuizPlaceInput {
  mood: string;
  companion: string;
  budget: string;
  location: string;
  time?: string;
}

/** Body POST /api/food/recommend (from food quiz via query string). */
export interface QuizFoodInput {
  mall_slug: string;
  mission: string;
  budget_tier: string;
  companion: string;
  halal_only?: boolean | string;
  kids_friendly?: boolean | string;
}

/** 1 place result card (output of generatePlace/LLM). */
export interface PlaceRecommendation {
  name: string;
  category: string;
  reason: string;
  estimated_cost: string;
  location_area: string;
  best_time: string;
  confidence: string;
}

/** 1 food result card (tenant DB + LLM reason + maps_url). */
export interface TenantRecommendation {
  name: string;
  category: string;
  floor: string;
  halal: boolean | null;
  budget_tier: string;
  price_min: number | null; // IDR rupiah
  price_max: number | null; // IDR rupiah
  kids_friendly: boolean | null;
  hype_tiktok: boolean | null;
  reason: string;
  maps_url: string;
  data_source?: string;
  needs_survey?: boolean;
}

/** 1 raw row of the Supabase `tenants` table. */
export interface TenantRow {
  name: string;
  category: string;
  floor: string;
  halal: boolean | null;
  budget_tier: string;
  price_min: number | null; // IDR rupiah
  price_max: number | null; // IDR rupiah
  kids_friendly: boolean | null;
  hype_tiktok: boolean | null;
  mission?: string[];
  mall_id?: string;
  is_open?: boolean;
  data_source?: string;
  verified_at?: string | null;
  needs_survey?: boolean;
}

/** Output of rankTenants(): name (MUST match the candidate exactly) + reason. */
export interface RankResult {
  name: string;
  reason: string;
}

/** Raw shape of the LLM response (choices[0].message.content). */
export interface LLMChatResponse {
  choices: { message: { content: string } }[];
}
