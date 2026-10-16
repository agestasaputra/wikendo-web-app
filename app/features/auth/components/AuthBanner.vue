<!-- features/auth/components/AuthBanner.vue → Banner hitam hero auth (ink #0C0A09 + strip ember #EA580C + angka lime #D9F99D 17px).
APA: judul kecil 10px + angka besar 17px + baris penutup; slot default untuk elemen tambahan.
KENAPA: login/register/check-email memakai banner 1:1 (L1/R1 EMBER HERO, token lock v9) → 1 komponen.
Contoh: <AuthBanner title="DAFTAR GRATIS" value="2 • 5" footer="quota full + voucher 🎟️" /> -->
<script setup lang="ts">
defineProps<{ title: string; value: string; footer: string }>();
</script>

<template>
  <div
    class="p-2 text-white mt-4"
    style="
      background: #0c0a09;
      border-left: 4px solid #ea580c;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 800;
    "
  >
    {{ title }}
    <div
      style="color: #d9f99d; font-size: 17px; font-weight: 800; margin: 2px 0"
    >
      {{ value }}
    </div>
    {{ footer }}
    <slot />
  </div>
</template>
