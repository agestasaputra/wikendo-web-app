<!-- features/mall/components/PromoStrip.vue → V13C promo strip on the mall page (Addendum 23 v1.1), NOT a new route.
WHAT: "Promo hari ini di {mall} (N)" section — tenants that HAVE a real promo badge, each row links to /food?mall=slug.
WHY: above the tenant list, below the count pill — users see promos first before scrolling the directory. Real data, not a fake all -20%.
EXAMPLE: <PromoStrip :tenants="promoStrip" :slug="slug" :mall-short="mallShort" /> -->
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
      :to="`/food?mall=${slug}`"
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
