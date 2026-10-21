/**
 * GET /api/voucher/claims?mall_slug=grand-indonesia — voucher codes this user has ALREADY claimed today (WIB).
 *
 * WHAT: returns { codes: string[] } for the logged-in user (today WIB). Anonymous → 401.
 * WHY thin: auth guard + mall slug resolve + list in server/utils/voucherClaimedList.ts.
 * WHY 401 (not empty list) for anon: "claimed" is per-user; an empty list for anon would be a lie
 *   ("you haven't claimed anything" → UI shows Klaim button → tap → 401 → bad UX). 401 lets the
 *   page skip the fetch entirely and show the login wall copy instead.
 * EXAMPLE: $fetch("/api/voucher/claims", { query: { mall_slug: "grand-indonesia" }, headers: { Authorization: "Bearer ..." } })
 */
import { supabaseAdmin } from "../../utils/db";
import { requireBearerToken, requireUserId } from "../../utils/voucherClaim";
import { listClaimedCodesByMallSlug } from "../../utils/voucherClaimedList";

export default defineEventHandler(async (event) => {
  const token = requireBearerToken(event);
  const db = supabaseAdmin();
  const userId = await requireUserId(db, token);

  const raw = getQuery(event).mall_slug;
  const slug = (Array.isArray(raw) ? raw[0] : raw)?.trim() || "";

  const codes = slug
    ? await listClaimedCodesByMallSlug(db, userId, slug)
    : await listClaimedCodes(db, userId);

  return { codes };
});
