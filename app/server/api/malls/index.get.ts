/**
 * GET /api/malls — List active malls + S2b infinity scroll paging.
 * Without ?limit = legacy array (backward-compat, 5 malls at once as it is now).
 * With ?limit&?offset = object { items, total, hasMore } (10/page default, max 50).
 *
 * ?search=<q>  case-insensitive name match (server-side, so paging stays correct).
 * ?sort=name_asc|name_desc|tenant_desc|tenant_asc  (default name_asc).
 * No login/quota/LLM — the directory page is accessible to anyone.
 * EXAMPLE: /api/malls?limit=10&offset=0&sort=tenant_desc → { items:[...5], total:5, hasMore:false }.
 */
import { hasMorePages, parsePaginationParams } from "../../../utils/pagination";
import { supabaseAdmin } from "../../utils/db";

/** Whitelist: an unknown ?sort must never reach PostgREST (injection / 400). */
const MALL_SORTS = [
  "name_asc",
  "name_desc",
  "tenant_desc",
  "tenant_asc",
] as const;
type MallSort = (typeof MALL_SORTS)[number];

function parseMallSort(raw: unknown): MallSort {
  return MALL_SORTS.includes(raw as MallSort) ? (raw as MallSort) : "name_asc";
}

/** Sort key → [column, ascending]. Unknown handled by parseMallSort. */
function sortSpec(sort: MallSort): [string, boolean] {
  if (sort === "name_desc") return ["name", false];
  if (sort === "tenant_desc") return ["total_tenant", false];
  if (sort === "tenant_asc") return ["total_tenant", true];
  return ["name", true];
}

export default defineEventHandler(async (event) => {
  const db = supabaseAdmin();
  const query = getQuery(event);
  setHeader(
    event,
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300",
  );

  const search = typeof query.search === "string" ? query.search.trim() : "";
  const sort = parseMallSort(query.sort);
  const [column, ascending] = sortSpec(sort);

  // Legacy: without ?limit → array (old contract, old pages don't crash).
  if (query.limit === undefined) {
    let legacy = db.from("malls").select("*").eq("is_active", true);
    if (search) legacy = legacy.ilike("name", `%${search}%`);
    const { data } = await legacy.order(column, {
      ascending,
      nullsFirst: false,
    });
    return data || [];
  }

  const { limit, offset } = parsePaginationParams(
    query as Record<string, unknown>,
  );
  let paged = db
    .from("malls")
    .select("*", { count: "exact" })
    .eq("is_active", true);
  if (search) paged = paged.ilike("name", `%${search}%`);
  const { data, count } = await paged
    .order(column, { ascending, nullsFirst: false })
    .order("slug", { ascending: true })
    .range(offset, offset + limit - 1);
  const items = data || [];
  const total = count ?? items.length;
  return { items, total, hasMore: hasMorePages(offset + items.length, total) };
});
