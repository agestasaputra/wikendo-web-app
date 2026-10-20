/**
 * server/utils/insertGeneration.ts — persist one generated deck, returning its id.
 *
 * WHAT: insertGeneration(db, { sessionId, userId, kind, body, recommendations }) → id | undefined.
 * WHY: both recommend endpoints wrote the same INSERT (7 columns, same type tag, same
 *   read-back). One copy means the `quiz_input.type` discriminator can never be forgotten in
 *   one mode, which would make those rows invisible to history and to the anon counter.
 * WHY a failed save is logged, not thrown: the user already has the deck on screen; failing
 *   the request would turn a cosmetic DB hiccup into "no recommendations at all". The cost is
 *   an unshareable link, which is strictly better than an empty page.
 * EXAMPLE: const id = await insertGeneration(db, { ... }); // id === undefined → UI hides share
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuizKind } from "./anonQuotaPolicy";

interface InsertGenerationInput {
  sessionId: string;
  /** null = anonymous row (claimable later via the session_id cookie). */
  userId: string | null;
  kind: QuizKind;
  /** The quiz answers, stored so the deck can be re-read without re-asking. */
  body: object;
  recommendations: unknown[];
}

/** Insert the deck and read its id back (the id is the public result address). */
export async function insertGeneration(
  db: SupabaseClient,
  input: InsertGenerationInput,
): Promise<string | undefined> {
  const { data, error } = await db
    .from("generations")
    .insert({
      session_id: input.sessionId,
      user_id: input.userId,
      quiz_input: { ...input.body, type: input.kind },
      recommendations: input.recommendations,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`${input.kind} recommend: save failed`, error.message);
    return undefined;
  }
  return data?.id;
}
