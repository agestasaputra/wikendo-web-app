import { describe, it, expect } from "vitest";
import {
  filterValue,
  parseFilterValue,
  readFilter,
  readFilters,
  countFilters,
  withoutFilter,
} from "../filterValue";

describe("filterValue — namespaced tokens", () => {
  it("filterValue builds group:value", () => {
    expect(filterValue("budget", "mid")).toBe("budget:mid");
  });

  it("parseFilterValue splits on first colon", () => {
    expect(parseFilterValue("mission:long_hangout")).toEqual({
      group: "mission",
      value: "long_hangout",
    });
    expect(parseFilterValue("no-colon")).toEqual({
      group: "",
      value: "no-colon",
    });
  });

  it("readFilter returns first value of a group", () => {
    expect(readFilter(["budget:mid", "pref:halal"], "budget")).toBe("mid");
    expect(readFilter(["budget:mid"], "city")).toBeUndefined();
  });

  it("readFilters returns all values of a group", () => {
    expect(
      readFilters(["mission:a", "mission:b", "budget:mid"], "mission"),
    ).toEqual(["a", "b"]);
  });

  it("countFilters counts tokens", () => {
    expect(countFilters(["a:b", "c:d"])).toBe(2);
    expect(countFilters([])).toBe(0);
  });

  it("withoutFilter drops a single token", () => {
    expect(
      withoutFilter(["budget:mid", "pref:halal"], "budget", "mid"),
    ).toEqual(["pref:halal"]);
  });
});
