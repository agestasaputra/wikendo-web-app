/**
 * test/utils.ts — Shared test helper: read a source file as text (deterministic file-assert).
 *
 * WHAT: readSource(...paths) = concatenated contents of files relative to the app/ root, normalized so asserts hold up
 *   against Prettier formatting: lowercase hex, spaces inside style="..." tidied up, whitespace/newlines
 *   collapsed into 1 space (text wrapped by Prettier still matches).
 * WHY: many tests lock the UI by reading .vue/.ts as text (ZERO network, ZERO browser).
 *   After a page is split into components, 1 assert can read several files at once.
 * EXAMPLE: readSource("features/auth/LoginPage.vue", "features/auth/components/GoogleButton.vue")
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

/** Lowercase hex + tidy style="…" (Prettier writes `a: b; c: d`) + collapse whitespace. */
export function normalizeSource(raw: string): string {
  const squashed = raw.replace(/style="([^"]*)"/g, (_m, css: string) => {
    return `style="${css.replace(/\s*([:;])\s*/g, "$1").trim()}"`;
  });
  return squashed
    .replace(/#[0-9A-Fa-f]{3,8}\b/g, (hex) => hex.toLowerCase())
    .replace(/\s+/g, " ");
}

/** Relative path from the app/ root → absolute. */
export function fromRoot(...segments: string[]): string {
  return path.join(ROOT, ...segments);
}

/** Whether a file exists (relative to the app/ root). */
export function sourceExists(rel: string): boolean {
  return fs.existsSync(fromRoot(rel));
}

/** Concatenated contents of several files (relative to the app/ root), already normalized. Missing file → clear error. */
export function readSource(...rels: string[]): string {
  return rels
    .map((rel) => normalizeSource(fs.readFileSync(fromRoot(rel), "utf-8")))
    .join("\n");
}
