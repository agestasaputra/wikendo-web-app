<!-- pages/place.vue → GET /place. THIN route: logic lives in features/place/PlaceQuizPage.vue.
WHAT: Nuxt file-based routing — file name = URL; the page only renders 1 feature component.
WHY: /place (not /quiz) because the URL must name WHICH quiz — place vs food. New quizzes
  (e.g. /event) follow the same pattern, so /quiz stays free for a future quiz-picker hub.
  The legacy /quiz URL 301-redirects here (server/middleware/legacyRouteRedirect.ts).
EXAMPLE: add a page → create features/<name>/<Name>Page.vue + this file. -->
<script setup lang="ts">
import PlaceQuizPage from "~/features/place/PlaceQuizPage.vue";
</script>

<template>
  <PlaceQuizPage />
</template>
