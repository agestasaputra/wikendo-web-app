import { describe, it, expect } from "vitest";
import { buildDisplayName, getInitial } from "../authUser";

describe("buildDisplayName (Addendum 22: full_name > name > prefix email)", () => {
  it("full_name → nama depan kapital", () => {
    expect(
      buildDisplayName({
        email: "x@y.com",
        user_metadata: { full_name: "siska dewi" },
      }),
    ).toBe("Siska");
  });

  it("name dipakai kalau full_name kosong", () => {
    expect(buildDisplayName({ user_metadata: { name: "budi santoso" } })).toBe(
      "Budi",
    );
  });

  it("fallback prefix email (siskadptr@gmail.com → Siskadptr)", () => {
    expect(buildDisplayName({ email: "siskadptr@gmail.com" })).toBe(
      "Siskadptr",
    );
  });

  it('tanpa email & metadata → "Teman"', () => {
    expect(buildDisplayName({})).toBe("Teman");
  });
});

describe("getInitial", () => {
  it('nama → email → "?" (uppercase)', () => {
    expect(getInitial("siska", "x@y.com")).toBe("S");
    expect(getInitial("", "x@y.com")).toBe("X");
    expect(getInitial("", "")).toBe("?");
  });
});
