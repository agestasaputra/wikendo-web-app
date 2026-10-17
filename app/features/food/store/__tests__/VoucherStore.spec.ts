import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useVoucherStore } from "../VoucherStore";

/**
 * VoucherStore.spec.ts — Voucher claim V13B (user Bearer to POST /api/voucher/claim).
 * Supabase + $fetch mocked. Locked: Bearer header, anti double-click guard, friendly error message.
 */
const { getSession, fetchMock } = vi.hoisted(() => ({
  getSession: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock("~/common/composables/useSupabaseBrowser", () => ({
  useSupabaseBrowser: () => ({ auth: { getSession } }),
}));

const ok = {
  status: "ok",
  claim_code: "WKD-7X2K9A",
  expires_at: "2026-10-16T16:59:00.000Z",
  voucher: { name: "Kopi Weekday -20%", discount_percent: 20 },
  time_remaining: { hours: 3, minutes: 10, expired: false },
};

describe("VoucherStore.claimVoucher", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    setActivePinia(createPinia());
    fetchMock.mockReset().mockResolvedValue(ok);
    getSession
      .mockReset()
      .mockResolvedValue({ data: { session: { access_token: "tok-abc" } } });
    vi.stubGlobal("$fetch", fetchMock);
  });

  it("success: POST /api/voucher/claim + Authorization Bearer + stores claimedCode", async () => {
    const store = useVoucherStore();
    const res = await store.claimVoucher("WKD-7X2K9A");
    expect(res.claim_code).toBe("WKD-7X2K9A");
    expect(store.claimedCode).toBe("WKD-7X2K9A");
    expect(store.claiming).toBe(false);
    const [url, opts] = fetchMock.mock.calls[0] as [
      string,
      { method: string; body: unknown; headers: Record<string, string> },
    ];
    expect(url).toBe("/api/voucher/claim");
    expect(opts.method).toBe("POST");
    expect(opts.body).toEqual({ voucher_code: "WKD-7X2K9A" });
    expect(opts.headers.Authorization).toBe("Bearer tok-abc");
  });

  it("without session → request with no header (server replies 401, login wall)", async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    const store = useVoucherStore();
    await store.claimVoucher("WKD-7X2K9A");
    const opts = fetchMock.mock.calls[0]?.[1] as {
      headers: Record<string, string>;
    };
    expect(opts.headers).toEqual({});
  });

  it("failure: server message used, error rethrown, claiming back to false", async () => {
    fetchMock.mockRejectedValue({
      data: { message: "Anda sudah mengklaim voucher tenant ini hari ini." },
    });
    const store = useVoucherStore();
    await expect(store.claimVoucher("WKD-7X2K9A")).rejects.toBeDefined();
    expect(store.claimError).toBe(
      "Anda sudah mengklaim voucher tenant ini hari ini.",
    );
    expect(store.claiming).toBe(false);
  });

  it("failure without message → friendly fallback", async () => {
    fetchMock.mockRejectedValue({});
    const store = useVoucherStore();
    await expect(store.claimVoucher("X")).rejects.toBeDefined();
    expect(store.claimError).toBe("Gagal klaim. Coba lagi.");
  });

  it('UX lock: second claim while still claiming → "busy" status, ZERO extra requests', async () => {
    let release: (v: typeof ok) => void = () => {};
    fetchMock.mockReturnValue(
      new Promise<typeof ok>((resolve) => {
        release = resolve;
      }),
    );
    const store = useVoucherStore();
    const first = store.claimVoucher("WKD-7X2K9A");
    await vi.waitFor(() => expect(store.claiming).toBe(true));
    const second = await store.claimVoucher("WKD-4Y5B3C");
    expect(second.status).toBe("busy");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    release(ok);
    await first;
  });
});
