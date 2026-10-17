import { describe, it, expect } from "vitest";
import { getErrorMessage, getErrorStatus } from "../error";

describe("getErrorMessage (unknown → safe message for the UI)", () => {
  it("reads data.message first ($fetch/createError error shape)", () => {
    expect(
      getErrorMessage(
        { data: { message: "LOGIN_REQUIRED" }, message: "x" },
        "fb",
      ),
    ).toBe("LOGIN_REQUIRED");
  });

  it("fallback to message (plain Error)", () => {
    expect(getErrorMessage(new Error("boom"), "fb")).toBe("boom");
  });

  it("fallback to the default string when there is no message / null / not an object", () => {
    expect(getErrorMessage({}, "fb")).toBe("fb");
    expect(getErrorMessage(null, "fb")).toBe("fb");
    expect(getErrorMessage("oops", "fb")).toBe("fb");
  });
});

describe("getErrorStatus (unknown → HTTP status | undefined)", () => {
  it("reads statusCode", () => {
    expect(getErrorStatus({ statusCode: 403 })).toBe(403);
  });

  it("undefined when absent / not a number", () => {
    expect(getErrorStatus({})).toBeUndefined();
    expect(getErrorStatus(null)).toBeUndefined();
    expect(getErrorStatus({ statusCode: "403" })).toBeUndefined();
  });
});
