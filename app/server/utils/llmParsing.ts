/**
 * server/utils/llmParsing.ts — Logic murni LLM (pilih provider, bersihkan JSON, validasi hasil, fallback).
 *
 * APA: buildCfChatUrl, pickLLMProvider, cleanJSON, parseRankResults, parseTempatResults, buildRankFallback.
 *   PURE (tanpa $fetch/runtimeConfig) supaya unit-testable.
 * KENAPA: (1) prod Vercel tak bisa ke localhost:20128 → CF Workers AI direct kalau env CF ada, hermes lokal untuk dev.
 *   (2) LLM sesekali balas JSON ngaco/nama halu → validasi + throw picu retry/fallback (anti-500).
 * Contoh: pickLLMProvider({ cfAccountId: "", cfToken: "", hermesUrl }) → { kind: "hermes", ... }.
 */
import type { RankResult, TempatRecommendation } from "../../common/types/api";

export interface LLMProvider {
  kind: "cf" | "hermes";
  url: string;
  model: string;
}

const CF_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const HERMES_DEFAULT_URL = "http://127.0.0.1:20128";

/** Account ID → URL chat completions CF (OpenAI-compatible). */
export function buildCfChatUrl(accountId: string): string {
  const id = (accountId || "").trim();
  return `https://api.cloudflare.com/client/v4/accounts/${id}/ai/v1/chat/completions`;
}

/** Pilih provider: CF kalau accountId+token lengkap, hermes fallback (dev lokal). */
export function pickLLMProvider(input: {
  cfAccountId: string;
  cfToken: string;
  hermesUrl: string;
}): LLMProvider {
  const acc = (input.cfAccountId || "").trim();
  const tok = (input.cfToken || "").trim();
  if (acc && tok) {
    return { kind: "cf", url: buildCfChatUrl(acc), model: CF_MODEL };
  }
  const base = (input.hermesUrl || HERMES_DEFAULT_URL).replace(/\/$/, "");
  return {
    kind: "hermes",
    url: base + "/v1/chat/completions",
    model: "hermes-combo",
  };
}

/** Potong teks setelah penutup JSON pertama (LLM kadang nambah "semoga membantu ya!"). */
function trimAfterJson(s: string): string {
  const closer = s.startsWith("{") ? "}" : s.startsWith("[") ? "]" : "";
  if (!closer) return s;
  const last = s.lastIndexOf(closer);
  return last > 0 ? s.slice(0, last + 1).trim() : s;
}

/** Strip markdown fence + teks prefix/suffix dari output LLM → JSON murni (anti-500 JSON.parse). */
export function cleanJSON(raw: string): string {
  let s = (raw || "").trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) s = fence[1].trim();
  const start = s.search(/[{[]/);
  if (start > 0) s = s.slice(start).trim();
  return trimAfterJson(s.trim());
}

interface RawRank {
  name?: unknown;
  reason?: unknown;
}

/** Validasi ranking LLM → RankResult[5]. Throw kalau key salah / nama halu / JSON rusak (picu retry/fallback). */
export function parseRankResults(
  raw: string,
  candidates: string[],
): RankResult[] {
  const obj = JSON.parse(cleanJSON(raw)) as { ranking?: unknown };
  if (!obj || !Array.isArray(obj.ranking))
    throw new Error("RANK_SHAPE_INVALID");
  const set = new Set(candidates);
  const out = (obj.ranking as RawRank[]).map((r) => ({
    name: String(r?.name || ""),
    reason: String(r?.reason || ""),
  }));
  if (!out.length) throw new Error("RANK_EMPTY");
  for (const r of out) {
    if (!r.name || !set.has(r.name))
      throw new Error("RANK_NAME_HALU:" + r.name);
    if (!r.reason) throw new Error("RANK_REASON_EMPTY");
  }
  return out.slice(0, 5);
}

/** Validasi rekomendasi tempat LLM → TempatRecommendation[5]. Throw kalau shape salah. */
export function parseTempatResults(raw: string): TempatRecommendation[] {
  const obj = JSON.parse(cleanJSON(raw)) as { recommendations?: unknown };
  if (!obj || !Array.isArray(obj.recommendations)) {
    throw new Error("TEMPAT_SHAPE_INVALID");
  }
  const out = obj.recommendations as Array<Record<string, unknown>>;
  if (!out.length) throw new Error("TEMPAT_EMPTY");
  for (const r of out) {
    if (typeof r?.name !== "string" || !r.name) {
      throw new Error("TEMPAT_NAME_INVALID");
    }
  }
  return (out as unknown as TempatRecommendation[]).slice(0, 5);
}

/** Fallback deterministik nol-LLM: 5 kandidat pertama + reason generik (jaminan anti-500). */
export function buildRankFallback(
  candidates: Array<{ name: string }>,
  context: string,
): RankResult[] {
  return candidates.slice(0, 5).map((c) => ({
    name: c.name,
    reason: `${c.name} cocok untuk ${context} — kandidat teratas yang buka dan sesuai filter.`,
  }));
}
