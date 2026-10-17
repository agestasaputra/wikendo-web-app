/**
 * features/food/store/VoucherStore.ts — V13B voucher claim wiring to POST /api/voucher/claim (Pinia).
 *
 * WHAT: claimVoucher(code) + claiming/claimedCode/claimError state; Supabase browser Bearer token (anon key).
 * WHY store: 1 source of truth for the API wiring (3-row sheet), not a duplicate $fetch per row.
 *   Service key stays server-only (server/utils/db.ts) — the browser just sends the user Bearer.
 * EXAMPLE: const { claimVoucher } = useVoucherStore(); await claimVoucher("WKD-7X2K9A")
 */
import { ref } from "vue";
import { defineStore } from "pinia";
import { useSupabaseBrowser } from "~/common/composables/useSupabaseBrowser";
import { getErrorMessage } from "~/utils/error";
import type { VoucherClaimResult } from "../@types/food";
import { buildBusyClaimResult } from "../utils/voucherClaim";

async function postClaim(code: string): Promise<VoucherClaimResult> {
  const { data } = await useSupabaseBrowser().auth.getSession();
  const token = data.session?.access_token || "";
  return $fetch<VoucherClaimResult>("/api/voucher/claim", {
    method: "POST",
    body: { voucher_code: code },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export const useVoucherStore = defineStore("voucherStore", () => {
  const claiming = ref(false);
  const claimedCode = ref("");
  const claimError = ref("");

  async function claimVoucher(code: string): Promise<VoucherClaimResult> {
    // UX lock: early-return guard against double-click (keyboard Enter bypasses :disabled).
    if (claiming.value) return buildBusyClaimResult(claimedCode.value);
    claiming.value = true;
    claimError.value = "";
    try {
      const res = await postClaim(code);
      claimedCode.value = res.claim_code;
      return res;
    } catch (e: unknown) {
      claimError.value = getErrorMessage(e, "Gagal klaim. Coba lagi.");
      throw e;
    } finally {
      claiming.value = false;
    }
  }

  return { claiming, claimedCode, claimError, claimVoucher };
});
