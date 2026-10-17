import { describe, it, expect } from "vitest";
import { buildOriginUrl, getRedirectQuery } from "../redirect";

describe("getRedirectQuery (?redirect= → safe path)", () => {
  it('valid string used, otherwise "/"', () => {
    expect(getRedirectQuery("/quiz")).toBe("/quiz");
    expect(getRedirectQuery(undefined)).toBe("/");
    expect(getRedirectQuery("")).toBe("/");
    expect(getRedirectQuery(["/a", "/b"])).toBe("/");
  });
});

describe("buildOriginUrl (browser origin + path)", () => {
  it("in happy-dom (window present) → origin + path", () => {
    expect(buildOriginUrl("/quiz")).toBe(`${window.location.origin}/quiz`);
  });
});
