/**
 * server/utils/__tests__/llmParsing.spec.ts — LLM routing test (CF direct vs hermes) + anti-500 result validation.
 * Prod Vercel can't reach localhost:20128 → CF Workers AI; local dev uses hermes-combo.
 */
import { describe, it, expect } from "vitest";
import {
  buildCfChatUrl,
  buildRankFallback,
  cleanJSON,
  parseRankResults,
  parsePlaceResults,
  pickLLMProvider,
} from "../llmParsing";

describe("buildCfChatUrl (endpoint OpenAI-compatible CF)", () => {
  it("builds URL .../ai/v1/chat/completions from accountId", () => {
    expect(buildCfChatUrl("abc123def456")).toBe(
      "https://api.cloudflare.com/client/v4/accounts/abc123def456/ai/v1/chat/completions",
    );
  });

  it("trims accountId whitespace", () => {
    expect(buildCfChatUrl("  abc123  ")).toBe(
      "https://api.cloudflare.com/client/v4/accounts/abc123/ai/v1/chat/completions",
    );
  });
});

describe("pickLLMProvider (dev/prod split)", () => {
  it("CF if accountId + token present → kind cf + model llama-3.1-8b-instruct-fast", () => {
    const p = pickLLMProvider({
      cfAccountId: "acc123",
      cfToken: "tok456",
      hermesUrl: "http://127.0.0.1:20128",
    });
    expect(p.kind).toBe("cf");
    expect(p.url).toBe(
      "https://api.cloudflare.com/client/v4/accounts/acc123/ai/v1/chat/completions",
    );
    expect(p.model).toBe("@cf/meta/llama-3.1-8b-instruct-fast");
  });

  it("hermes fallback if CF empty (local dev)", () => {
    const p = pickLLMProvider({
      cfAccountId: "",
      cfToken: "",
      hermesUrl: "http://127.0.0.1:20128",
    });
    expect(p.kind).toBe("hermes");
    expect(p.url).toBe("http://127.0.0.1:20128/v1/chat/completions");
    expect(p.model).toBe("hermes-combo");
  });

  it("hermes fallback if only one CF value present (safe, anti half-configured)", () => {
    const p = pickLLMProvider({
      cfAccountId: "acc123",
      cfToken: "",
      hermesUrl: "http://127.0.0.1:20128",
    });
    expect(p.kind).toBe("hermes");
  });
});

describe("cleanJSON (strip markdown fence LLM)", () => {
  it("strips ```json fence + prefix text", () => {
    const raw = 'Baik! ```json\n{"recommendations":[]}\n```';
    expect(cleanJSON(raw)).toBe('{"recommendations":[]}');
  });

  it("plain JSON stays intact", () => {
    expect(cleanJSON('{"a":1}')).toBe('{"a":1}');
  });

  it("strips trailing text after JSON (cause of flaky 500)", () => {
    expect(cleanJSON('{"ranking":[]} semoga membantu ya!')).toBe(
      '{"ranking":[]}',
    );
  });
});

describe("parseRankResults (anti-500 LLM ranking validation)", () => {
  const cands = [
    "HokBen",
    "Marugame Udon",
    "Bakmi GM",
    "Dapur Solo",
    "Solaria",
    "J.CO",
  ];
  it("valid JSON with names matching candidates → 5 pass", () => {
    const raw = JSON.stringify({
      ranking: cands
        .slice(0, 5)
        .map((n) => ({ name: n, reason: n + " cocok" })),
    });
    const out = parseRankResults(raw, cands);
    expect(out.length).toBe(5);
    expect(out[0]?.name).toBe("HokBen");
  });

  it("wrong key (recommendations instead of ranking) → throws (triggers retry/fallback)", () => {
    const raw = JSON.stringify({
      recommendations: [{ name: "HokBen", reason: "x" }],
    });
    expect(() => parseRankResults(raw, cands)).toThrow();
  });

  it("hallucinated name outside candidates → throws", () => {
    const raw = JSON.stringify({
      ranking: [{ name: "Sushi Hantu", reason: "x" }],
    });
    expect(() => parseRankResults(raw, cands)).toThrow();
  });

  it("broken/truncated JSON → throws", () => {
    expect(() => parseRankResults('{"ranking":[', cands)).toThrow();
  });
});

describe("parsePlaceResults (anti-500 place validation)", () => {
  it("valid JSON with 5 places → passes", () => {
    const recs = Array.from({ length: 5 }, (_, i) => ({
      name: "T" + i,
      category: "c",
      reason: "r",
      estimated_cost: "Rp 0",
      location_area: "Jaksel",
      best_time: "pagi",
      confidence: "high",
    }));
    const raw = JSON.stringify({ recommendations: recs });
    expect(parsePlaceResults(raw).length).toBe(5);
  });

  it("wrong shape → throws", () => {
    expect(() => parsePlaceResults('{"ranking":[]}')).toThrow();
    expect(() => parsePlaceResults("bukan json")).toThrow();
  });
});

describe("buildRankFallback (deterministic, zero LLM, anti-500)", () => {
  it("takes the first 5 candidates + generic reason", () => {
    const cands = [
      { name: "HokBen" },
      { name: "Marugame Udon" },
      { name: "Bakmi GM" },
      { name: "Dapur Solo" },
      { name: "Solaria" },
      { name: "J.CO" },
    ];
    const out = buildRankFallback(cands as never[], "hemat di Central Park");
    expect(out.length).toBe(5);
    expect(out[0]?.name).toBe("HokBen");
    expect(out[0]?.reason.length).toBeGreaterThan(5);
  });
});
