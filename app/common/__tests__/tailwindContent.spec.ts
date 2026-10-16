import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { fromRoot, readSource } from "~/test/utils";

/**
 * tailwindContent.spec.ts — Regression: SETIAP folder yang berisi .vue harus ikut discan Tailwind.
 * KENAPA: @nuxtjs/tailwindcss hanya scan folder default Nuxt (components, layouts, pages, plugins,
 * composables, utils, app.vue). Saat template dipindah ke features/ + common/ tanpa mendaftarkannya,
 * Tailwind membuang semua class → desain polos tanpa style (kejadian 16 Okt 2026).
 * Test ini gagal kalau ada folder baru ber-.vue yang belum didaftarkan di tailwind.config.ts.
 */
const NUXT_DEFAULT_DIRS = [
  "components",
  "layouts",
  "pages",
  "plugins",
  "composables",
  "utils",
];
const IGNORED_DIRS = new Set([
  "node_modules",
  ".nuxt",
  ".output",
  ".git",
  "public",
  "server",
  "test",
]);

function topLevelDirsWithVue(): string[] {
  return fs
    .readdirSync(fromRoot("."), { withFileTypes: true })
    .filter((e) => e.isDirectory() && !IGNORED_DIRS.has(e.name))
    .map((e) => e.name)
    .filter((dir) => hasVue(fromRoot(dir)));
}

function hasVue(dir: string): boolean {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .some((e) =>
      e.isDirectory()
        ? hasVue(path.join(dir, e.name))
        : e.name.endsWith(".vue"),
    );
}

describe("Tailwind content scan", () => {
  const config = readSource("tailwind.config.ts");

  it("setiap folder ber-.vue = folder default Nuxt ATAU terdaftar di tailwind.config.ts content", () => {
    const missing = topLevelDirsWithVue().filter(
      (dir) =>
        !NUXT_DEFAULT_DIRS.includes(dir) && !config.includes(`./${dir}/**`),
    );
    expect(
      missing,
      `folder belum discan Tailwind: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("features/ dan common/ (tempat template hidup) terdaftar", () => {
    expect(config).toContain("./features/**");
    expect(config).toContain("./common/**");
  });
});
