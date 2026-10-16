import { describe, it, expect } from "vitest";
import { getErrorMessage, getErrorStatus } from "../error";

describe("getErrorMessage (unknown → pesan aman untuk UI)", () => {
  it("ambil data.message dulu (bentuk error $fetch/createError)", () => {
    expect(
      getErrorMessage(
        { data: { message: "LOGIN_REQUIRED" }, message: "x" },
        "fb",
      ),
    ).toBe("LOGIN_REQUIRED");
  });

  it("fallback ke message (Error biasa)", () => {
    expect(getErrorMessage(new Error("boom"), "fb")).toBe("boom");
  });

  it("fallback ke string default kalau tidak ada pesan / null / bukan object", () => {
    expect(getErrorMessage({}, "fb")).toBe("fb");
    expect(getErrorMessage(null, "fb")).toBe("fb");
    expect(getErrorMessage("oops", "fb")).toBe("fb");
  });
});

describe("getErrorStatus (unknown → HTTP status | undefined)", () => {
  it("baca statusCode", () => {
    expect(getErrorStatus({ statusCode: 403 })).toBe(403);
  });

  it("undefined kalau tidak ada / bukan angka", () => {
    expect(getErrorStatus({})).toBeUndefined();
    expect(getErrorStatus(null)).toBeUndefined();
    expect(getErrorStatus({ statusCode: "403" })).toBeUndefined();
  });
});
