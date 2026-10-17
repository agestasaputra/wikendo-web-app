<!-- features/mall/components/TenantCard.vue → S2c Tenant Photo card (46px thumb + promo badge + rating/floor/halal).
WHAT: emoji thumb + color per category, name + floor, rose promo badge, ★ rating · floor · halal row.
WHY: split out of MallDetailPage so the page stays thin; render values from buildTenantView (pure, tested).
EXAMPLE: <TenantCard :tenant="t" /> -->
<script setup lang="ts">
import { computed } from "vue";
import type { TenantItem } from "~/features/mall/@types/mall";
import { buildTenantView } from "~/features/mall/utils/tenantCard";

const props = defineProps<{ tenant: TenantItem }>();
const view = computed(() => buildTenantView(props.tenant));
</script>

<template>
  <div
    class="border border-gray-100 rounded-2xl p-2.5 bg-white flex gap-2.5 items-center"
  >
    <div
      class="w-[46px] h-[46px] flex-none rounded-xl flex items-center justify-center text-[22px]"
      :style="{ background: view.bg, color: '#fff' }"
    >
      {{ view.emoji }}
    </div>
    <div class="text-[13px]">
      <b>{{ tenant.name }} {{ view.floor }}</b
      ><br />
      <span
        v-if="view.promo"
        class="inline-block text-white text-[10.5px] font-extrabold px-2 py-0.5 rounded-md my-0.5"
        :style="{ background: '#E11D48', color: '#fff' }"
        >{{ view.promo }}</span
      >
      <p class="text-xs text-gray-500">
        {{ view.rate }} ★ · {{ view.floor }} · {{ view.halal }}
      </p>
    </div>
  </div>
</template>
