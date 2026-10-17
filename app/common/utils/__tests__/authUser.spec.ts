import { describe, it, expect } from "vitest";
import { buildDisplayName, getInitial } from "../authUser";

describe("buildDisplayName (Addendum 22: full_name > name > prefix email)", () => {
  it("full_name → capitalized first name", () => {
    expect(
      buildDisplayName({
        email: "x@y.com",
        user_metadata: { full_name: "budi santoso" },
      }),
    ).toBe("Budi");
  });

  it("name used if full_name is empty", () => {
    expect(buildDisplayName({ user_metadata: { name: "budi santoso" } })).toBe(
      "Budi",
    );
  });

  it("fallback to email prefix (budi@example.com → Budi)", () => {
    expect(buildDisplayName({ email: "budi@example.com" })).toBe("Budi");
  });

  it('no email & metadata → "Teman"', () => {
    expect(buildDisplayName({})).toBe("Teman");
  });
});

describe("getInitial", () => {
  it('name → email → "?" (uppercase)', () => {
    expect(getInitial("budi", "x@y.com")).toBe("B");
    expect(getInitial("", "x@y.com")).toBe("X");
    expect(getInitial("", "")).toBe("?");
  });
});
