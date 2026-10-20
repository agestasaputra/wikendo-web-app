<!-- features/place/PlaceResultPage.vue → GET /result-place (PLACE result deck, R3b Photo + Lime 1:1 screenshot).
WHAT: header Hasil + 5 recommendations + hero photo + BEST lime badge + ember strip + Navigate ink/Save/Share + chips + rank #1-3 + quota note. Base paper #F5F5F4, 24px cards.
WHY R3b 1:1: lime=value (best/rating) + ember=strip + ink=action (footnote spec), token lock via getResultPlaceMeta (1 source, tested). Lock Split: PLACE only, 0 tenant. Save = login wall moment #2.
EXAMPLE: hero Rooftop Senayan — Senayan 4.8 sunset+live music → Navigate → Lainnya chips shift the deck 1→5 without refetching. -->
<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useAuthFetch } from "~/common/composables/useAuthFetch";
import ResultError from "~/common/components/ResultError.vue";
import { useHistoryStore } from "~/common/store/HistoryStore";
import type { PlaceRecommendation } from "~/common/types/api";
import {
  buildPlaceHero,
  buildPlaceMapsUrl,
} from "~/features/place/utils/resultHero";
import { getResultPlaceMeta } from "~/features/place/utils/resultMeta";
import { buildResultUrl, parseResultId } from "~/common/utils/resultUrl";
import { getErrorMessage, getErrorStatus } from "~/utils/error";

interface PlaceResponse {
  id?: string;
  recommendations: PlaceRecommendation[];
  quota_remaining?: number;
}

const route = useRoute();
const router = useRouter();
// Bearer token REQUIRED: the Supabase session lives in localStorage (no auth cookie), so a plain
// useFetch reaches the server anonymously → row saved with user_id NULL. authFetch fixes attribution.
const authFetch = useAuthFetch();
// TWO modes, one page:
//   `?id=<uuid>` → open a STORED result: GET only (0 quota, 0 LLM). Refresh / back / bookmark / share.
//   no id        → a FRESH quiz submission: POST once, then the URL is replaced by its new id.
// WHY: the query string used to BE the quiz state, so every refresh re-generated the deck and
// burned a quota slot (anon users hit the login wall). A result now has an identity.
// Snapshot the quiz answers ONCE: after `router.replace(?id=…)` the live query no longer carries
// them, but the request body and the mall label still need them for this render.
const quizQuery = { ...route.query };
const storedId = parseResultId(quizQuery);
const generatedId = ref("");
const isStored = computed(() => Boolean(storedId));
// The key MUST be unique per SUBMISSION: a stable `fresh` key would replay the previous deck from
// Nuxt's payload cache on a second quiz (no POST → the user sees an old result).
const submissionKey = storedId || `fresh:${Date.now()}`;
const { data, pending, error, refresh } = await useAsyncData<PlaceResponse>(
  `place-result:${submissionKey}`,
  async () => {
    if (storedId) {
      return await authFetch<PlaceResponse>(`/api/result/${storedId}`);
    }
    const fresh = await authFetch<PlaceResponse>("/api/place/recommend", {
      method: "POST",
      body: quizQuery,
    });
    if (fresh.id) {
      generatedId.value = fresh.id;
      // Swap answers → id without a reload: the address bar stops carrying personal answers.
      void router.replace(buildResultUrl("place", fresh.id));
    }
    return fresh;
  },
);
const list = computed(() => data.value?.recommendations || []);
const idx = ref(0);
const wallNote = ref(false);
// Share feedback is a separate line: reusing wallNote told the user "login to save" right after
// they shared, which is a different action with a different next step.
const shareNote = ref(false);
const errorMessage = computed(() =>
  getErrorMessage(error.value, "Gagal generate."),
);
// isWall: server says LOGIN_REQUIRED (anonymous wall) → true. A logged-in user whose quota reset
// tomorrow also gets 403 QUOTA_EXCEEDED — must NOT be treated as a login wall.
const isWall = computed(
  () =>
    getErrorStatus(error.value) === 403 && /login/i.test(errorMessage.value),
);
const loginCta = isWall;
// Real quota: remaining from the POST response (quota_remaining). Anon place limit 1x → success = 0/1 (used up today, honest).
const quotaLeft = computed(() => data.value?.quota_remaining);
const quotaLabel = computed(() =>
  isWall.value ? "1/1 habis 🔒" : (quotaLeft.value ?? 1) + "/1",
);
// R3b token lock (tested): ember strip + best lime + action ink + Lainnya ink/lime.
const meta = getResultPlaceMeta();
const hero = computed(() => buildPlaceHero(list.value[idx.value], idx.value));
const minis = computed(() =>
  list.value.slice(1, 3).map((r) => (r.name || "").slice(0, 6).trim() + "..."),
);
const rankTop3 = computed(() => list.value.slice(0, 3));
const mapsUrl = computed(() => buildPlaceMapsUrl(hero.value.name));

function next(): void {
  if (list.value.length) idx.value = (idx.value + 1) % list.value.length;
}

function share(): void {
  const t = hero.value.name + " via Wikendo";
  // Share the CANONICAL address (the stored result), never the quiz answers: the recipient opens
  // the exact same deck for free instead of generating a different one with their own quota.
  // `storedId` covers the reader who received the link and now re-shares it.
  const id = generatedId.value || storedId;
  const url = id
    ? location.origin + buildResultUrl("place", id)
    : location.href;
  if (navigator.share) {
    navigator.share({ title: t, text: t, url }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(url);
    shareNote.value = true;
  }
}

// E1 history: write 1 entry per NEW generation (store: window guard + cap 20 + dedupe).
// A stored result is already in the list, so re-opening it must not add a duplicate card.
// No id = the row was not saved → no card, because a card that cannot be opened is a dead link.
function pushHistory(): void {
  if (!generatedId.value) return;
  const r = list.value[0];
  if (!r) return;
  useHistoryStore().push({
    kind: "place",
    id: generatedId.value,
    title: r.name || "—",
    sub: r.location_area || r.category || "",
    at: Date.now(),
  });
}
onMounted(() => {
  watch(
    () => list.value.length,
    (n) => {
      if (n) pushHistory();
    },
    { immediate: true },
  );
});
</script>

<template>
  <div
    class="max-w-md mx-auto px-4 pb-10 py-5"
    :style="{ background: meta.pageBg }"
  >
    <p class="text-[11.5px] text-gray-500 -mt-1 mb-2">
      {{
        isStored
          ? "Hasil tersimpan · buka gratis, quota nggak kepotong"
          : "Quota tempat " + quotaLabel
      }}
    </p>

    <AppLoader v-if="pending" variant="place" />
    <ResultError
      v-else-if="error"
      :is-wall="isWall"
      :login-cta="loginCta"
      :message="errorMessage"
      :pending="pending"
      wall-text="🔒 Kuota anon habis (1x/hari). Login 10 detik → quota jadi 2x/hari, gratis."
      @retry="refresh()"
    />
    <div v-else-if="list.length" class="flex flex-col">
      <!-- R3b hero deck: ember strip on the left + photo + BEST lime badge -->
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
          <p
            v-if="shareNote"
            class="text-xs text-center mt-2"
            style="color: #047857"
          >
            Link hasil disalin ✅
          </p>
        </div>
      </div>
      <!-- chips: 2 previews + active Lainnya ink/lime -->
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
        Kartu {{ idx + 1 }}/{{ list.length }} ·
        {{ isStored ? "hasil tersimpan" : "generate ulang = quota habis" }} ·
        <u>lihat semua ↓</u>
      </p>
      <!-- rank #1-3 gray + full list -->
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
