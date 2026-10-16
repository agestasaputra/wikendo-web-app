<!-- features/mall/components/PromoStrip.vue → Strip promo V13C di halaman mall (Addendum 23 v1.1), BUKAN route baru.
APA: section "Promo hari ini di {mall} (N)" — tenant yang ADA badge promo real, tiap row link ke /makan?mall=slug.
KENAPA: di atas list tenant, di bawah pill count — user lihat promo dulu baru scroll direktori. Data real, bukan fake all -20%.
Contoh: <PromoStrip :tenants="promoStrip" :slug="slug" :mall-short="mallShort" /> -->
<script setup lang="ts">
import type { TenantItem } from "~/features/mall/@types/mall";
import { buildTenantView } from "~/features/mall/utils/tenantCard";

defineProps<{ tenants: TenantItem[]; slug: string; mallShort: string }>();
</script>

<template>
  <div class="rounded-2xl p-3 mt-3 bg-white border border-gray-100">
    <p class="font-extrabold text-[13px]">
      🔥 Promo hari ini di {{ mallShort }} ({{ tenants.length }})
    </p>
    <p class="text-[11px] font-bold text-gray-500 mb-1">
      Weekday filler · s/d 23:59 · tap → tenant
    </p>
    <NuxtLink
      v-for="t in tenants"
      :key="'promo-' + t.name"
      :to="`/makan?mall=${slug}`"
      class="flex gap-2 items-center border-t border-gray-100 py-2"
    >
      <div
        class="w-[30px] h-[30px] flex-none rounded-[9px] flex items-center justify-center text-[15px]"
        :style="{ background: buildTenantView(t).bg, color: '#fff' }"
      >
        {{ buildTenantView(t).emoji }}
      </div>
      <div class="flex-1 text-[12px]">
        <b>{{ t.name }} {{ buildTenantView(t).promo }}</b
        ><br /><small class="text-gray-500 font-bold"
          >{{ buildTenantView(t).floor }} ·
          {{ buildTenantView(t).halal }}</small
        >
      </div>
      <span class="text-[12px] font-extrabold underline">Lihat →</span>
    </NuxtLink>
  </div>
</template>
