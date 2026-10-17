import { describe, it, expect } from "vitest";
import {
  getPasswordStrength,
  getStrengthColor,
  getStrengthLabel,
} from "../passwordStrength";

describe("getPasswordStrength (0-5)", () => {
  it("short → low, empty → 0", () => {
    expect(getPasswordStrength("")).toBe(0);
    expect(getPasswordStrength("abcd")).toBe(1);
  });

  it("length 8 + mixed case + digit & symbol → 5 (clamped)", () => {
    expect(getPasswordStrength("Abcdef1!")).toBe(5);
  });
});

describe("getStrengthLabel + getStrengthColor (red → green scale)", () => {
  it("label: Lemah / Sedang / Kuat / Sangat kuat", () => {
    expect(getStrengthLabel(1)).toBe("Lemah");
    expect(getStrengthLabel(2)).toBe("Sedang");
    expect(getStrengthLabel(3)).toBe("Kuat");
    expect(getStrengthLabel(4)).toBe("Kuat");
    expect(getStrengthLabel(5)).toBe("Sangat kuat");
  });

  it("colors: red → ember → yellow → green", () => {
    expect(getStrengthColor(0)).toBe("#DC2626");
    expect(getStrengthColor(2)).toBe("#EA580C");
    expect(getStrengthColor(3)).toBe("#CA8A04");
    expect(getStrengthColor(5)).toBe("#16A34A");
  });
});
