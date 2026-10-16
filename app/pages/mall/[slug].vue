<!-- pages/mall/[slug].vue → GET /mall/:slug. Route TIPIS: logic ada di features/mall/MallDetailPage.vue.
APA: file-based routing Nuxt — nama file = URL; halaman hanya merender 1 komponen feature.
KENAPA: pages/ = routes only (tanpa business logic) supaya feature bisa diuji & dipindah. Lihat AGENTS.md.
Contoh: tambah halaman → buat features/<name>/<Name>Page.vue + file ini. -->
<script setup lang="ts">
import MallDetailPage from "~/features/mall/MallDetailPage.vue";
</script>

<template>
  <MallDetailPage />
</template>
