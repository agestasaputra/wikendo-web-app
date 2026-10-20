// nuxt.config.ts — Nuxt config: modules, runtimeConfig (secret vs public), SEO head.
// runtimeConfig.X (hermesApiKey, supabaseServiceKey) = SERVER ONLY, don't read from pages/.
// runtimeConfig.public.* (supabaseUrl, supabaseAnonKey, gaId) = safe to read from the browser.
// Values come from env (local .env / prod Vercel env). See .env.example.
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxtjs/tailwindcss", "@nuxt/eslint", "@pinia/nuxt"],
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
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Wikendo" },
        { property: "og:locale", content: "id_ID" },
        { property: "og:url", content: "https://www.wikendo.id/" },
        {
          property: "og:image",
          content: "https://www.wikendo.id/og-default.png",
        },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "Wikendo — Bingung Weekend Mau Kemana?",
        },
        {
          name: "twitter:description",
          content:
            "Quiz 30 detik → 5 rekomendasi weekend Jabodetabek. Gratis, tanpa ribet.",
        },
        {
          name: "twitter:image",
          content: "https://www.wikendo.id/og-default.png",
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

    "/forgot-password": { ssr: false },
    "/reset-password": { ssr: false },

    "/account": { ssr: false },
    "/food": { ssr: false },
    "/login": { ssr: false },
    "/register": { ssr: false },
    "/place": { ssr: false },
    "/result-place": { ssr: false },
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
