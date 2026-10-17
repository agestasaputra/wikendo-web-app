import { describe, it, expect } from "vitest";
import { readSource, sourceExists } from "~/test/utils";

/**
 * security.spec.ts — Locks security controls enforced by configuration (not app code).
 * WHY: ESLint/CI rules are "fences"; if someone silently removes one, this test goes red.
 * Areas: secrets management, XSS/injection (OWASP A03), logging, supply chain.
 */
const ESLINT = readSource("eslint.config.mjs");
const NUXT = readSource("nuxt.config.ts");
const CI = readSource("../.github/workflows/ci.yml");

describe("XSS / injection", () => {
  it("v-html is banned + the official v-dompurify-html path is registered", () => {
    expect(ESLINT).toContain('"vue/no-v-html": "error"');
    expect(sourceExists("plugins/dompurify-html.ts")).toBe(true);
    expect(readSource("plugins/dompurify-html.ts")).toContain(
      "VueDOMPurifyHTML",
    );
  });

  it("eval / new Function are banned", () => {
    for (const rule of ["no-eval", "no-implied-eval", "no-new-func"]) {
      expect(ESLINT).toContain(`"${rule}": "error"`);
    }
  });
});

describe("secrets management", () => {
  it("client is banned from importing server/ + process.env is banned in the client", () => {
    expect(ESLINT).toContain("**/server/**");
    expect(ESLINT).toContain("no-restricted-properties");
    expect(ESLINT).toContain("useRuntimeConfig()");
  });

  it("secrets only in non-public runtimeConfig (outside the public block)", () => {
    const [serverPart = "", publicPart = ""] = NUXT.split("public:");
    for (const key of ["supabaseServiceKey", "hermesApiKey", "cfApiToken"]) {
      expect(serverPart).toContain(key);
      expect(publicPart).not.toContain(key);
    }
  });

  it("CI scans for secrets (gitleaks) + reports dependency audit", () => {
    expect(CI).toContain("gitleaks/gitleaks-action");
    expect(CI).toContain("pnpm audit");
  });
});

describe("logging", () => {
  it("console.log is banned (only warn/error)", () => {
    expect(ESLINT).toMatch(
      /"no-console":\s*\["error",\s*\{\s*allow:\s*\["warn",\s*"error"\]/,
    );
  });
});
