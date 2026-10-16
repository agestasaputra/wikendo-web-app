import { describe, it, expect } from "vitest";
import { readSource, sourceExists } from "~/test/utils";

/**
 * security.spec.ts — Kunci kontrol security yang ditegakkan konfigurasi (bukan kode aplikasi).
 * KENAPA: aturan ESLint/CI adalah "pagar"; kalau ada yang menghapusnya diam-diam, test ini merah.
 * Area: secrets management, XSS/injection (OWASP A03), logging, supply chain.
 */
const ESLINT = readSource("eslint.config.mjs");
const NUXT = readSource("nuxt.config.ts");
const CI = readSource("../.github/workflows/ci.yml");

describe("XSS / injection", () => {
  it("v-html dilarang + jalur resmi v-dompurify-html terdaftar", () => {
    expect(ESLINT).toContain('"vue/no-v-html": "error"');
    expect(sourceExists("plugins/dompurify-html.ts")).toBe(true);
    expect(readSource("plugins/dompurify-html.ts")).toContain(
      "VueDOMPurifyHTML",
    );
  });

  it("eval / new Function dilarang", () => {
    for (const rule of ["no-eval", "no-implied-eval", "no-new-func"]) {
      expect(ESLINT).toContain(`"${rule}": "error"`);
    }
  });
});

describe("secrets management", () => {
  it("client dilarang import server/ + process.env di client dilarang", () => {
    expect(ESLINT).toContain("**/server/**");
    expect(ESLINT).toContain("no-restricted-properties");
    expect(ESLINT).toContain("useRuntimeConfig()");
  });

  it("secret hanya di runtimeConfig non-public (di luar blok public)", () => {
    const [serverPart = "", publicPart = ""] = NUXT.split("public:");
    for (const key of ["supabaseServiceKey", "hermesApiKey", "cfApiToken"]) {
      expect(serverPart).toContain(key);
      expect(publicPart).not.toContain(key);
    }
  });

  it("CI memindai secret (gitleaks) + melaporkan dependency audit", () => {
    expect(CI).toContain("gitleaks/gitleaks-action");
    expect(CI).toContain("pnpm audit");
  });
});

describe("logging", () => {
  it("console.log dilarang (hanya warn/error)", () => {
    expect(ESLINT).toMatch(
      /"no-console":\s*\["error",\s*\{\s*allow:\s*\["warn",\s*"error"\]/,
    );
  });
});
