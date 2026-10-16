// eslint.config.mjs — Config ESLint 10 via withNuxt() (@nuxt/eslint) + konvensi Wikendo.
// APA: preset Nuxt/Vue/TS + Stylistic (diatur di nuxt.config.ts → eslint.config.stylistic) + aturan di bawah.
// KENAPA: konvensi di AGENTS.md Bab 5 harus DIPAKSA mesin, bukan diingat. Detail: AGENTS.md Bab 11.
// Perintah: pnpm lint (cek) / pnpm lint:fix (auto-fix).
// https://eslint.nuxt.com/packages/module
import withNuxt from './.nuxt/eslint.config.mjs'

// Secret hanya di server (AGENTS.md Bab 5 #3): kode browser dilarang import dari server/.
const NO_SERVER_IMPORT = {
  patterns: [{
    group: ['**/server/**', '~~/server/**', '#server/**'],
    message: 'Kode browser tidak boleh import dari server/ (secret management). Lewat $fetch ke /api/*.'
  }]
}

export default withNuxt(
  {
    rules: {
      // Tailwind = banyak atribut/baris; auto-wrap 1 atribut/baris bikin template membengkak.
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',

      // Vue: 1 gaya komponen, urutan blok & macro tetap.
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/block-lang': ['error', { script: { lang: 'ts' } }],
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'vue/define-macros-order': ['error', { order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots'] }],

      // TypeScript: tanpa any (pakai unknown + narrowing).
      '@typescript-eslint/no-explicit-any': 'error',

      // Format: lebar baris 120, warn saja (string/template/URL/regex dikecualikan).
      '@stylistic/max-len': ['warn', {
        code: 120,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
        ignoreComments: true
      }]
    }
  },
  {
    // Penamaan: camelCase / UPPER_SNAKE (const) / PascalCase; type & interface PascalCase.
    // Properti & hasil destructuring dibebaskan karena JSON API/DB pakai snake_case (claim_code, mall_slug).
    // Hanya ts/vue: rule ini butuh parser TypeScript (error di file .mjs).
    files: ['**/*.ts', '**/*.vue'],
    rules: {
      '@typescript-eslint/naming-convention': ['error',
        { selector: 'variable', modifiers: ['destructured'], format: null },
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'], leadingUnderscore: 'allow' },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'typeLike', format: ['PascalCase'] }
      ]
    }
  },
  {
    // Batas client/server: pages, components, composables, app.vue.
    files: ['app.vue', 'pages/**/*.vue', 'components/**/*.vue', 'composables/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', NO_SERVER_IMPORT] }
  },
  {
    // Test boleh longgar soal panjang baris (fixture/assert panjang).
    files: ['tests/**/*.ts'],
    rules: { '@stylistic/max-len': 'off' }
  }
)
