/**
 * test/utils.ts — Helper test bersama: baca source file sebagai teks (file-assert deterministik).
 *
 * APA: readSource(...paths) = gabungan isi file relatif root app/, dinormalisasi supaya assert tahan
 *   terhadap format Prettier: hex lowercase, spasi di dalam style="..." dirapikan, whitespace/newline
 *   dipadatkan jadi 1 spasi (teks yang dibungkus Prettier tetap cocok).
 * KENAPA: banyak test mengunci "lock" UI dengan membaca .vue/.ts sebagai teks (NOL network, NOL browser).
 *   Setelah halaman dipecah jadi komponen, 1 assert bisa membaca beberapa file sekaligus.
 * Contoh: readSource("features/auth/LoginPage.vue", "features/auth/components/GoogleButton.vue")
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

/** Hex lowercase + rapikan style="…" (Prettier menulis `a: b; c: d`) + padatkan whitespace. */
export function normalizeSource(raw: string): string {
  const squashed = raw.replace(/style="([^"]*)"/g, (_m, css: string) => {
    return `style="${css.replace(/\s*([:;])\s*/g, "$1").trim()}"`;
  });
  return squashed
    .replace(/#[0-9A-Fa-f]{3,8}\b/g, (hex) => hex.toLowerCase())
    .replace(/\s+/g, " ");
}

/** Path relatif root app/ → absolut. */
export function fromRoot(...segments: string[]): string {
  return path.join(ROOT, ...segments);
}

/** Ada tidaknya file (relatif root app/). */
export function sourceExists(rel: string): boolean {
  return fs.existsSync(fromRoot(rel));
}

/** Gabungan isi beberapa file (relatif root app/), sudah dinormalisasi. File hilang → error jelas. */
export function readSource(...rels: string[]): string {
  return rels
    .map((rel) => normalizeSource(fs.readFileSync(fromRoot(rel), "utf-8")))
    .join("\n");
}
