<!-- common/components/FilterDrawer.vue → reusable bottom-sheet filter drawer (FD14).
WHAT: bottom sheet naik dari bawah: handle, judul, grup chip (Preferensi / Budget / Mission / Kota / Jenis),
  pill Urutkan, footer Reset + "Terapkan Filter" rose (#E11D48).
WHY: FD14 dipilih Agesta (chip dikelompokkan + apply rose) → SATU komponen untuk Mall List, Mall Detail, History
  supaya kontrol filter konsisten, bukan 3 implementasi berbeda.
NILAI FILTER: string ber-namespace `grup:nilai` (contoh `halal:true`, `mission:family`, `kind:food`, `range:7d`).
  Halaman mem-parsing lewat util murni masing-masing → drawer tetap generik (tanpa tahu domain mall/history).
EXAMPLE: <FilterDrawer v-model:open="showFilter" :groups="FILTER_GROUPS" :sort-options="SORT_OPTIONS"
  :initial-filters="activeFilters" :initial-sort="sortOption" @apply="onApply" @reset="onReset" /> -->
<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";

// --- Z-index drawer = 60 (di atas bottom nav z-50) agar bottom nav tidak menutupi backdrop.

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

// Setiap drawer dibuka = salinan dari state halaman (batal/tutup tidak mengubah hasil).
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) syncFromProps();
  },
);

function close(): void {
  emit("update:open", false);
}

/**
 * Toggle 1 chip. `single` = maksimal 1 nilai per grup (klik chip yang sama = matikan).
 * KENAPA buang nilai grup dulu baru push: tanpa itu klik "50-100rb" saat "Budget" nyala
 * menyisakan 2 budget sekaligus → query server dapat 2 nilai yang saling bertentangan.
 */
function toggleFilter(group: Group, value: string): void {
  const groupValues = group.options.map((o) => o.value);
  const isOn = selectedFilters.value.includes(value);
  if (group.mode === "single") {
    selectedFilters.value = selectedFilters.value.filter(
      (v) => !groupValues.includes(v),
    );
    if (!isOn) selectedFilters.value.push(value);
    return;
  }
  if (isOn)
    selectedFilters.value = selectedFilters.value.filter((v) => v !== value);
  else selectedFilters.value.push(value);
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

// --- Body scroll lock + ESC: drawer 82vh tanpa ini bikin halaman di belakang ikut ke-scroll.
let prevOverflow = "";
function lockBody(): void {
  if (typeof document === "undefined") return;
  prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
}
function unlockBody(): void {
  if (typeof document === "undefined") return;
  document.body.style.overflow = prevOverflow;
}
function onKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape" && props.open) close();
}
function isFilterSelected(value: string): boolean {
  return selectedFilters.value.includes(value);
}
watch(
  () => props.open,
  (isOpen) => {
    if (typeof document === "undefined") return;
    if (isOpen) {
      lockBody();
      document.addEventListener("keydown", onKeydown);
    } else {
      unlockBody();
      document.removeEventListener("keydown", onKeydown);
    }
  },
);
onBeforeUnmount(() => {
  unlockBody();
  if (typeof document !== "undefined")
    document.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[60] flex items-end justify-center"
      style="background: rgba(0, 0, 0, 0.35)"
      data-testid="filter-drawer"
      @click.self="close"
    >
      <div
        class="w-full max-w-md bg-white rounded-t-2xl px-4 pt-3 pb-4 shadow-2xl"
        style="max-height: 82vh; overflow-y: auto"
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
