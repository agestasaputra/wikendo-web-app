/**
 * plugins/gtag.client.ts — Google Analytics 4 (gtag.js), client-only.
 *
 * APA: inject <script> GA4 + init dataLayer HANYA kalau NUXT_PUBLIC_GA_ID terisi (guard no-op).
 * KENAPA: ukur funnel share sosmed → kunjungan → quiz. Tanpa GA = share terbang buta (nggak tau channel mana yang jalan).
 *   Client-only: hemat TTFB, tidak blok render; dev/preview tanpa gaId tidak kirim data apa pun.
 * Contoh: set NUXT_PUBLIC_GA_ID=G-XXXXXXXXXX di Vercel → Settings → Environment Variables → aktif otomatis.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export default defineNuxtPlugin(() => {
  const gaId = String(useRuntimeConfig().public.gaId || "");
  if (!gaId) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]): void {
    window.dataLayer?.push(args);
  };
  window.gtag("js", new Date());
  // page_view is sent per route by plugins/gtagPageView.client.ts (path only, SPA-aware);
  // leaving gtag's own initial page_view on would count the first page twice.
  window.gtag("config", gaId, { send_page_view: false });

  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  script.async = true;
  document.head.appendChild(script);
});
