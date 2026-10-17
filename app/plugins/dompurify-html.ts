/**
 * plugins/dompurify-html.ts — `v-dompurify-html` directive (HTML sanitization, anti-XSS).
 *
 * WHAT: registers vue-dompurify-html on the Vue app.
 * WHY: `v-html` is FORBIDDEN (ESLint vue/no-v-html = error). If you truly need to render dynamic
 *   HTML, use `v-dompurify-html` so the input is sanitized (OWASP A03 Injection/XSS).
 * EXAMPLE: <div v-dompurify-html="htmlDariApi" />
 */
import VueDOMPurifyHTML from "vue-dompurify-html";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueDOMPurifyHTML);
});
