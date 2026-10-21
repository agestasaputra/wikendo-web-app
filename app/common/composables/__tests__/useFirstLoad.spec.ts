import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * useFirstLoad.spec.ts — the first-paint gate contract.
 * WHY: pages that read local data (History localStorage, Account Pinia) have no `pending`,
 *   so they used to paint the empty state for one frame before the real content landed.
 */
const COMP = readSource("common/composables/useFirstLoad.ts");

describe("useFirstLoad — skeleton first, content second", () => {
  it("starts true and clears only after the page task settles", () => {
    expect(COMP).toContain("export function useFirstLoad");
    expect(COMP).toContain("const booting = ref(!seen.value)");
    expect(COMP).toContain("await task?.()");
    expect(COMP).toContain("booting.value = false");
  });

  it("remembers the visit per page key so a second visit is instant", () => {
    expect(COMP).toContain("first-load:");
    expect(COMP).toContain("if (seen.value)");
  });

  it("keeps the skeleton on screen for a minimum time (no one-frame flash)", () => {
    expect(COMP).toContain("DEFAULT_MIN_MS");
    expect(COMP).toMatch(/minMs/);
  });

  it("never leaves the page stuck when the task throws", () => {
    expect(COMP).toMatch(/try\s*\{[\s\S]{0,200}finally/);
  });
});
