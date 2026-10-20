/**
 * GET /api/history — this user's generation history, newest first, paginated.
 *
 * WHAT: 401 wall → clamp page/pageSize → read `generations` for (user_id) OR (this browser's
 *   session_id) → { items, pagination }.
 * WHY the session_id OR: rows created before login are still owned by nobody; the browser that
 *   made them must keep seeing them until `POST /api/history/claim` adopts them.
 * WHY the pageSize clamp: `?pageSize=100000` would be a free full-table dump of the deck text.
 * EXAMPLE: /api/history?page=1&pageSize=10 + Bearer → { items: [...], pagination: {...} }.
 */
import { defineEventHandler, getQuery, getCookie, createError } from "h3";
import { supabaseAdmin } from "../utils/db";
import { requireAuthUser } from "../utils/requireUser";

const DEFAULT_PAGE_SIZE = 10;
/** Hard cap: one page can never request the whole table. */
const MAX_PAGE_SIZE = 50;

/** `?page&pageSize` → safe positive numbers (garbage → defaults, never NaN). */
function readPaging(query: Record<string, unknown>): {
  page: number;
  pageSize: number;
  offset: number;
} {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(query.pageSize) || DEFAULT_PAGE_SIZE),
  );
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export default defineEventHandler(async (event) => {
  const userId = await requireAuthUser(event, "Login required to view history");
  const { page, pageSize, offset } = readPaging(
    getQuery(event) as Record<string, unknown>,
  );

  // Anonymous rows made by THIS browser are visible until they are claimed.
  const sessionId = getCookie(event, "session_id") || "";
  const filters = [`user_id.eq.${userId}`];
  if (sessionId) filters.push(`session_id.eq.${sessionId}`);

  const { data, error, count } = await supabaseAdmin()
    .from("generations")
    .select("*", { count: "exact" })
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "DB_ERROR",
      data: { message: error.message },
    });
  }

  return {
    items: data ?? [],
    pagination: { page, pageSize, total: count ?? 0 },
  };
});
