import { describe, it, expect, vi } from "vitest";
import { useSentinelObserver } from "~/common/composables/useSentinelObserver";

describe("useSentinelObserver (unit)", () => {
  it("returns a ref", () => {
    const mockCallback = vi.fn();
    const mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };
    (
      global as unknown as { IntersectionObserver: unknown }
    ).IntersectionObserver = vi.fn(() => mockObserver);
    const sentinel = useSentinelObserver(mockCallback);
    expect(sentinel).toBeDefined();
    expect(typeof sentinel.value).toBe("object");
  });
});
