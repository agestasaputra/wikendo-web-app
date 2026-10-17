// eslint.config.mjs — ESLint 10 (flat) config via withNuxt() + Prettier + Wikendo conventions.
// WHAT: Nuxt/Vue/TS preset + Prettier (format) + size limits + module boundaries + security rules.
// WHY: the conventions in ../AGENTS.md must be ENFORCED by the machine, not remembered. Same pattern as hub-chat
//   (size limits, feature boundary, security) but as a flat config (ESLint 8 .eslintrc is deprecated).
// Commands: pnpm lint (check, 0 warnings) / pnpm lint:fix (auto-fix). Details: ../AGENTS.md.
// https://eslint.nuxt.com/packages/module
import { readdirSync } from "node:fs";
import withNuxt from "./.nuxt/eslint.config.mjs";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

// Feature names are read from the features/ folder — no manual update needed when adding a feature.
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

// Features must not import each other (hub-chat: go through common/ or a shared store).
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
      // ── Size limits (same as hub-chat) ──
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
      "vue/no-v-html": "error", // use v-dompurify-html (plugins/dompurify-html.ts)
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-debugger": "error",
    },
  },
  {
    // Env vars in the client MUST go through useRuntimeConfig() (so secrets don't leak into the bundle).
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
    // common/ = shared code, no feature logic (hub-chat: Common → no feature-specific logic).
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
    // Other client layers that are not feature/common: still forbidden from importing server/.
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
    // Tests: long describe/it callbacks & fixtures are fine; the size limits do not apply.
    files: ["**/*.spec.ts", "test/**/*.ts"],
    rules: {
      "max-lines-per-function": "off",
      "max-lines": "off",
      "max-params": "off",
      complexity: "off",
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  // Prettier last: turn off conflicting format rules + surface format differences as errors.
  eslintPluginPrettierRecommended,
);
