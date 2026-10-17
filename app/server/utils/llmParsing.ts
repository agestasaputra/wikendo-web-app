/**
 * server/utils/llmParsing.ts — Pure LLM logic (pick provider, clean JSON, validate result, fallback).
 *
 * WHAT: buildCfChatUrl, pickLLMProvider, cleanJSON, parseRankResults, parsePlaceResults, buildRankFallback.
 *   PURE (no $fetch/runtimeConfig) so it is unit-testable.
 * WHY: (1) prod Vercel can't reach localhost:20128 → CF Workers AI direct if the CF env exists, local hermes for dev.
 *   (2) LLM occasionally replies with broken JSON / hallucinated names → validation + throw triggers retry/fallback (anti-500).
 * EXAMPLE: pickLLMProvider({ cfAccountId: "", cfToken: "", hermesUrl }) → { kind: "hermes", ... }.
 */
import type { RankResult, PlaceRecommendation } from "../../common/types/api";

export interface LLMProvider {
  kind: "cf" | "hermes";
  url: string;
  model: string;
}

const CF_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const HERMES_DEFAULT_URL = "http://127.0.0.1:20128";

/** Account ID → CF chat completions URL (OpenAI-compatible). */
export function buildCfChatUrl(accountId: string): string {
  const id = (accountId || "").trim();
  return `https://api.cloudflare.com/client/v4/accounts/${id}/ai/v1/chat/completions`;
}

/** Pick provider: CF if accountId+token complete, hermes fallback (local dev). */
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

/** Trim text after the first JSON closer (LLM sometimes adds "semoga membantu ya!"). */
function trimAfterJson(s: string): string {
  const closer = s.startsWith("{") ? "}" : s.startsWith("[") ? "]" : "";
  if (!closer) return s;
  const last = s.lastIndexOf(closer);
  return last > 0 ? s.slice(0, last + 1).trim() : s;
}

/** Strip markdown fence + prefix/suffix text from the LLM output → pure JSON (anti-500 JSON.parse). */
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

/** Validate LLM ranking → RankResult[5]. Throw if a key is wrong / hallucinated name / broken JSON (triggers retry/fallback). */
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

/** Validate LLM place recommendation → PlaceRecommendation[5]. Throw if the shape is wrong. */
export function parsePlaceResults(raw: string): PlaceRecommendation[] {
  const obj = JSON.parse(cleanJSON(raw)) as { recommendations?: unknown };
  if (!obj || !Array.isArray(obj.recommendations)) {
    throw new Error("PLACE_SHAPE_INVALID");
  }
  const out = obj.recommendations as Array<Record<string, unknown>>;
  if (!out.length) throw new Error("PLACE_EMPTY");
  for (const r of out) {
    if (typeof r?.name !== "string" || !r.name) {
      throw new Error("PLACE_NAME_INVALID");
    }
  }
  return (out as unknown as PlaceRecommendation[]).slice(0, 5);
}

/** Zero-LLM deterministic fallback: first 5 candidates + generic reason (anti-500 guarantee). */
export function buildRankFallback(
  candidates: Array<{ name: string }>,
  context: string,
): RankResult[] {
  return candidates.slice(0, 5).map((c) => ({
    name: c.name,
    reason: `${c.name} cocok untuk ${context} — kandidat teratas yang buka dan sesuai filter.`,
  }));
}
