<!-- pages/register.vue → GET /register. THIN route: logic lives in features/auth/RegisterPage.vue.
WHAT: Nuxt file-based routing — file name = URL; the page only renders 1 feature component.
WHY: pages/ = routes only (no business logic) so a feature can be tested & moved. See AGENTS.md.
EXAMPLE: add a page → create features/<name>/<Name>Page.vue + this file. -->
<script setup lang="ts">
import RegisterPage from "~/features/auth/RegisterPage.vue";
</script>

<template>
  <RegisterPage />
</template>
