/**
 * common/constants/quota.ts — Quota numbers, ONE owner (DRY).
 *
 * WHAT: daily generation limits per type, per auth state, + the free-trial total.
 * WHY: these numbers used to live in 3 places (`common/utils/quota.ts` for the UI,
 *   `server/utils/anonQuotaPolicy.ts` for the gate, and a literal `5` inside
 *   `food/recommend.post.ts`) kept in sync "by a unit test" — a test can detect drift,
 *   it cannot prevent it. A single constant module is imported by BOTH the browser and
 *   the server, so the wallet can never advertise a limit the gate does not enforce.
 *   Lives in `common/constants/` because the contract doc requires limits/copy tables there.
 * EXAMPLE: MEMBER_FOOD_LIMIT → 5 (food, logged in, per WIB day).
 */

/** Anonymous device: 1 place + 1 food, but only 2 generations in total per day. */
export const ANON_PLACE_LIMIT = 1;
export const ANON_FOOD_LIMIT = 1;
/** Total free generations per device per WIB day — the headline number in the UI. */
export const FREE_TRIAL_TOTAL = 2;

/** Logged-in member: 2 place + 5 food per day. */
export const MEMBER_PLACE_LIMIT = 2;
export const MEMBER_FOOD_LIMIT = 5;

/** Short label for chips ("2 gratis"). */
export const FREE_TRIAL_LABEL = `${FREE_TRIAL_TOTAL} gratis`;
