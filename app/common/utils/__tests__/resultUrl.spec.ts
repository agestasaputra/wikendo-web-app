/**
 * resultUrl.spec.ts — RED test (TDD) for the addressable-result contract.
 *
 * WHAT: a stored result is addressed by the `generations.id` UUID, never by the quiz answers.
 * WHY: answers in the query string grow with every new question, burn quota on refresh, and
 *   leak personal answers into the address bar / share preview / browser history.
 * EXAMPLE: buildResultUrl("place", "9b2f...") → "/result-place?id=9b2f..."
 */
import { describe, it, expect } from "vitest";
import {
  buildResultUrl,
  isResultId,
  parseResultId,
  RESULT_PATHS,
} from "../resultUrl";

const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";

describe("isResultId — only a real UUID is an address", () => {
  it("accepts a lowercase and an uppercase UUID", () => {
    expect(isResultId(ID)).toBe(true);
    expect(isResultId(ID.toUpperCase())).toBe(true);
  });

  it("rejects answers, empty strings, numbers and SQL-ish payloads", () => {
    expect(isResultId("mood=santai")).toBe(false);
    expect(isResultId("")).toBe(false);
    expect(isResultId(undefined)).toBe(false);
    expect(isResultId(42)).toBe(false);
    expect(isResultId("' OR 1=1 --")).toBe(false);
  });
});

describe("buildResultUrl — 1 short URL per result", () => {
  it("place → /result-place?id=<uuid>", () => {
    expect(buildResultUrl("place", ID)).toBe(`/result-place?id=${ID}`);
  });

  it("food → /result-food?id=<uuid>", () => {
    expect(buildResultUrl("food", ID)).toBe(`/result-food?id=${ID}`);
  });

  it("carries NO quiz answer (mood/budget/companion never reach the URL)", () => {
    const url = buildResultUrl("place", ID);
    for (const answer of ["mood", "companion", "budget", "location", "time"]) {
      expect(url).not.toContain(answer);
    }
    expect(url).toHaveLength(`/result-place?id=${ID}`.length);
  });

  it("path table stays the single source of truth", () => {
    expect(RESULT_PATHS.place).toBe("/result-place");
    expect(RESULT_PATHS.food).toBe("/result-food");
  });
});

describe("parseResultId — read the id off a route query", () => {
  it("returns the id when valid", () => {
    expect(parseResultId({ id: ID })).toBe(ID);
  });

  it("returns '' for a legacy answer-only query (backward compatible)", () => {
    expect(parseResultId({ mood: "santai", companion: "pasangan" })).toBe("");
    expect(parseResultId({ id: "not-a-uuid" })).toBe("");
    expect(parseResultId(undefined)).toBe("");
    expect(parseResultId({ id: [ID] })).toBe("");
  });
});
