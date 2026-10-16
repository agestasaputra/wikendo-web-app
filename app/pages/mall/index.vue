<!-- pages/mall/index.vue → GET /mall. Route TIPIS: logic ada di features/mall/MallListPage.vue.
APA: file-based routing Nuxt — nama file = URL; halaman hanya merender 1 komponen feature.
KENAPA: pages/ = routes only (tanpa business logic) supaya feature bisa diuji & dipindah. Lihat AGENTS.md.
Contoh: tambah halaman → buat features/<name>/<Name>Page.vue + file ini. -->
<script setup lang="ts">
import MallListPage from "~/features/mall/MallListPage.vue";
</script>

<template>
  <MallListPage />
</template>
