/**
 * features/makan/store/VoucherStore.ts — Wiring klaim voucher V13B ke POST /api/voucher/claim (Pinia).
 *
 * APA: claimVoucher(code) + state claiming/claimedCode/claimError; Bearer token Supabase browser (anon key).
 * KENAPA store: 1 sumber kebenaran wiring API (sheet 3 row), bukan duplikat $fetch per row.
 *   Service key tetap server-only (server/utils/db.ts) — browser cuma kirim Bearer user.
 * Contoh: const { claimVoucher } = useVoucherStore(); await claimVoucher("WKD-7X2K9A")
 */
import { ref } from "vue";
import { defineStore } from "pinia";
import { useSupabaseBrowser } from "~/common/composables/useSupabaseBrowser";
import { getErrorMessage } from "~/utils/error";
import type { VoucherClaimResult } from "../@types/makan";
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
    // UX lock: early-return guard anti double-klik (keyboard Enter bypass :disabled).
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
