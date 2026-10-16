/**
 * GET /api/malls/:slug/tenants — List tenant 1 mall + filter server-side + paging S2b.
 * Query filter: ?halal=true ?budget=hemat|menengah|leluasa ?kids=true ?search=kopi ?mission=nongkrong_lama
 * Tanpa ?limit = array legacy (backward-compat, 40 tenant sekaligus seperti sekarang).
 * Dengan ?limit&?offset = objek { items, total, hasMore } (10/page default, max 50).
 * Filter kolom di SQL Supabase; mission (array) di-memory; paging di-slice setelah
 * semua filter (benar untuk 40 row/mall, total = pasca-filter buat sticky count "10/40").
 * Tanpa login/quota/LLM. 404 kalau slug mall tidak ada.
 * ATURAN NULL (tri-state): lihat server/utils/tenantFilters.ts.
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
  const { data: tenants } = await q.order("name");

  const list = filterByMission((tenants || []) as TenantRow[], query.mission);

  // Legacy: tanpa ?limit → array penuh (kontrak lama).
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
