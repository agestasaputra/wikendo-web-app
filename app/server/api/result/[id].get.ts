/**
 * GET /api/result/[id] — read ONE stored result (a `generations` row) by its UUID.
 *
 * WHAT: validate the id → read `generations` by id → return the stored deck + its kind.
 * WHY: a result used to BE the quiz answers in the query string, so opening a result ran the
 *   POST again: quota burned, anonymous users hit the login wall, and a shared link produced a
 *   DIFFERENT deck. Reading a stored deck is a VIEW, not a generation → zero quota, zero LLM.
 * RULES: public-by-link (UUID v4 = 122 bit, unguessable — same model as a Google Docs link);
 *   never echo `quiz_input` back (only `mall_slug`, which the food label needs).
 * EXAMPLE: GET /api/result/0f8fad5b-d9cb-469f-a165-70867728950e
 *   → { id, kind: "place", recommendations: [...], mall_slug: "", created_at }
 */
import { createError, defineEventHandler, getRouterParam } from "h3";
import { isResultId } from "../../../common/utils/resultUrl";
import { supabaseAdmin } from "../../utils/db";

/** The `quiz_input` JSONB fields this endpoint is allowed to read. */
interface StoredInput {
  type?: string | null;
  mall_slug?: string | null;
}

/* eslint-disable complexity */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id") || "";
  // Reject junk BEFORE any DB call: no answer-shaped payloads, no SQL-ish strings.
  if (!isResultId(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "INVALID_RESULT_ID",
      data: { message: "Link hasil nggak valid." },
    });
  }

  const { data: row, error } = await supabaseAdmin()
    .from("generations")
    .select("id, quiz_input, recommendations, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "DB_ERROR",
      data: { message: error.message },
    });
  }
  if (!row) {
    throw createError({
      statusCode: 404,
      statusMessage: "RESULT_NOT_FOUND",
      data: {
        message:
          "Hasil ini nggak ketemu — linknya mungkin salah atau sudah dihapus. " +
          "Coba quiz lagi, gratis.",
      },
    });
  }

  const input = (row.quiz_input ?? {}) as StoredInput;
  const kind = input.type === "food" ? "food" : "place";

  return {
    id: row.id,
    kind,
    recommendations: Array.isArray(row.recommendations)
      ? row.recommendations
      : [],
    // Only the mall label travels back — mood/budget/companion stay private.
    mall_slug: kind === "food" ? (input.mall_slug ?? "") : "",
    created_at: row.created_at ?? null,
  };
});
