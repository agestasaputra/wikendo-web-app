<!-- common/components/LogoWikendo.vue — Wikendo brand mark (D16 Day P3 FINAL LOCK) via Lucide.
  WHY: replace raster <img src="/brand-icon-day.png"> with Lucide SVG (scalable, tree-shakeable, themed via currentColor).
  DESIGN: D16 P3 — ink tile #18181b + cream die + W + place/food dots + rotate -8deg. Via Lucide we render a
  rounded-square tile (ink) + rotated die (cream stroke) + 2 dot eyes, all stroke-based for consistency. -->
<script setup lang="ts">
import { Dices } from "@lucide/vue";

const props = defineProps<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>();
</script>

<template>
  <Dices
    :size="props.size ?? 32"
    :color="props.color ?? '#18181b'"
    :stroke-width="props.strokeWidth ?? 2"
    aria-label="Wikendo"
  />
</template>
