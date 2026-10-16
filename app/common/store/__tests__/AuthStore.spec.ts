import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAuthStore } from "../AuthStore";

/**
 * AuthStore.spec.ts — Session auth sumber kebenaran (Addendum 22 AS6 wallet-card).
 * Supabase di-mock di level composable useSupabaseBrowser (bukan HTTP sungguhan).
 * Dikunci: getSession + onAuthStateChange dipasang SEKALI (init idempotent), signOut selalu mereset state.
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

const siska = {
  email: "siskadptr@gmail.com",
  user_metadata: { full_name: "siska dewi" },
};

describe("AuthStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getSession.mockReset().mockResolvedValue({ data: { session: null } });
    onAuthStateChange.mockReset();
    signOut.mockReset().mockResolvedValue({});
  });

  it('awal: anon (isLoggedIn false, tanpa nama, inisial "?")', () => {
    const auth = useAuthStore();
    expect(auth.isLoggedIn).toBe(false);
    expect(auth.displayName).toBe("");
    expect(auth.initial).toBe("?");
  });

  it("refresh: session ada → login + nama depan kapital + inisial", async () => {
    getSession.mockResolvedValue({ data: { session: { user: siska } } });
    const auth = useAuthStore();
    await auth.refresh();
    expect(auth.isLoggedIn).toBe(true);
    expect(auth.email).toBe("siskadptr@gmail.com");
    expect(auth.displayName).toBe("Siska");
    expect(auth.initial).toBe("S");
  });

  it("refresh: getSession melempar (offline) → tetap anon, tidak crash", async () => {
    getSession.mockRejectedValue(new Error("offline"));
    const auth = useAuthStore();
    await expect(auth.refresh()).resolves.toBeUndefined();
    expect(auth.isLoggedIn).toBe(false);
  });

  it("init: pasang listener SEKALI walau dipanggil berkali-kali", () => {
    const auth = useAuthStore();
    auth.init();
    auth.init();
    expect(onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it("listener onAuthStateChange memperbarui state (login lalu logout dari tab lain)", () => {
    const auth = useAuthStore();
    auth.init();
    const handler = onAuthStateChange.mock.calls[0]?.[0] as (
      e: string,
      s: { user: typeof siska } | null,
    ) => void;
    handler("SIGNED_IN", { user: siska });
    expect(auth.isLoggedIn).toBe(true);
    handler("SIGNED_OUT", null);
    expect(auth.isLoggedIn).toBe(false);
    expect(auth.email).toBe("");
  });

  it("signOut: panggil Supabase + reset state, bahkan kalau Supabase error", async () => {
    getSession.mockResolvedValue({ data: { session: { user: siska } } });
    const auth = useAuthStore();
    await auth.refresh();
    signOut.mockRejectedValue(new Error("network"));
    await expect(auth.signOut()).rejects.toThrow("network");
    expect(auth.isLoggedIn).toBe(false);
    expect(auth.displayName).toBe("");
  });
});
