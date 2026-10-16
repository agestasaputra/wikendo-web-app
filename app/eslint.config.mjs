// eslint.config.mjs — Config ESLint 10 (flat) via withNuxt() + Prettier + konvensi Wikendo.
// APA: preset Nuxt/Vue/TS + Prettier (format) + batas ukuran + batas modul + aturan security.
// KENAPA: konvensi di ../AGENTS.md harus DIPAKSA mesin, bukan diingat. Pola sama dgn hub-chat
//   (batas ukuran, feature boundary, security) tapi flat config (ESLint 8 .eslintrc sudah usang).
// Perintah: pnpm lint (cek, 0 warning) / pnpm lint:fix (auto-fix). Detail: ../AGENTS.md.
// https://eslint.nuxt.com/packages/module
import { readdirSync } from "node:fs";
import withNuxt from "./.nuxt/eslint.config.mjs";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

// Nama feature dibaca dari folder features/ — tidak perlu update manual saat tambah feature.
const FEATURE_NAMES = readdirSync("features", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const CLIENT_FILES = [
  "app.vue",
  "pages/**/*.vue",
  "layouts/**/*.vue",
  "features/**/*.{ts,vue}",
  "common/**/*.{ts,vue}",
  "utils/**/*.ts",
];

// Antar feature dilarang saling import (hub-chat: lewat common/ atau store bersama).
const featureBoundaryOverrides = FEATURE_NAMES.map((feature) => ({
  files: [`features/${feature}/**/*.ts`, `features/${feature}/**/*.vue`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          ...FEATURE_NAMES.filter((other) => other !== feature).map(
            (other) => ({
              group: [`~/features/${other}`, `~/features/${other}/**`],
              message: `Cross-feature import: '${feature}' tidak boleh import 'features/${other}'. Pakai common/ (components, store, utils).`,
            }),
          ),
          {
            group: ["**/server/**", "~~/server/**", "#server/**"],
            message:
              "Kode browser tidak boleh import dari server/ (secrets management). Lewat $fetch ke /api/*.",
          },
        ],
      },
    ],
  },
}));

export default withNuxt(
  {
    rules: {
      // ── Batas ukuran (sama dgn hub-chat) ──
      complexity: ["error", 10],
      "max-depth": ["error", 3],
      "max-lines-per-function": ["error", { max: 50 }],
      "max-params": ["error", 3],
      "max-classes-per-file": ["error", 1],
      "max-lines": [
        "error",
        { max: 500, skipBlankLines: true, skipComments: true },
      ],
      "no-param-reassign": "error",

      // ── TypeScript ──
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-explicit-any": "error",

      // ── Vue ──
      "vue/component-api-style": ["error", ["script-setup"]],
      "vue/block-lang": ["error", { script: { lang: "ts" } }],
      "vue/block-order": ["error", { order: ["script", "template", "style"] }],
      "vue/define-macros-order": [
        "error",
        {
          order: ["defineOptions", "defineProps", "defineEmits", "defineSlots"],
        },
      ],

      // ── Security (OWASP: injection / XSS / secrets) ──
      "vue/no-v-html": "error", // pakai v-dompurify-html (plugins/dompurify-html.ts)
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-debugger": "error",
    },
  },
  {
    // Env var di client wajib lewat useRuntimeConfig() (secret tidak bocor ke bundle).
    files: CLIENT_FILES,
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message:
            "Pakai useRuntimeConfig() — jangan baca process.env di kode client.",
        },
      ],
    },
  },
  {
    // common/ = kode bersama, tanpa logika feature (hub-chat: Common → no feature-specific logic).
    files: ["common/**/*.{ts,vue}", "utils/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["~/features/**", "../features/**", "../../features/**"],
              message: "common/ & utils/ tidak boleh import dari features/.",
            },
            {
              group: ["**/server/**", "~~/server/**", "#server/**"],
              message: "Kode browser tidak boleh import dari server/.",
            },
          ],
        },
      ],
    },
  },
  ...featureBoundaryOverrides,
  {
    // Layer client lain yg bukan feature/common: tetap dilarang import server/.
    files: ["app.vue", "pages/**/*.vue", "layouts/**/*.vue"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/server/**", "~~/server/**", "#server/**"],
              message: "Kode browser tidak boleh import dari server/.",
            },
          ],
        },
      ],
    },
  },
  {
    // Test: describe/it callback panjang & fixture wajar; batas ukuran tidak berlaku.
    files: ["**/*.spec.ts", "test/**/*.ts"],
    rules: {
      "max-lines-per-function": "off",
      "max-lines": "off",
      "max-params": "off",
      complexity: "off",
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  // Prettier terakhir: matikan rule format yg bentrok + tampilkan selisih format sebagai error.
  eslintPluginPrettierRecommended,
);
