import { describe, it, expect } from "vitest";
import { buildOriginUrl, getRedirectQuery } from "../redirect";

describe("getRedirectQuery (?redirect= → safe path)", () => {
  it('valid string used, otherwise "/"', () => {
    expect(getRedirectQuery("/place")).toBe("/place");
    expect(getRedirectQuery(undefined)).toBe("/");
    expect(getRedirectQuery("")).toBe("/");
    expect(getRedirectQuery(["/a", "/b"])).toBe("/");
  });
});

describe("buildOriginUrl (browser origin + path)", () => {
  it("in happy-dom (window present) → origin + path", () => {
    expect(buildOriginUrl("/place")).toBe(`${window.location.origin}/place`);
  });
});
