import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAuthStore } from "../AuthStore";

/**
 * AuthStore.spec.ts — Auth session source of truth (Addendum 22 AS6 wallet-card).
 * Supabase is mocked at the useSupabaseBrowser composable level (not real HTTP).
 * Pinned: getSession + onAuthStateChange are wired ONCE (idempotent init), signOut always resets state.
 */
const { getSession, onAuthStateChange, signOut } = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("../../composables/useSupabaseBrowser", () => ({
  useSupabaseBrowser: () => ({
    auth: { getSession, onAuthStateChange, signOut },
  }),
}));

const budi = {
  email: "budi@example.com",
  user_metadata: { full_name: "budi santoso" },
};

describe("AuthStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getSession.mockReset().mockResolvedValue({ data: { session: null } });
    onAuthStateChange.mockReset();
    signOut.mockReset().mockResolvedValue({});
  });

  it('initial: anonymous (isLoggedIn false, no name, initial "?")', () => {
    const auth = useAuthStore();
    expect(auth.isLoggedIn).toBe(false);
    expect(auth.displayName).toBe("");
    expect(auth.initial).toBe("?");
  });

  it("refresh: session present → logged in + capitalized first name + initial", async () => {
    getSession.mockResolvedValue({ data: { session: { user: budi } } });
    const auth = useAuthStore();
    await auth.refresh();
    expect(auth.isLoggedIn).toBe(true);
    expect(auth.email).toBe("budi@example.com");
    expect(auth.displayName).toBe("Budi");
    expect(auth.initial).toBe("B");
  });

  it("refresh: getSession throws (offline) → stays anonymous, no crash", async () => {
    getSession.mockRejectedValue(new Error("offline"));
    const auth = useAuthStore();
    await expect(auth.refresh()).resolves.toBeUndefined();
    expect(auth.isLoggedIn).toBe(false);
  });

  it("init: wires the listener ONCE even when called repeatedly", () => {
    const auth = useAuthStore();
    auth.init();
    auth.init();
    expect(onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it("onAuthStateChange listener updates state (login then logout from another tab)", () => {
    const auth = useAuthStore();
    auth.init();
    const handler = onAuthStateChange.mock.calls[0]?.[0] as (
      e: string,
      s: { user: typeof budi } | null,
    ) => void;
    handler("SIGNED_IN", { user: budi });
    expect(auth.isLoggedIn).toBe(true);
    handler("SIGNED_OUT", null);
    expect(auth.isLoggedIn).toBe(false);
    expect(auth.email).toBe("");
  });

  it("signOut: calls Supabase + resets state, even if Supabase errors", async () => {
    getSession.mockResolvedValue({ data: { session: { user: budi } } });
    const auth = useAuthStore();
    await auth.refresh();
    signOut.mockRejectedValue(new Error("network"));
    await expect(auth.signOut()).rejects.toThrow("network");
    expect(auth.isLoggedIn).toBe(false);
    expect(auth.displayName).toBe("");
  });
});
