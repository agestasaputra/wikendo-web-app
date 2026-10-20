/**
 * resultFlow.spec.ts — RED test (TDD) for the stored-result contract end to end.
 *
 * WHAT locks 4 things:
 *   1. GET /api/result/[id] exists, rejects a non-UUID, and reads the stored deck with
 *      ZERO quota + ZERO LLM call (that is the whole point: a view is not a generation).
 *   2. Both POST recommend endpoints return the inserted `generations.id`.
 *   3. Both result pages: `?id=` → GET, fresh POST → router.replace(?id=).
 *   4. /history cards link to buildResultUrl(kind, id) — a past result reopens for free.
 * WHY: refresh/back/share used to re-POST the quiz answers (quota burned, login wall, and the
 *   recipient got a different LLM result). History cards were not clickable at all.
 * EXAMPLE: /result-place?id=0f8fad5b-… → GET /api/result/0f8fad5b-… → deck, quota untouched.
 */
import { describe, it, expect } from "vitest";
import { readSource, sourceExists } from "~/test/utils";

const ENDPOINT = sourceExists("server/api/result/[id].get.ts")
  ? readSource("server/api/result/[id].get.ts")
  : "";
const PLACE_POST = readSource("server/api/place/recommend.post.ts");
const FOOD_POST = readSource("server/api/food/recommend.post.ts");
const PLACE_PAGE = readSource("features/place/PlaceResultPage.vue");
const FOOD_PAGE = readSource("features/food/FoodResultPage.vue");
const HISTORY = readSource("features/history/HistoryPage.vue");
const ROW = readSource("common/utils/historyRow.ts");

describe("GET /api/result/[id] — reading a stored result is free", () => {
  it("the route exists", () => {
    expect(sourceExists("server/api/result/[id].get.ts")).toBe(true);
  });

  it("validates the id before touching the DB (no injection, no junk query)", () => {
    expect(ENDPOINT).toContain("isResultId");
    expect(ENDPOINT).toMatch(/statusCode:\s*400/);
  });

  it("reads `generations` by id and returns the deck", () => {
    expect(ENDPOINT).toContain("generations");
    expect(ENDPOINT).toMatch(/\.eq\(\s*["']id["']/);
    expect(ENDPOINT).toContain("recommendations");
  });

  it("NEVER calls the LLM and NEVER consumes quota (view ≠ generation)", () => {
    expect(ENDPOINT).not.toMatch(/utils\/llm/);
    expect(ENDPOINT).not.toContain("check_and_increment_quota");
    expect(ENDPOINT).not.toContain("getAnonUsage");
    expect(ENDPOINT).not.toContain("recordAnonGeneration");
  });

  it("missing row → 404 with a human message", () => {
    expect(ENDPOINT).toMatch(/statusCode:\s*404/);
    expect(ENDPOINT).toMatch(/data:\s*\{\s*message:/);
  });

  it("does not leak the quiz answers (only mall_slug for the food label)", () => {
    expect(ENDPOINT).not.toMatch(/quiz_input:\s*\{?\s*\.\.\./);
    expect(ENDPOINT).toContain("mall_slug");
  });
});

describe("POST recommend returns the stored id", () => {
  it("place inserts and reads the id back", () => {
    expect(PLACE_POST).toMatch(
      /\.insert\([\s\S]{0,400}?\.select\(\s*["']id["']\s*\)/,
    );
    expect(PLACE_POST).toMatch(/id:\s*(row|saved|inserted)/);
  });

  it("food inserts and reads the id back", () => {
    expect(FOOD_POST).toMatch(
      /\.insert\([\s\S]{0,400}?\.select\(\s*["']id["']\s*\)/,
    );
    expect(FOOD_POST).toMatch(/id:\s*(row|saved|inserted)/);
  });
});

describe("result pages — id mode is a GET, fresh mode replaces the URL", () => {
  it("place page parses ?id and fetches /api/result", () => {
    expect(PLACE_PAGE).toContain("parseResultId");
    expect(PLACE_PAGE).toContain("/api/result/");
    expect(PLACE_PAGE).toContain("buildResultUrl");
    expect(PLACE_PAGE).toContain("router.replace");
  });

  it("food page parses ?id and fetches /api/result", () => {
    expect(FOOD_PAGE).toContain("parseResultId");
    expect(FOOD_PAGE).toContain("/api/result/");
    expect(FOOD_PAGE).toContain("buildResultUrl");
    expect(FOOD_PAGE).toContain("router.replace");
  });

  it("a stored result does NOT re-push history (already in the list)", () => {
    expect(PLACE_PAGE).toMatch(/if\s*\(\s*!?\s*generatedId/);
    expect(FOOD_PAGE).toMatch(/if\s*\(\s*!?\s*generatedId/);
  });

  it("share sends the CANONICAL stored URL, also when re-sharing a link you just opened", () => {
    // Both pages must fall back to the id from the URL: a recipient who re-shares keeps the
    // same stored deck instead of handing out an answer URL that regenerates (and burns quota).
    for (const page of [PLACE_PAGE, FOOD_PAGE]) {
      expect(page).toMatch(/generatedId\.value\s*\|\|\s*storedId/);
      expect(page).toMatch(/navigator\.share/);
    }
    // Food used to render "Share ke temen" as dead <u> text — it must be a real control.
    expect(FOOD_PAGE).toMatch(/@click="share\(\)"/);
  });
});

describe("history cards — clickable, opening the stored result", () => {
  it("the card links with buildResultUrl(kind, id)", () => {
    expect(HISTORY).toContain("buildResultUrl");
    expect(HISTORY).toContain("NuxtLink");
  });

  it("the row mapper carries the id from generations.id", () => {
    expect(ROW).toMatch(/id\?:\s*string\s*\|\s*null/);
    expect(ROW).toContain("isResultId");
  });
});
