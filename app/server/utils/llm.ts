/**
 * server/utils/llm.ts — Client LLM (server-only, Opsi 2 CF direct + hermes fallback).
 *
 * APA: callLLM() = POST generik ke /v1/chat/completions; generateTempat() & rankTenants()
 * = wrapper prompt spesifik per mode.
 * KENAPA hemat: kandidat selalu difilter di Supabase DULU (gratis, max 30 rows) → LLM
 * cuma ranking + 1 kalimat reason. LLM tidak pernah list dari nol.
 * Prompt system memaksa LLM balas JSON VALID saja (tanpa disclaimer) supaya JSON.parse langsung.
 * Timeout 15 detik, max_tokens 2000. Pemilihan provider + validasi: server/utils/llmParsing.ts.
 */
import type {
  LLMChatResponse,
  QuizMakanInput,
  QuizTempatInput,
  RankResult,
  TempatRecommendation,
  TenantRow,
} from "../../common/types/api";
import { coerceBool } from "../../utils/boolean";
import {
  buildRankFallback,
  parseRankResults,
  parseTempatResults,
  pickLLMProvider,
} from "./llmParsing";

const TEMPAT_SYSTEM = `Kamu asisten rekomendasi weekend Jabodetabek. Balas HANYA JSON valid: {"recommendations":[{"name":"...","category":"...","reason":"... (1 kalimat)","estimated_cost":"Rp ...","location_area":"...","best_time":"...","confidence":"high"}]}. Tepat 5 item, realistis, tanpa disclaimer.`;

const MAKAN_SYSTEM = `Kamu asisten ranking tenant mall. Input: daftar kandidat tenant (JSON) + preferensi user. Balas HANYA JSON valid: {"ranking":[{"name":"... (HARUS sama persis dari kandidat)","reason":"... (1 kalimat kenapa cocok)"}]}. Tepat 5 item, urut paling cocok dulu, tanpa disclaimer.`;

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

/** Panggil LLM + parse; gagal → coba 1x lagi (LLM non-deterministik). */
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

export async function generateTempat(
  input: QuizTempatInput,
): Promise<TempatRecommendation[]> {
  const user = `Mood:${input.mood} Teman:${input.companion} Budget:${input.budget} Area:${input.location} Waktu:${input.time || "fleksibel"}`;
  return callWithRetry(TEMPAT_SYSTEM, user, parseTempatResults);
}

export async function rankTenants(
  input: QuizMakanInput,
  candidates: TenantRow[],
): Promise<RankResult[]> {
  const halal = coerceBool(input.halal_only);
  const kids = coerceBool(input.kids_friendly);
  const names = candidates.map((c) => c.name);
  const ctx = `${input.budget_tier} di ${input.mall_slug}`;
  const user = `Preferensi: mall=${input.mall_slug} misi=${input.mission} budget=${input.budget_tier} rombongan=${input.companion} halal_only=${halal} kids=${kids}\nKandidat:\n${JSON.stringify(candidates.slice(0, 30))}`;
  // Retry 1x lalu fallback deterministik (jaminan: makan TIDAK PERNAH 500 lagi).
  try {
    return await callWithRetry(MAKAN_SYSTEM, user, (raw) =>
      parseRankResults(raw, names),
    );
  } catch {
    return buildRankFallback(candidates, ctx);
  }
}
