import { describe, it, expect } from "vitest";
import { buildOriginUrl, getRedirectQuery } from "../redirect";

describe("getRedirectQuery (?redirect= → path aman)", () => {
  it('string valid dipakai, selain itu "/"', () => {
    expect(getRedirectQuery("/quiz")).toBe("/quiz");
    expect(getRedirectQuery(undefined)).toBe("/");
    expect(getRedirectQuery("")).toBe("/");
    expect(getRedirectQuery(["/a", "/b"])).toBe("/");
  });
});

describe("buildOriginUrl (origin browser + path)", () => {
  it("di happy-dom (ada window) → origin + path", () => {
    expect(buildOriginUrl("/quiz")).toBe(`${window.location.origin}/quiz`);
  });
});
