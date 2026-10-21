<!-- common/components/FilterDrawer.vue → reusable bottom-sheet filter drawer (FD14 style).
WHAT: bottom sheet from bottom with grouped chips + sort pills + Reset/Terapkan footer.
WHY: satu komponen untuk MallList/MallDetail/History supaya UI konsisten (tiket.com style).
EXAMPLE: <FilterDrawer v-model:open="show" title="Filter" :groups="groups" :sort-options="sorts" :initial-filters="selected" :initial-sort="sort" @apply="onApply" /> -->
<script setup lang="ts">
import { ref, watch } from "vue";

interface Option {
  value: string;
  label: string;
}
interface Group {
  title: string;
  mode: "single" | "multi";
  options: Option[];
}

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    groups?: Group[];
    sortOptions?: Option[];
    initialFilters?: string[];
    initialSort?: string;
  }>(),
  {
    title: "Filter",
    groups: () => [],
    sortOptions: () => [],
    initialFilters: () => [],
    initialSort: "",
  },
);

const emit = defineEmits<{
  "update:open": [value: boolean];
  apply: [payload: { filters: string[]; sort: string }];
  reset: [];
}>();

const selectedFilters = ref<string[]>([]);
const selectedSort = ref<string>("");

function syncFromProps(): void {
  selectedFilters.value = [...(props.initialFilters || [])];
  selectedSort.value = props.initialSort || props.sortOptions?.[0]?.value || "";
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) syncFromProps();
  },
);

function close(): void {
  emit("update:open", false);
}

function toggleFilter(group: Group, value: string): void {
  const groupValues = new Set(group.options.map((o) => o.value));
  if (group.mode === "single") {
    // remove peers first
    selectedFilters.value = selectedFilters.value.filter(
      (v) => !groupValues.has(v) || v === value,
    );
    // toggle
    const idx = selectedFilters.value.indexOf(value);
    if (idx >= 0) selectedFilters.value.splice(idx, 1);
    else selectedFilters.value.push(value);
  } else {
    const idx = selectedFilters.value.indexOf(value);
    if (idx >= 0) selectedFilters.value.splice(idx, 1);
    else selectedFilters.value.push(value);
  }
}

function selectSort(value: string): void {
  selectedSort.value = value;
}

function doReset(): void {
  selectedFilters.value = [];
  selectedSort.value = props.sortOptions?.[0]?.value || "";
  emit("reset");
}

function doApply(): void {
  emit("apply", {
    filters: [...selectedFilters.value],
    sort: selectedSort.value,
  });
  close();
}

function isFilterSelected(value: string): boolean {
  return selectedFilters.value.includes(value);
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end justify-center"
      style="background: rgba(0, 0, 0, 0.35)"
      @click.self="close"
    >
      <div
        class="w-full max-w-md bg-white rounded-t-2xl px-4 pt-3 pb-4 shadow-2xl"
        style="max-height: 80vh; overflow-y: auto"
      >
        <div
          class="w-10 h-1 rounded-full mx-auto mb-2"
          style="background: #d4d4d8"
        />
        <div class="flex items-center justify-between mb-2">
          <b class="text-[15px]">{{ title }}</b>
          <button
            type="button"
            class="text-gray-400 font-bold text-lg leading-none"
            aria-label="Tutup"
            @click="close"
          >
            ✕
          </button>
        </div>

        <!-- Filter groups (chips) -->
        <div v-for="group in groups" :key="group.title" class="mb-3">
          <p class="text-[12px] font-extrabold mb-1.5">{{ group.title }}</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="opt in group.options"
              :key="opt.value"
              type="button"
              class="text-[11.5px] font-bold rounded-full px-3 py-1.5 border-[1.5px] whitespace-nowrap transition-colors"
              :style="
                isFilterSelected(opt.value)
                  ? 'background:#18181b;color:#fff;border-color:#18181b'
                  : 'background:#fff;border-color:#e4e4e7;color:#18181b'
              "
              @click="toggleFilter(group, opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- Sort options (pills) -->
        <div v-if="sortOptions && sortOptions.length" class="mb-3">
          <p class="text-[12px] font-extrabold mb-1.5">Urutkan</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="opt in sortOptions"
              :key="opt.value"
              type="button"
              class="text-[11.5px] font-bold rounded-full px-3 py-1.5 border-[1.5px] whitespace-nowrap transition-colors"
              :style="
                selectedSort === opt.value
                  ? 'background:#18181b;color:#fff;border-color:#18181b'
                  : 'background:#f4f4f5;border-color:#e4e4e7;color:#18181b'
              "
              @click="selectSort(opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex gap-2 mt-3">
          <button
            type="button"
            class="flex-1 text-[12px] font-extrabold rounded-xl py-2.5"
            style="background: #f4f4f5; color: #18181b"
            @click="doReset"
          >
            Reset
          </button>
          <button
            type="button"
            class="flex-1 text-[12px] font-extrabold rounded-xl py-2.5 text-white"
            style="background: #e11d48"
            @click="doApply"
          >
            Terapkan Filter
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
