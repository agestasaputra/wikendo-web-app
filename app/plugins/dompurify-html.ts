/**
 * plugins/dompurify-html.ts — Direktif `v-dompurify-html` (sanitasi HTML, anti-XSS).
 *
 * APA: registrasi vue-dompurify-html ke Vue app.
 * KENAPA: `v-html` DILARANG (ESLint vue/no-v-html = error). Kalau benar-benar butuh render HTML
 *   dinamis, pakai `v-dompurify-html` supaya input disanitasi (OWASP A03 Injection/XSS).
 * Contoh: <div v-dompurify-html="htmlDariApi" />
 */
import VueDOMPurifyHTML from "vue-dompurify-html";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueDOMPurifyHTML);
});
