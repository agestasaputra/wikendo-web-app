// nuxt.config.ts — Nuxt config: modules, runtimeConfig (secret vs public), SEO head.
// runtimeConfig.X (hermesApiKey, supabaseServiceKey) = SERVER ONLY, don't read from pages/.
// runtimeConfig.public.* (supabaseUrl, supabaseAnonKey, gaId) = safe to read from the browser.
// Values come from env (local .env / prod Vercel env). See .env.example.
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxt/eslint",
    "@pinia/nuxt",
    (_options, nuxt): void => {
      // Nuxt 4.6 unconditionally registers vue-router/volar/sfc-route-blocks in
      // prepare:types, but that subpath only exists in vue-router >=5 (we use v4).
      // vue-tsc then fails to resolve it. We don't use <route> SFC blocks, so strip
      // the plugin from the generated tsconfig files before type-check runs.
      nuxt.hook("close", async () => {
        const fs = await import("node:fs/promises");
        const path = await import("node:path");
        const root = nuxt.options.rootDir;
        for (const name of [
          "tsconfig.app.json",
          "tsconfig.json",
          "tsconfig.shared.json",
          "tsconfig.server.json",
        ]) {
          const file = path.join(root, ".nuxt", name);
          try {
            const raw = await fs.readFile(file, "utf8");
            const json = JSON.parse(raw);
            const plugins = json?.vueCompilerOptions?.plugins;
            if (Array.isArray(plugins)) {
              json.vueCompilerOptions.plugins = plugins.filter((p) => {
                const n = typeof p === "string" ? p : p?.name;
                return !n || !String(n).includes("sfc-route-blocks");
              });
              await fs.writeFile(file, JSON.stringify(json, null, 2) + "\n");
            }
          } catch {
            // file may not exist for this target; ignore
          }
        }
      });
    },
  ],
  devtools: { enabled: true },
  app: {
    head: {
      title: "Wikendo — Bingung Weekend Mau Kemana?",
      htmlAttrs: { lang: "id" },
      meta: [
        {
          name: "description",
          content:
            "Quiz 30 detik → 5 rekomendasi weekend Jabodetabek. Quiz makan 20 detik → 5 tenant mall. Gratis, tanpa ribet.",
        },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
      link: [
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32.png",
        },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap",
        },
      ],
    },
  },
  // Hybrid rendering: ISR (60s) for public SEO pages, client-only (ssr:false) for personal/quiz
  // pages so navigation is instant. Old Indonesian URLs 301-redirect to the English ones
  // (back-compat + SEO). The ssr:false rules MUST use the new route names.
  routeRules: {
    "/": { isr: 60 },
    "/mall": { isr: 60 },
    "/mall/**": { isr: 60 },
    "/history": { ssr: false },
    "/account": { ssr: false },
    "/quiz": { ssr: false },
    "/food": { ssr: false },
    "/login": { ssr: false },
    "/register": { ssr: false },
    "/result": { ssr: false },
    "/result-food": { ssr: false },
    "/makan": { redirect: { to: "/food", statusCode: 301 } },
    "/result-makan": { redirect: { to: "/result-food", statusCode: 301 } },
    "/riwayat": { redirect: { to: "/history", statusCode: 301 } },
  },
  runtimeConfig: {
    hermesApiUrl: process.env.HERMES_API_URL || "http://127.0.0.1:20128",
    hermesApiKey: process.env.HERMES_API_KEY || "",
    cfAccountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
    cfApiToken: process.env.CLOUDFLARE_API_TOKEN || "",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || "",
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || "",
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || "",
      gaId: process.env.NUXT_PUBLIC_GA_ID || "",
    },
  },
  // There is no CSS nesting in this project (only Tailwind utilities in templates). The built-in
  // `tailwindcss/nesting` plugin is disabled: the Nuxt resolver can't resolve it under pnpm (warning B5010/B7007).
  postcss: { plugins: { "tailwindcss/nesting": false } },
  tailwindcss: {
    configPath: "tailwind.config",
  },
});
