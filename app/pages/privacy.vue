<!-- pages/privacy.vue → GET /privacy. Route TIPIS: konten di features/legal/LegalPage.vue.
APA: file-based routing Nuxt — halaman hanya merender 1 komponen feature.
KENAPA: syarat review Google OAuth + kepercayaan user sebelum share publik (Addendum 25).
Contoh: tambah halaman legal → buat features/legal/<Name>.vue + file ini. -->
<script setup lang="ts">
import LegalPage from "~/features/legal/LegalPage.vue";
</script>

<template>
  <LegalPage kind="privacy" />
</template>
