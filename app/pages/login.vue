<!-- pages/login.vue → GET /login. THIN route: logic lives in features/auth/LoginPage.vue.
WHAT: Nuxt file-based routing — file name = URL; the page only renders 1 feature component.
WHY: pages/ = routes only (no business logic) so a feature can be tested & moved. See AGENTS.md.
EXAMPLE: add a page → create features/<name>/<Name>Page.vue + this file. -->
<script setup lang="ts">
import LoginPage from "~/features/auth/LoginPage.vue";
</script>

<template>
  <LoginPage />
</template>
