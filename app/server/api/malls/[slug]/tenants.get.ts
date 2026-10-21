/**
 * GET /api/malls/:slug/tenants — List tenants of 1 mall + server-side filter + S2b paging.
 * Query filter: ?halal=true ?budget=budget|mid|splurge ?kids=true ?search=kopi ?mission=long_hangout
 * Without ?limit = legacy array (backward-compat, 40 tenants at once as it is now).
 * With ?limit&?offset = object { items, total, hasMore } (10/page default, max 50).
 * Column filters in Supabase SQL; mission (array) in-memory; paging is sliced after
 * all filters (correct for 40 rows/mall, total = post-filter for the sticky count "10/40").
 * No login/quota/LLM. 404 if the mall slug doesn't exist.
 * NULL RULE (tri-state): see server/utils/tenantFilters.ts.
 */
import type { TenantRow } from "../../../../common/types/api";
import type { MallRow } from "../../../../common/types/database";
import {
  hasMorePages,
  parsePaginationParams,
} from "../../../../utils/pagination";
import { supabaseAdmin } from "../../../utils/db";
import {
  buildDirectoryEqFilters,
  filterByMission,
} from "../../../utils/tenantFilters";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug") as string;
  const query = getQuery(event);
  setHeader(
    event,
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300",
  );
  const db = supabaseAdmin();

  const { data: mall } = await db
    .from("malls")
    .select("*")
    .eq("slug", slug)
    .single<MallRow>();
  if (!mall)
    throw createError({
      statusCode: 404,
      statusMessage: "Mall tidak ditemukan",
    });

  let q = db
    .from("tenants")
    .select("*")
    .eq("mall_id", mall.id)
    .eq("is_open", true);
  for (const [column, value] of buildDirectoryEqFilters(query)) {
    q = q.eq(column, value);
  }
  if (query.search) q = q.ilike("name", `%${query.search}%`);
  const { data: tenants } = await q
    .order("promo", { ascending: false, nullsFirst: false })
    .order("hype_tiktok", { ascending: false, nullsFirst: false })
    .order("name");

  const list = filterByMission((tenants || []) as TenantRow[], query.mission);

  // Legacy: without ?limit → full array (old contract).
  if (query.limit === undefined) return list;

  const { limit, offset } = parsePaginationParams(
    query as Record<string, unknown>,
  );
  const items = list.slice(offset, offset + limit);
  return {
    items,
    total: list.length,
    hasMore: hasMorePages(offset + items.length, list.length),
  };
});
