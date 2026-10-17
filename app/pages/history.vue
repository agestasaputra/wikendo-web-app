<!-- pages/history.vue → GET /history. THIN route: logic lives in features/history/HistoryPage.vue.
WHAT: Nuxt file-based routing — file name = URL; the page only renders 1 feature component.
WHY: pages/ = routes only (no business logic) so a feature can be tested & moved. See AGENTS.md.
EXAMPLE: add a page → create features/<name>/<Name>Page.vue + this file. -->
<script setup lang="ts">
import HistoryPage from "~/features/history/HistoryPage.vue";
</script>

<template>
  <HistoryPage />
</template>
