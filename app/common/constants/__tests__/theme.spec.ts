/**
 * common/constants/__tests__/theme.spec.ts — kontrak warna kanvas halaman.
 *
 * WHAT: menguji PAGE_BG + memastikan TIDAK ada feature page yang mendeklarasikan background
 *   kanvas sendiri (akar drift: home #F5F5F4, auth #f2f2f2, history/account tanpa background
 *   → jatuh ke bg-base #fffdf9, jadi 3 halaman terlihat beda warna).
 * WHY: satu kanvas = satu sumber kebenaran (DRY + single responsibility). Layout yang mengecat
 *   kanvas; feature hanya mengisi konten. Test ini mengunci aturan itu supaya tidak kambuh.
 * EXAMPLE: `pnpm vitest run common/constants/__tests__/theme.spec.ts`
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PAGE_BG } from "../theme";
import { rootTag } from "~/test/utils";

const APP_ROOT = join(__dirname, "../../..");
const FEATURES = join(APP_ROOT, "features");

/** Semua file .vue di features/ (rekursif) — kandidat pelanggar. */
function vueFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return vueFiles(full);
    return name.endsWith(".vue") ? [full] : [];
  });
}

describe("PAGE_BG — kanvas halaman tunggal", () => {
  it("bernilai paper #F5F5F4 (sama dengan home)", () => {
    expect(PAGE_BG).toBe("#F5F5F4");
  });

  it("app.vue mengecat kanvas dari PAGE_BG, bukan class bg-base", () => {
    const app = readFileSync(join(APP_ROOT, "app.vue"), "utf8");
    expect(app).toContain('from "~/common/constants/theme"');
    expect(app).toContain("PAGE_BG");
    expect(app).not.toContain("bg-base");
  });

  it("root element tiap feature page TIDAK mendeklarasikan background kanvas", () => {
    const offenders = vueFiles(FEATURES).filter((file) =>
      /background/i.test(rootTag(readFileSync(file, "utf8"))),
    );
    expect(offenders).toEqual([]);
  });

  it("tidak ada hex kanvas hardcoded di features (pakai PAGE_BG / bg-stone-*)", () => {
    const offenders = vueFiles(FEATURES).filter((file) => {
      const src = readFileSync(file, "utf8").toLowerCase();
      return src.includes("#f5f5f4") || src.includes("#f2f2f2");
    });
    expect(offenders).toEqual([]);
  });

  it("meta helper tidak lagi memiliki field pageBg (kanvas bukan milik feature)", () => {
    const metas = [
      "home/utils/homeHero.ts",
      "place/utils/resultMeta.ts",
      "food/utils/resultMeta.ts",
    ];
    for (const rel of metas) {
      // the FIELD must be gone; a doc comment may still explain why.
      expect(readFileSync(join(FEATURES, rel), "utf8")).not.toMatch(
        /\bpageBg\s*:/,
      );
    }
  });

  it("footer global TIDAK punya background sendiri → ikut kanvas PAGE_BG", () => {
    const app = readFileSync(join(APP_ROOT, "app.vue"), "utf8");
    const start = app.indexOf("<footer");
    const end = app.indexOf("</footer>");
    expect(start).toBeGreaterThan(-1);
    const footerTag = app.slice(start, app.indexOf(">", start) + 1);
    // A footer with its own bg/colour band is what made it read as a different page.
    expect(footerTag).not.toMatch(/background/i);
    expect(footerTag).not.toMatch(/\bbg-/);
    expect(end).toBeGreaterThan(start);
  });

  it("type ramp satu pemilik: tailwind.css @layer base, app.vue tanpa fontFamily inline", () => {
    const css = readFileSync(join(APP_ROOT, "assets/css/tailwind.css"), "utf8");
    expect(css).toMatch(/@layer base/);
    expect(css).toContain("Plus Jakarta Sans");

    const app = readFileSync(join(APP_ROOT, "app.vue"), "utf8");
    expect(app).not.toMatch(/fontFamily/);
    expect(app).not.toContain("Plus Jakarta Sans");
  });
});
