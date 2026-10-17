/**
 * server/utils/llm.ts — LLM client (server-only, Option 2 CF direct + hermes fallback).
 *
 * WHAT: callLLM() = generic POST to /v1/chat/completions; generatePlace() & rankTenants()
 * = per-mode prompt wrappers.
 * WHY cheap: candidates are always filtered in Supabase FIRST (free, max 30 rows) → LLM
 * only ranks + writes 1 reason sentence. LLM never lists from scratch.
 * The system prompt forces the LLM to reply with VALID JSON only (no disclaimer) so JSON.parse works directly.
 * Timeout 15 seconds, max_tokens 2000. Provider selection + validation: server/utils/llmParsing.ts.
 */
import type {
  LLMChatResponse,
  QuizFoodInput,
  QuizPlaceInput,
  RankResult,
  PlaceRecommendation,
  TenantRow,
} from "../../common/types/api";
import { coerceBool } from "../../utils/boolean";
import {
  buildRankFallback,
  parseRankResults,
  parsePlaceResults,
  pickLLMProvider,
} from "./llmParsing";

const PLACE_SYSTEM = `Kamu asisten rekomendasi weekend Jabodetabek. Balas HANYA JSON valid: {"recommendations":[{"name":"...","category":"...","reason":"... (1 kalimat)","estimated_cost":"Rp ...","location_area":"...","best_time":"...","confidence":"high"}]}. Tepat 5 item, realistis, tanpa disclaimer.`;

const FOOD_SYSTEM = `Kamu asisten ranking tenant mall. Input: daftar kandidat tenant (JSON) + preferensi user. Balas HANYA JSON valid: {"ranking":[{"name":"... (HARUS sama persis dari kandidat)","reason":"... (1 kalimat kenapa cocok)"}]}. Tepat 5 item, urut paling cocok dulu, tanpa disclaimer.`;

export async function callLLM(system: string, user: string): Promise<string> {
  const config = useRuntimeConfig();
  const provider = pickLLMProvider({
    cfAccountId: config.cfAccountId || "",
    cfToken: config.cfApiToken || "",
    hermesUrl: config.hermesApiUrl || "http://127.0.0.1:20128",
  });
  const apiKey =
    provider.kind === "cf" ? config.cfApiToken : config.hermesApiKey;
  const res = await $fetch<LLMChatResponse>(provider.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: {
      model: provider.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    },
    timeout: 15000,
  });
  const content = res.choices[0]?.message.content;
  if (!content) throw new Error("LLM_EMPTY_RESPONSE");
  return content;
}

/** Call LLM + parse; on failure → try 1 more time (LLM is non-deterministic). */
async function callWithRetry<T>(
  system: string,
  user: string,
  parse: (raw: string) => T,
): Promise<T> {
  try {
    return parse(await callLLM(system, user));
  } catch {
    return parse(await callLLM(system, user));
  }
}

export async function generatePlace(
  input: QuizPlaceInput,
): Promise<PlaceRecommendation[]> {
  const user = `Mood:${input.mood} Teman:${input.companion} Budget:${input.budget} Area:${input.location} Waktu:${input.time || "flexible"}`;
  return callWithRetry(PLACE_SYSTEM, user, parsePlaceResults);
}

export async function rankTenants(
  input: QuizFoodInput,
  candidates: TenantRow[],
): Promise<RankResult[]> {
  const halal = coerceBool(input.halal_only);
  const kids = coerceBool(input.kids_friendly);
  const names = candidates.map((c) => c.name);
  const ctx = `${input.budget_tier} di ${input.mall_slug}`;
  const user = `Preferensi: mall=${input.mall_slug} misi=${input.mission} budget=${input.budget_tier} rombongan=${input.companion} halal_only=${halal} kids=${kids}\nKandidat:\n${JSON.stringify(candidates.slice(0, 30))}`;
  // Retry once then deterministic fallback (guarantee: food NEVER returns 500 again).
  try {
    return await callWithRetry(FOOD_SYSTEM, user, (raw) =>
      parseRankResults(raw, names),
    );
  } catch {
    return buildRankFallback(candidates, ctx);
  }
}
