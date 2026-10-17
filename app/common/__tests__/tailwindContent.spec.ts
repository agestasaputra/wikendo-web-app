import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { fromRoot, readSource } from "~/test/utils";

/**
 * tailwindContent.spec.ts — Regression: EVERY folder containing .vue must be scanned by Tailwind.
 * WHY: @nuxtjs/tailwindcss only scans Nuxt's default folders (components, layouts, pages, plugins,
 * composables, utils, app.vue). When templates moved to features/ + common/ without registering them,
 * Tailwind dropped all classes → plain design with no styles (happened Oct 16, 2026).
 * This test fails if a new folder with .vue isn't registered in tailwind.config.ts.
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

  it("every folder with .vue = a Nuxt default folder OR registered in tailwind.config.ts content", () => {
    const missing = topLevelDirsWithVue().filter(
      (dir) =>
        !NUXT_DEFAULT_DIRS.includes(dir) && !config.includes(`./${dir}/**`),
    );
    expect(
      missing,
      `folder belum discan Tailwind: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("features/ and common/ (where templates live) are registered", () => {
    expect(config).toContain("./features/**");
    expect(config).toContain("./common/**");
  });
});
