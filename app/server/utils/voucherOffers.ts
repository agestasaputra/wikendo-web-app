/**
 * server/utils/voucherOffers.ts — V13D active voucher offers for ONE mall (read model).
 *
 * WHAT: listMallOffers(db, mallId) → VoucherOffer[] joined to the tenant name, plus
 *   findMallIdBySlug(db, slug) for the 404 wall.
 * WHY here and not in the route: the route stays a thin 15-line handler (repo convention), and the
 *   join + row mapping is the part that needs a unit test.
 * WHY `claimed: false`: "claimed" is per USER (voucher_claims), not per voucher — the public read
 *   cannot know it. The page flips the row locally after a successful POST /api/voucher/claim, and a
 *   server-side `claimed` flag belongs to an authed endpoint (P1), not to this public list.
 * EXAMPLE: const db = supabaseAdmin(); const mallId = await findMallIdBySlug(db, "grand-indonesia");
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MallRow } from "../../common/types/database";
import type { VoucherOffer } from "../../features/food/@types/food";

/** 1 raw row of `vouchers` + the embedded `tenants(name)` from the select. */
interface VoucherJoinRow {
  code: string;
  tenant_id: string;
  promo_text: string;
  discount_percent: number;
  valid_until: string;
  tenant?: { name?: string | null } | null;
}

const OFFER_COLUMNS =
  "code,tenant_id,promo_text,discount_percent,valid_until,tenant:tenants!inner(name)";

/** mall slug → mall id, or null when the slug does not exist (route answers 404). */
export async function findMallIdBySlug(
  db: SupabaseClient,
  slug: string,
): Promise<string | null> {
  const { data } = await db
    .from("malls")
    .select("id")
    .eq("slug", slug)
    .maybeSingle<Pick<MallRow, "id">>();
  return data?.id ?? null;
}

/** Raw join row → render contract (never leaks the tenant object). */
export function toVoucherOffer(row: VoucherJoinRow): VoucherOffer {
  return {
    code: row.code,
    tenant_id: row.tenant_id,
    tenant_name: row.tenant?.name ?? "",
    promo_text: row.promo_text,
    discount_percent: Number(row.discount_percent) || 0,
    expires_at: row.valid_until,
    claimed: false,
  };
}

/**
 * Active, non-expired offers for ONE mall (an empty list is a valid answer, never an error).
 * WHY filter by `tenants.mall_id` instead of loading all vouchers: a mall has a handful of active
 * promos, the whole table does not — and the old bug was exactly a cross-mall leak.
 */
export async function listMallOffers(
  db: SupabaseClient,
  mallId: string,
): Promise<VoucherOffer[]> {
  const { data, error } = await db
    .from("vouchers")
    .select(OFFER_COLUMNS)
    .eq("promo_active", true)
    .eq("tenants.mall_id", mallId)
    .gt("valid_until", new Date().toISOString())
    .order("valid_until");
  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "DB_ERROR",
      data: { message: error.message },
    });
  }
  return ((data ?? []) as VoucherJoinRow[]).map(toVoucherOffer);
}
