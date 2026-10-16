/**
 * GET /api/malls — List mall aktif + paging S2b infinity scroll.
 * Tanpa ?limit = array legacy (backward-compat, 5 mall sekaligus seperti sekarang).
 * Dengan ?limit&?offset = objek { items, total, hasMore } (10/page default, max 50).
 * Tanpa login/quota/LLM — halaman direktori boleh diakses siapa pun.
 * Contoh: /api/malls?limit=10&offset=0 → { items:[...5], total:5, hasMore:false }.
 */
import { hasMorePages, parsePaginationParams } from "../../../utils/pagination";
import { supabaseAdmin } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const db = supabaseAdmin();
  const query = getQuery(event);

  // Legacy: tanpa ?limit → array 5 mall (kontrak lama, pages lama tidak crash).
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
