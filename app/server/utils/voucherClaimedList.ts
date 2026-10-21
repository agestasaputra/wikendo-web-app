/**
 * server/utils/voucherClaimedList.ts — voucher codes a user has ALREADY claimed today (WIB).
 *
 * WHAT: listClaimedCodes(db, userId, mallId?) → string[] of voucher codes claimed by this user
 *   with claim_date = today WIB, optionally scoped to one mall via vouchers → tenants.mall_id.
 * WHY a separate util: the public /api/vouchers list cannot know per-user state (always claimed:false),
 *   so the page needs an authed read model to keep "Sudah diklaim" after a refresh or on another device.
 *   Keeping the join + WIB date here makes it unit-testable and leaves the route thin.
 * EXAMPLE: const codes = await listClaimedCodes(supabaseAdmin(), userId, mallId);
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { todayWIB } from "./voucherClaim";
import { findMallIdBySlug } from "./voucherOffers";

interface ClaimedRow {
  code?: string | null;
  claim_code?: string | null;
  vouchers?: {
    code?: string | null;
    tenants?: { mall_id?: string | null } | null;
  } | null;
}

const CLAIMED_COLUMNS = "code,claim_code,vouchers(code,tenants(mall_id))";

/** True when this row belongs to a different mall than the one requested. */
function isMallScopedOut(row: ClaimedRow, mallId?: string | null): boolean {
  if (!mallId) return false;
  const rowMall = row.vouchers?.tenants?.mall_id;
  if (!rowMall) return false;
  return rowMall !== mallId;
}

/** Collect unique claimed codes from a raw voucher_claims query result, applying optional mall scope. */
function collectClaimedCodes(
  rows: ClaimedRow[] | null,
  mallId?: string | null,
): string[] {
  const codes = new Set<string>();
  for (const row of rows ?? []) {
    const code = row.claim_code || row.code || row.vouchers?.code || "";
    if (!code) continue;
    if (isMallScopedOut(row, mallId)) continue;
    codes.add(code);
  }
  return [...codes];
}

/** Today's claimed voucher codes for one user, optionally scoped to a mall id. */
export async function listClaimedCodes(
  db: SupabaseClient,
  userId: string,
  mallId?: string | null,
): Promise<string[]> {
  const { data, error } = await db
    .from("voucher_claims")
    .select(CLAIMED_COLUMNS)
    .eq("user_id", userId)
    .eq("claim_date", todayWIB());

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "DB_ERROR",
      data: { message: error.message },
    });
  }

  return collectClaimedCodes(data as ClaimedRow[] | null, mallId);
}

/** Resolve a mall slug → id, then list today's claimed codes for that mall.
 *  An unknown slug returns [] (NOT every claim the user made elsewhere): a typo must not
 *  light up "Sudah diklaim" on a page that has no offers. */
export async function listClaimedCodesByMallSlug(
  db: SupabaseClient,
  userId: string,
  mallSlug: string,
): Promise<string[]> {
  const slug = mallSlug.trim();
  if (!slug) return listClaimedCodes(db, userId);
  const mallId = await findMallIdBySlug(db, slug);
  if (!mallId) return [];
  return listClaimedCodes(db, userId, mallId);
}
