// vitest.config.ts — Config unit test: environment happy-dom (simulasi browser ringan).
// Pola test: co-located `**/__tests__/*.spec.ts` (sibling dgn source). Alias ~ / ~~ = root app/
// supaya import `~/common/...` dari source bisa di-resolve tanpa plugin Nuxt.
// Perintah: pnpm test (sekali) / pnpm test:watch / pnpm test:related.
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
