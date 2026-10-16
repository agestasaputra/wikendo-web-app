/**
 * common/utils/authUser.ts — Nama tampil + inisial dari user Supabase.
 *
 * APA: buildDisplayName(user): full_name > name > prefix email > "Teman"; getInitial(). PURE.
 * KENAPA: dulu campur di useAuth (state + logic) → dipisah supaya testable tanpa Supabase.
 * Contoh: buildDisplayName({ email: "siskadptr@gmail.com" }) → "Siskadptr".
 */

export interface AuthUser {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Nama depan dari metadata, fallback prefix email, fallback "Teman". */
export function buildDisplayName(user: AuthUser): string {
  const meta = user.user_metadata ?? {};
  const full = (meta.full_name as string) || (meta.name as string) || "";
  const first = full.trim().split(/\s+/)[0] || "";
  if (first) return capitalize(first);
  const prefix = (user.email ?? "").split("@")[0] || "Teman";
  return capitalize(prefix);
}

/** Huruf pertama (nama → email → "?") uppercase. */
export function getInitial(displayName: string, email: string): string {
  return (displayName || email || "?").charAt(0).toUpperCase();
}
