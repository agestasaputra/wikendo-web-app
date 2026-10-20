/**
 * common/utils/pageTitle.ts — Centre title in the TopNav: "which page am I on?".
 *
 * WHAT: pageTitle(path) → the label shown in the middle of the header, or null for Home.
 * WHY: the app is a single thumb-width column; without a label the user only sees an icon
 *   (back button) and cannot tell whether they are in the quiz, the result, or the directory.
 *   The label must come from ONE map — not from each page — otherwise 14 routes drift apart.
 * EXAMPLE: pageTitle("/mall/grand-indonesia") → "Grand Indonesia"; pageTitle("/") → null.
 */
import { getMallName } from "./mall";

/**
 * Fixed routes → label. Prefer the BottomNav wording for tabs (Mall / Riwayat / Akun),
 * so the header and the nav never use two names for the same place.
 */
const STATIC_TITLES: Record<string, string> = {
  "/place": "Cari Tempat",
  "/result-place": "Rekomendasi Tempat",
  "/food": "Cari Makan",
  "/result-food": "Rekomendasi Makan",
  "/mall": "Mall",
  "/history": "Riwayat",
  "/account": "Akun",
  "/login": "Masuk",
  "/register": "Daftar",
  "/check-email": "Cek Email",
  "/forgot-password": "Lupa Password",
  "/reset-password": "Reset Password",
  "/privacy": "Kebijakan Privasi",
  "/terms": "Syarat & Ketentuan",
};

/** Path without query/hash and without a trailing slash, so "/place/?x=1" === "/place". */
function normalizePath(path: string): string {
  const withoutQuery = path.split(/[?#]/)[0] ?? "";
  const trimmed = withoutQuery.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/** "event" → "Event", "line-up" → "Line Up". Only used for routes not in the map yet. */
function humanizeSegment(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Route path → header title. Returns null on Home (logo is the identity there, no label).
 * Unknown routes fall back to the first segment so a brand-new page is never blank.
 */
export function pageTitle(path: string): string | null {
  const clean = normalizePath(path);
  if (clean === "/") return null;

  const fixed = STATIC_TITLES[clean];
  if (fixed) return fixed;

  // /mall/<slug> → the mall's real name (never the raw slug when it is known).
  const mallSlug = /^\/mall\/([^/]+)$/.exec(clean)?.[1];
  if (mallSlug) {
    const known = getMallName(mallSlug);
    return known === mallSlug ? humanizeSegment(mallSlug) : known;
  }

  const firstSegment = clean.split("/").filter(Boolean)[0] ?? "";
  return humanizeSegment(firstSegment) || null;
}
