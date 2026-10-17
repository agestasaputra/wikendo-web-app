// vitest.config.ts — Unit test config: happy-dom environment (lightweight browser simulation).
// Test pattern: co-located `**/__tests__/*.spec.ts` (sibling of the source). Alias ~ / ~~ = app/ root
// so that `~/common/...` imports from source can be resolved without the Nuxt plugin.
// Commands: pnpm test (once) / pnpm test:watch / pnpm test:related.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url)).replace(/\/$/, "");

export default defineConfig({
  resolve: { alias: { "~": root, "~~": root } },
  test: {
    environment: "happy-dom",
    include: ["**/*.spec.ts"],
    exclude: ["node_modules/**", ".nuxt/**", ".output/**", "dist/**"],
  },
});
