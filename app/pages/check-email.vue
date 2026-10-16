<!-- pages/check-email.vue → GET /check-email. Route TIPIS: logic ada di features/auth/CheckEmailPage.vue.
APA: file-based routing Nuxt — nama file = URL; halaman hanya merender 1 komponen feature.
KENAPA: pages/ = routes only (tanpa business logic) supaya feature bisa diuji & dipindah. Lihat AGENTS.md.
Contoh: tambah halaman → buat features/<name>/<Name>Page.vue + file ini. -->
<script setup lang="ts">
import CheckEmailPage from "~/features/auth/CheckEmailPage.vue";
</script>

<template>
  <CheckEmailPage />
</template>
