/**
 * GET /api/vouchers?mall_slug=grand-indonesia — active voucher offers for ONE mall (V13D).
 *
 * WHAT: returns VoucherOffer[] (code, tenant, promo text, discount, expires_at, claimed:false).
 * WHY a thin route: the join + row mapping lives in `server/utils/voucherOffers.ts` so it is unit
 *   testable and the handler stays ~15 lines (repo convention).
 * WHY 400 for a missing slug and 404 for an unknown one: the first is a client mistake, the second
 *   is a legit "this mall does not exist" — collapsing both hides broken links from the app.
 * EXAMPLE: $fetch("/api/vouchers", { query: { mall_slug: "grand-indonesia" } })
 */
import { supabaseAdmin } from "../utils/db";
import { findMallIdBySlug, listMallOffers } from "../utils/voucherOffers";

export default defineEventHandler(async (event) => {
  const raw = getQuery(event).mall_slug;
  const slug = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "MALL_SLUG_REQUIRED",
    });
  }

  const db = supabaseAdmin();
  const mallId = await findMallIdBySlug(db, slug);
  if (!mallId) {
    throw createError({ statusCode: 404, statusMessage: "MALL_NOT_FOUND" });
  }

  return listMallOffers(db, mallId);
});
