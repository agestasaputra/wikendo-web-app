/**
 * server/utils/__tests__/llmParsing.spec.ts — Test routing LLM (CF direct vs hermes) + validasi hasil anti-500.
 * Prod Vercel tak bisa ke localhost:20128 → CF Workers AI; dev lokal hermes-combo.
 */
import { describe, it, expect } from "vitest";
import {
  buildCfChatUrl,
  buildRankFallback,
  cleanJSON,
  parseRankResults,
  parseTempatResults,
  pickLLMProvider,
} from "../llmParsing";

describe("buildCfChatUrl (endpoint OpenAI-compatible CF)", () => {
  it("bikin URL .../ai/v1/chat/completions dari accountId", () => {
    expect(buildCfChatUrl("abc123def456")).toBe(
      "https://api.cloudflare.com/client/v4/accounts/abc123def456/ai/v1/chat/completions",
    );
  });

  it("trim spasi accountId", () => {
    expect(buildCfChatUrl("  abc123  ")).toBe(
      "https://api.cloudflare.com/client/v4/accounts/abc123/ai/v1/chat/completions",
    );
  });
});

describe("pickLLMProvider (dev/prod split)", () => {
  it("CF kalau accountId + token ada → kind cf + model llama-3.1-8b-instruct-fast", () => {
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

  it("hermes fallback kalau CF kosong (dev lokal)", () => {
    const p = pickLLMProvider({
      cfAccountId: "",
      cfToken: "",
      hermesUrl: "http://127.0.0.1:20128",
    });
    expect(p.kind).toBe("hermes");
    expect(p.url).toBe("http://127.0.0.1:20128/v1/chat/completions");
    expect(p.model).toBe("hermes-combo");
  });

  it("hermes fallback kalau cuma salah satu CF ada (aman, anti setengah config)", () => {
    const p = pickLLMProvider({
      cfAccountId: "acc123",
      cfToken: "",
      hermesUrl: "http://127.0.0.1:20128",
    });
    expect(p.kind).toBe("hermes");
  });
});

describe("cleanJSON (strip markdown fence LLM)", () => {
  it("buang ```json fence + teks prefix", () => {
    const raw = 'Baik! ```json\n{"recommendations":[]}\n```';
    expect(cleanJSON(raw)).toBe('{"recommendations":[]}');
  });

  it("JSON polos tetap utuh", () => {
    expect(cleanJSON('{"a":1}')).toBe('{"a":1}');
  });

  it("buang teks trailing setelah JSON (penyebab 500 flaky)", () => {
    expect(cleanJSON('{"ranking":[]} semoga membantu ya!')).toBe(
      '{"ranking":[]}',
    );
  });
});

describe("parseRankResults (validasi ranking LLM anti-500)", () => {
  const cands = [
    "HokBen",
    "Marugame Udon",
    "Bakmi GM",
    "Dapur Solo",
    "Solaria",
    "J.CO",
  ];
  it("JSON valid dengan nama pas kandidat → lolos 5", () => {
    const raw = JSON.stringify({
      ranking: cands
        .slice(0, 5)
        .map((n) => ({ name: n, reason: n + " cocok" })),
    });
    const out = parseRankResults(raw, cands);
    expect(out.length).toBe(5);
    expect(out[0]?.name).toBe("HokBen");
  });

  it("key salah (recommendations bukan ranking) → throw (picu retry/fallback)", () => {
    const raw = JSON.stringify({
      recommendations: [{ name: "HokBen", reason: "x" }],
    });
    expect(() => parseRankResults(raw, cands)).toThrow();
  });

  it("nama halu di luar kandidat → throw", () => {
    const raw = JSON.stringify({
      ranking: [{ name: "Sushi Hantu", reason: "x" }],
    });
    expect(() => parseRankResults(raw, cands)).toThrow();
  });

  it("JSON rusak/truncated → throw", () => {
    expect(() => parseRankResults('{"ranking":[', cands)).toThrow();
  });
});

describe("parseTempatResults (validasi tempat anti-500)", () => {
  it("JSON valid 5 tempat → lolos", () => {
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
    expect(parseTempatResults(raw).length).toBe(5);
  });

  it("shape salah → throw", () => {
    expect(() => parseTempatResults('{"ranking":[]}')).toThrow();
    expect(() => parseTempatResults("bukan json")).toThrow();
  });
});

describe("buildRankFallback (deterministik, nol LLM, anti-500)", () => {
  it("ambil 5 pertama kandidat + reason generik", () => {
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
