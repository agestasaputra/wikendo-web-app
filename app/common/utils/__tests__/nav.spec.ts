import { describe, it, expect } from "vitest";
import { isNavActive } from "../nav";

describe("isNavActive (active BottomNav tab)", () => {
  it('Home only active at exactly "/"', () => {
    expect(isNavActive("/", "/")).toBe(true);
    expect(isNavActive("/", "/mall")).toBe(false);
  });

  it("other tabs active on their own path + child route", () => {
    expect(isNavActive("/mall", "/mall")).toBe(true);
    expect(isNavActive("/mall", "/mall/grand-indonesia")).toBe(true);
  });

  it("similar prefix but not a child → not active", () => {
    expect(isNavActive("/mall", "/mallx")).toBe(false);
    expect(isNavActive("/history", "/account")).toBe(false);
  });
});
