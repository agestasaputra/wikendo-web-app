/**
 * GET /api/malls — List active malls + S2b infinity scroll paging.
 * Without ?limit = legacy array (backward-compat, 5 malls at once as it is now).
 * With ?limit&?offset = object { items, total, hasMore } (10/page default, max 50).
 * No login/quota/LLM — the directory page is accessible to anyone.
 * EXAMPLE: /api/malls?limit=10&offset=0 → { items:[...5], total:5, hasMore:false }.
 */
import { hasMorePages, parsePaginationParams } from "../../../utils/pagination";
import { supabaseAdmin } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const db = supabaseAdmin();
  const query = getQuery(event);
  setHeader(
    event,
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300",
  );

  // Legacy: without ?limit → array of 5 malls (old contract, old pages don't crash).
  if (query.limit === undefined) {
    const { data } = await db
      .from("malls")
      .select("*")
      .eq("is_active", true)
      .order("name");
    return data || [];
  }

  const { limit, offset } = parsePaginationParams(
    query as Record<string, unknown>,
  );
  const { data, count } = await db
    .from("malls")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .order("name")
    .range(offset, offset + limit - 1);
  const items = data || [];
  const total = count ?? items.length;
  return { items, total, hasMore: hasMorePages(offset + items.length, total) };
});
