// nuxt.config.ts — Konfigurasi Nuxt: modules, runtimeConfig (secret vs public), SEO head.
// runtimeConfig.X (hermesApiKey, supabaseServiceKey) = SERVER ONLY, jangan dibaca dari pages/.
// runtimeConfig.public.* (supabaseUrl, supabaseAnonKey, gaId) = boleh dibaca browser.
// Nilai diambil dari env (.env lokal / Vercel env prod). Lihat .env.example.
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
  tailwindcss: {
    configPath: "tailwind.config",
  },
});
