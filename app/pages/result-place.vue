<!-- pages/result-place.vue → GET /result-place. THIN route: logic lives in features/place/PlaceResultPage.vue.
WHAT: Nuxt file-based routing — file name = URL; the page only renders 1 feature component.
WHY: symmetric with /result-food — the result URL names the quiz it belongs to. The legacy
  /result URL 301-redirects here, query string intact (server/middleware/legacyRouteRedirect.ts).
EXAMPLE: add a page → create features/<name>/<Name>Page.vue + this file. -->
<script setup lang="ts">
import PlaceResultPage from "~/features/place/PlaceResultPage.vue";
</script>

<template>
  <PlaceResultPage />
</template>
