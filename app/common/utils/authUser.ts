/**
 * common/utils/authUser.ts — Display name + initials from the Supabase user.
 *
 * WHAT: buildDisplayName(user): full_name > name > email prefix > "Teman"; getInitial(). PURE.
 * WHY: previously mixed into useAuth (state + logic) → split out so it is testable without Supabase.
 * EXAMPLE: buildDisplayName({ email: "budi@example.com" }) → "Budi".
 */

export interface AuthUser {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** First name from metadata, fallback to email prefix, fallback to "Teman". */
export function buildDisplayName(user: AuthUser): string {
  const meta = user.user_metadata ?? {};
  const full = (meta.full_name as string) || (meta.name as string) || "";
  const first = full.trim().split(/\s+/)[0] || "";
  if (first) return capitalize(first);
  const prefix = (user.email ?? "").split("@")[0] || "Teman";
  return capitalize(prefix);
}

/** First letter (name → email → "?") uppercase. */
export function getInitial(displayName: string, email: string): string {
  return (displayName || email || "?").charAt(0).toUpperCase();
}
