/**
 * plugins/gtagPageView.client.ts — GA4 page_view for EVERY page, including SPA navigations.
 *
 * WHAT: after each page finishes rendering, send page_view (path + title) via trackGaPageView.
 * WHY a separate plugin: gtag.client.ts loads GA; this one only reports navigation (1 job each).
 * WHY page:finish + a 0ms defer: the hook fires when the page has rendered, but unhead writes
 *   the new <title> to the DOM slightly later — reading it synchronously reports the PREVIOUS
 *   page's title. The path is captured first so a quick second navigation cannot mislabel it.
 * NOTE: turn OFF "Page changes based on browser history events" in the GA4 stream's Enhanced
 *   measurement, otherwise every navigation is counted twice.
 * EXAMPLE: /place → /result-place → two page_view events, in order.
 */
import { trackGaPageView } from "~/common/composables/useGaAnalytics";

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter();
  nuxtApp.hook("page:finish", () => {
    const path = router.currentRoute.value.path;
    setTimeout(() => trackGaPageView(path, document.title), 0);
  });
});
