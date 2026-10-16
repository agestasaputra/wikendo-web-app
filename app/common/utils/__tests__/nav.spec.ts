import { describe, it, expect } from "vitest";
import { isNavActive } from "../nav";

describe("isNavActive (tab BottomNav aktif)", () => {
  it('Home hanya aktif di "/" persis', () => {
    expect(isNavActive("/", "/")).toBe(true);
    expect(isNavActive("/", "/mall")).toBe(false);
  });

  it("tab lain aktif di path sendiri + child route", () => {
    expect(isNavActive("/mall", "/mall")).toBe(true);
    expect(isNavActive("/mall", "/mall/grand-indonesia")).toBe(true);
  });

  it("prefix mirip tapi bukan child → tidak aktif", () => {
    expect(isNavActive("/mall", "/mallx")).toBe(false);
    expect(isNavActive("/riwayat", "/account")).toBe(false);
  });
});
