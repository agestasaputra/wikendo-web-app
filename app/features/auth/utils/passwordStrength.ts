/**
 * features/auth/utils/passwordStrength.ts — Register password strength meter (0–5 scale).
 *
 * WHAT: getPasswordStrength(p) + getStrengthLabel(s) + getStrengthColor(s). PURE.
 * WHY: previously 3 long computeds in RegisterPage → testable + thin page.
 * EXAMPLE: getPasswordStrength("Abcdef1!") → 5; getStrengthLabel(5) → "Sangat kuat".
 */

/** 0-5 follows length (4/6/8) + upper-lowercase + digits & symbols. */
export function getPasswordStrength(p: string): number {
  let s = 0;
  if (p.length >= 4) s += 1;
  if (p.length >= 6) s += 1;
  if (p.length >= 8) s += 1;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s += 1;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s += 1;
  return Math.min(5, s);
}

/** Word label: Lemah / Sedang / Kuat / Sangat kuat. */
export function getStrengthLabel(strength: number): string {
  if (strength <= 1) return "Lemah";
  if (strength === 2) return "Sedang";
  if (strength <= 4) return "Kuat";
  return "Sangat kuat";
}

/** Color scale red → green so the user understands without guessing the box meaning. */
export function getStrengthColor(strength: number): string {
  if (strength <= 1) return "#DC2626";
  if (strength === 2) return "#EA580C";
  if (strength === 3) return "#CA8A04";
  return "#16A34A";
}
