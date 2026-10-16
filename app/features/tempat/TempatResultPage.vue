<!-- features/tempat/TempatResultPage.vue → GET /result (Result TEMPAT deck, R3b Photo + Lime 1:1 screenshot).
APA: header Hasil + 5 rekomendasi + hero photo + badge BEST lime + strip ember + Navigasi ink/Simpan/Share + chips + rank #1-3 + quota note. Base paper #F5F5F4, kartu 24px.
KENAPA R3b 1:1: lime=nilai (best/rating) + ember=strip + ink=aksi (footnote spec), token lock via getResultTempatMeta (1 sumber, tested). Lock Split: TEMPAT saja, 0 tenant. Simpan = login wall momen #2.
Contoh: hero Rooftop Senayan — Senayan 4.8 sunset+live music → Navigasi → chips Lainnya geser deck 1→5 tanpa fetch ulang. -->
<script setup lang="ts">
import AppLoader from "~/common/components/AppLoader.vue";
import ResultError from "~/common/components/ResultError.vue";
import { useHistoryStore } from "~/common/store/HistoryStore";
import type { TempatRecommendation } from "~/common/types/api";
import {
  buildTempatHero,
  buildTempatMapsUrl,
} from "~/features/tempat/utils/resultHero";
import { getResultTempatMeta } from "~/features/tempat/utils/resultMeta";
import { getErrorMessage, getErrorStatus } from "~/utils/error";

interface TempatResponse {
  recommendations: TempatRecommendation[];
  quota_remaining?: number;
}

const route = useRoute();
const { data, pending, error, refresh } = await useFetch<TempatResponse>(
  "/api/tempat/recommend",
  { method: "POST", body: route.query },
);
const list = computed(() => data.value?.recommendations || []);
const idx = ref(0);
const wallNote = ref(false);
const errorMessage = computed(() =>
  getErrorMessage(error.value, "Gagal generate."),
);
const isWall = computed(
  () =>
    /login/i.test(errorMessage.value) || getErrorStatus(error.value) === 403,
);
// Quota real: sisa dari response POST (quota_remaining). Anon limit tempat 1x → sukses = 0/1 (habis hari ini, jujur).
const quotaLeft = computed(() => data.value?.quota_remaining);
const quotaLabel = computed(() =>
  isWall.value ? "1/1 habis 🔒" : (quotaLeft.value ?? 1) + "/1",
);
// R3b token lock (tested): strip ember + best lime + aksi ink + Lainnya ink/lime.
const meta = getResultTempatMeta();
const hero = computed(() => buildTempatHero(list.value[idx.value], idx.value));
const minis = computed(() =>
  list.value.slice(1, 3).map((r) => (r.name || "").slice(0, 6).trim() + "..."),
);
const rankTop3 = computed(() => list.value.slice(0, 3));
const mapsUrl = computed(() => buildTempatMapsUrl(hero.value.name));

function next(): void {
  if (list.value.length) idx.value = (idx.value + 1) % list.value.length;
}

function share(): void {
  const t = hero.value.name + " via Wikendo";
  if (navigator.share) {
    navigator.share({ title: t, text: t, url: location.href }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(location.href);
    wallNote.value = true;
  }
}

// E1 riwayat: tulis 1 entry pas data sukses (store: guard window + cap 20 + dedupe).
function pushHistory(): void {
  const r = list.value[0];
  if (!r) return;
  useHistoryStore().push({
    kind: "tempat",
    title: r.name || "—",
    sub: r.location_area || r.category || "",
    at: Date.now(),
  });
}
watch(
  () => list.value.length,
  (n) => {
    if (n) pushHistory();
  },
);
</script>

<template>
  <div class="max-w-md mx-auto px-4 pb-10" :style="{ background: meta.pageBg }">
    <div class="flex justify-between items-center font-bold text-[13px] py-3">
      <NuxtLink to="/" class="font-extrabold">← Hasil 🎉/📍</NuxtLink>
      <span class="text-gray-500">{{ list.length || 5 }} rekomendasi</span>
    </div>
    <p class="text-[11.5px] text-gray-500 -mt-1 mb-2">
      Quota tempat {{ quotaLabel }}
    </p>

    <AppLoader v-if="pending" variant="tempat" />
    <ResultError
      v-else-if="error"
      :is-wall="isWall"
      :message="errorMessage"
      :pending="pending"
      wall-text="🔒 Quota anon habis (1x/hari). Login 10 detik → quota jadi 2x/hari, gratis."
      @retry="refresh()"
    />
    <div v-else-if="list.length" class="flex flex-col">
      <!-- R3b hero deck: strip ember kiri + foto + badge BEST lime -->
      <div
        class="overflow-hidden shadow-lg relative"
        style="border-radius: 24px; border: 1px solid #eee"
        :style="{ background: meta.cardBg }"
      >
        <div
          class="absolute left-0 top-0 bottom-0 w-[5px]"
          :style="{ background: meta.strip }"
        />
        <div
          class="h-[150px] flex items-center justify-center text-[56px] relative"
          :style="'background:' + hero.bg"
        >
          <span>{{ hero.emoji }}</span>
          <span
            class="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-extrabold px-3 py-1 rounded-full whitespace-nowrap"
            :style="{ background: meta.bestBg, color: meta.bestColor }"
            >★ #1 BEST · {{ hero.areaLabel }} · {{ hero.rating }} ★</span
          >
        </div>
        <div class="p-[14px_16px]">
          <span
            class="inline-block text-[11px] font-extrabold px-2.5 py-1 rounded-full mr-1.5 mb-2"
            :style="{ background: meta.bestBg, color: meta.bestColor }"
            >★ #{{ idx + 1 }}{{ idx === 0 ? " BEST" : "" }}</span
          >
          <span
            class="inline-block text-[11px] font-extrabold px-2.5 py-1 rounded-full mb-2"
            style="background: #ecfeff; color: #0e7490"
            >⭐ {{ hero.rating }} · {{ hero.vibe }}</span
          >
          <div class="font-extrabold text-[17px]">
            {{ hero.name }} — {{ hero.area }}
          </div>
          <p class="text-[12.5px] text-gray-600 my-1.5">
            Kenapa cocok: {{ hero.reason }}
          </p>
          <p class="text-[12.5px]">
            💰 {{ hero.cost }} · 📍 {{ hero.area }} · ⏰ best {{ hero.time }}
          </p>
          <div class="flex gap-2.5 mt-3">
            <a
              :href="mapsUrl"
              target="_blank"
              class="flex-1 text-center text-white p-[15px] rounded-2xl font-extrabold text-sm"
              :style="{
                background: meta.actionBg,
                color: meta.actionColor,
                minHeight: '56px',
              }"
              >📍 Navigasi →</a
            >
            <button
              class="flex-1 p-[15px] rounded-2xl font-extrabold text-sm bg-white border-2 border-gray-200"
              title="Login untuk simpan (momen #2)"
              @click="wallNote = true"
            >
              💾
            </button>
            <button
              class="flex-1 p-[15px] rounded-2xl font-extrabold text-sm bg-white border-2 border-gray-200"
              @click="share()"
            >
              ⤴
            </button>
          </div>
          <p
            v-if="wallNote"
            class="text-xs text-center mt-2"
            style="color: #c2410c"
          >
            🔒 Login 10 detik untuk simpan — quota reset tiap hari, gratis.
          </p>
        </div>
      </div>
      <!-- chips: 2 preview + Lainnya aktif ink/lime -->
      <div class="flex gap-2 mt-3">
        <div
          v-for="(r, i) in minis"
          :key="i"
          class="flex-1 bg-white border border-gray-200 rounded-[14px] p-2.5 text-center text-xs font-bold text-gray-600 truncate"
        >
          {{ r }}
        </div>
        <div
          class="flex-1 rounded-[14px] p-2.5 text-center text-xs font-extrabold cursor-pointer"
          :style="{ background: meta.moreBg, color: meta.moreColor }"
          @click="next()"
        >
          Lainnya →
        </div>
      </div>
      <p class="text-xs text-gray-500 mt-2.5 text-center">
        Kartu {{ idx + 1 }}/{{ list.length }} · generate ulang = quota habis ·
        <u>lihat semua ↓</u>
      </p>
      <!-- rank #1-3 abu + full list -->
      <div
        class="flex flex-col gap-2 mt-3 rounded-2xl p-3"
        style="background: #f4f4f5"
      >
        <div
          v-for="(r, i) in rankTop3"
          :key="'t' + i"
          class="text-[12.5px] leading-snug"
        >
          <b>#{{ i + 1 }} {{ r.name }}</b
          ><br />
          <span class="text-gray-500"
            >{{ r.category }} · {{ r.location_area }} · {{ r.reason }}</span
          >
        </div>
      </div>
      <p class="text-[11px] text-gray-400 text-center mt-2">
        Lime = nilai (best/rating) · ember = strip · ink = aksi
      </p>
      <div class="flex flex-col gap-2 mt-3">
        <div
          v-for="(r, i) in list"
          :key="i"
          class="bg-white rounded-2xl border p-4 text-sm"
        >
          <b>#{{ i + 1 }} {{ r.name }}</b>
          <span class="text-gray-500"
            >[{{ r.category }} · {{ r.location_area }}]</span
          >
          <p class="text-gray-600 text-[13px] mt-1">
            💡 {{ r.reason }} · 💰 {{ r.estimated_cost }} · ⏰
            {{ r.best_time }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
