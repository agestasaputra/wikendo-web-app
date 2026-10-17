<!-- pages/index.vue → GET /. THIN route: logic lives in features/home/HomePage.vue.
WHAT: Nuxt file-based routing — file name = URL; the page only renders 1 feature component.
WHY: pages/ = routes only (no business logic) so a feature can be tested & moved. See AGENTS.md.
EXAMPLE: add a page → create features/<name>/<Name>Page.vue + this file. -->
<script setup lang="ts">
import HomePage from "~/features/home/HomePage.vue";
</script>

<template>
  <HomePage />
</template>
