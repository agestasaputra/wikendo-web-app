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
import {
  buildDirectoryMetric,
  recordDirectoryMetric,
} from "../../../utils/directoryMetrics";
import { ensureSessionId } from "../../../utils/sessionId";

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

  const list = await loadTenants(db, mall.id, query);

  // Item 5: funnel metric (search / filter + result count). Fire-and-forget — the visitor
  // must never wait on analytics and a DB hiccup must not empty the list.
  void recordDirectoryMetric(db, buildDirectoryMetric(query, list.length), {
    mallSlug: slug,
    sessionId: ensureSessionId(event),
  });

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

/**
 * All filtered tenants for one mall (paging slices this afterwards so `total` is the
 * post-filter count the sticky pill "10/40" needs).
 *
 * DEFAULT BUSINESS SORT: promo live → hype_tiktok (tren) → verified_at → name.
 * CATATAN: kolom `promo` TIDAK ADA di tabel tenants (PostgREST 400, dicek live 21 Oct) —
 * promo hidup di tabel `vouchers`. Jangan pernah .order("promo") di sini: PostgREST
 * mengembalikan error → data null → listing kosong (insiden 21 Oct). Karena itu promo
 * di-resolve lewat 1 query `vouchers` lalu dipartisi in-memory; sisanya sudah terurut
 * oleh Postgres sehingga partisi stabil = urutan bisnis yang benar.
 */
async function loadTenants(
  db: ReturnType<typeof supabaseAdmin>,
  mallId: string,
  query: Record<string, unknown>,
): Promise<TenantRow[]> {
  let q = db
    .from("tenants")
    .select("*")
    .eq("mall_id", mallId)
    .eq("is_open", true);
  for (const [column, value] of buildDirectoryEqFilters(query)) {
    q = q.eq(column, value);
  }
  if (query.search) q = q.ilike("name", `%${query.search}%`);

  const { data: tenants } = await q
    .order("hype_tiktok", { ascending: false, nullsFirst: false })
    .order("verified_at", { ascending: false, nullsFirst: false })
    .order("name");

  const rows = filterByMission((tenants || []) as TenantRow[], query.mission);
  return withPromoFirst(rows, await activePromoTenantIds(db, mallId));
}

/** Stable partition: tenants with a live voucher first, everything else keeps SQL order. */
function withPromoFirst(rows: TenantRow[], promoIds: Set<string>): TenantRow[] {
  if (promoIds.size === 0) return rows;
  const first: TenantRow[] = [];
  const rest: TenantRow[] = [];
  for (const row of rows) {
    (row.id && promoIds.has(row.id) ? first : rest).push(row);
  }
  return [...first, ...rest];
}

/** Ids of tenants in this mall with a live voucher. Empty set on any error (sort degrades gracefully). */
async function activePromoTenantIds(
  db: ReturnType<typeof supabaseAdmin>,
  mallId: string,
): Promise<Set<string>> {
  const ids = new Set<string>();
  try {
    const { data } = await db
      .from("vouchers")
      .select("tenant_id,tenant:tenants!inner(mall_id)")
      .eq("promo_active", true)
      .gt("valid_until", new Date().toISOString())
      .eq("tenant.mall_id", mallId);
    for (const row of (data ?? []) as { tenant_id?: string }[]) {
      if (row.tenant_id) ids.add(row.tenant_id);
    }
  } catch {
    // Sort falls back to hype → verified → name; never break the directory.
  }
  return ids;
}
