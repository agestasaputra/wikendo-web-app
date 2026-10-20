<!-- features/food/FoodResultPage.vue → GET /result-food (TENANT result + gift in the hero).
WHAT: Result header + 5 recommendations + BEST MATCH deck (BEST lime badge + Halal mint) + gift in the hero (Ada -20% + Buka) + tenant Maps + chips + rank #1-3 + food quota.
WHY gift in the hero 1:1 Agesta request Oct 11: just 1 CTA on top, clean bottom without duplication, claim REQUIRES login (anti-farming), token lock paper = PAGE_BG + ink #0C0A09 + lime/rose/mint via getResultFoodMeta (1 source, tested).
EXAMPLE: Kopi Kekinian hero — GI L2 Halal 50-100rb kids → gift Buka then tenant Maps. Lock: TENANT only, 0 tourist places. -->
<script setup lang="ts">
import { onMounted, watch, ref } from "vue";
import AppLoader from "~/common/components/AppLoader.vue";
import { useAuthFetch } from "~/common/composables/useAuthFetch";
import ResultError from "~/common/components/ResultError.vue";
import { useHistoryStore } from "~/common/store/HistoryStore";
import type { TenantRecommendation } from "~/common/types/api";
import { getMallShortLabel } from "~/common/utils/mall";
import VoucherSheet from "~/features/food/components/VoucherSheet.vue";
// NOTE: Previously we used a hard-coded `FOOD_PROMOS` list (static per tenant).
// This caused vouchers from one mall to appear under another. We now fetch the
// active offers for the current mall via the public `/api/vouchers` endpoint.
import type { VoucherOffer } from "~/features/food/@types/food";
import { useVoucherStore } from "~/features/food/store/VoucherStore";
import {
  buildFoodChips,
  buildFoodHero,
  buildRankItems,
} from "~/features/food/utils/resultHero";
import { getResultFoodMeta } from "~/features/food/utils/resultMeta";
import { getVoucherCardMeta } from "~/features/food/utils/voucherCard";
import { buildResultUrl, parseResultId } from "~/common/utils/resultUrl";
import { getErrorMessage, getErrorStatus } from "~/utils/error";

interface FoodResponse {
  id?: string;
  recommendations: TenantRecommendation[];
  quota_remaining?: number;
  mall_slug?: string;
}

const route = useRoute();
const router = useRouter();
// Bearer token REQUIRED: the Supabase session lives in localStorage (no auth cookie), so a plain
// useFetch reaches the server anonymously → row saved with user_id NULL. authFetch fixes attribution.
const authFetch = useAuthFetch();
// TWO modes, one page:
//   `?id=<uuid>` → open a STORED result: GET only (0 quota, 0 LLM, free on refresh/share).
//   no id        → a FRESH quiz submission: POST once, then the URL is replaced by its new id.
// WHY: the query string used to BE the quiz state; every refresh re-generated the deck and burned
// a quota slot (anon → login wall), and a shared link produced a different deck.
// Snapshot the quiz answers ONCE: after `router.replace(?id=…)` the live query no longer carries
// them, but the request body and the mall label still need them for this render.
const quizQuery = { ...route.query };
const storedId = parseResultId(quizQuery);
const generatedId = ref("");
const isStored = computed(() => Boolean(storedId));
// The key MUST be unique per SUBMISSION: a stable `fresh` key would replay the previous deck from
// Nuxt's payload cache on a second quiz (no POST → the user sees an old result).
const submissionKey = storedId || `fresh:${Date.now()}`;
const { data, pending, error, refresh } = await useAsyncData<FoodResponse>(
  `food-result:${submissionKey}`,
  async () => {
    if (storedId) {
      return await authFetch<FoodResponse>(`/api/result/${storedId}`);
    }
    const fresh = await authFetch<FoodResponse>("/api/food/recommend", {
      method: "POST",
      body: quizQuery,
    });
    if (fresh.id) {
      generatedId.value = fresh.id;
      // Swap answers → id without a reload: the address bar stops carrying personal answers.
      void router.replace(buildResultUrl("food", fresh.id));
    }
    return fresh;
  },
);
const list = computed(() => data.value?.recommendations || []);
const idx = ref(0);
const claimed = ref("");
const claimNote = ref("");
const errorMessage = computed(() =>
  getErrorMessage(error.value, "Gagal generate."),
);
const isWall = computed(
  () =>
    getErrorStatus(error.value) === 403 && /login/i.test(errorMessage.value),
);
const loginCta = isWall;
// Real quota: remaining from the POST response (quota_remaining). Anon food limit 2x.
const quotaLeft = computed(() => data.value?.quota_remaining);
const quotaLabel = computed(() =>
  isWall.value ? "0/1 habis 🔒" : (quotaLeft.value ?? 1) + "/1",
);
const mallSlug = computed(() =>
  String(quizQuery.mall_slug || quizQuery.mall || data.value?.mall_slug || ""),
);
const offers = ref<VoucherOffer[]>([]);
const { data: voucherData } = await useFetch<VoucherOffer[]>("/api/vouchers", {
  query: { mall_slug: mallSlug },
  default: () => [],
});
offers.value = voucherData.value ?? [];
const mallLabel = computed(() =>
  mallSlug.value ? getMallShortLabel(mallSlug.value) : "Mall",
);
// F1b token lock (tested): ink ticket + lime discount + Claim rose + halal mint.
const meta = getResultFoodMeta();
// V12 gift surprise: cream-rose grad meta + rose pill (tested helper).
const vGift = getVoucherCardMeta("gift");
const hero = computed(() => buildFoodHero(list.value[idx.value]));
const chips = computed(() => buildFoodChips(list.value));
const rankItems = computed(() => buildRankItems(list.value));

function next(): void {
  if (list.value.length) idx.value = (idx.value + 1) % list.value.length;
}

// Share the CANONICAL stored address, never the quiz answers: the recipient opens the same deck
// for free (no quota burned). `storedId` covers a reader re-sharing a link they received.
function share(): void {
  const id = generatedId.value || storedId;
  if (!id) return;
  const name = hero.value.name || "Wikendo";
  const t = name + " via Wikendo";
  const url = location.origin + buildResultUrl("food", id);
  if (navigator.share) {
    navigator.share({ title: t, text: t, url }).catch(() => {});
    return;
  }
  navigator.clipboard?.writeText(url);
  claimNote.value = "Link hasil disalin ✅";
}

// V13A/B wiring (Addendum 23 v1.1): hero best-1 + link +2 more promos → 3-row sheet.
// Endpoint: /api/voucher/claim via VoucherStore ($fetch + Bearer access_token getSession).
const voucherStore = useVoucherStore();
const { claiming, claimError } = storeToRefs(voucherStore);
const showSheet = ref(false);
const claimingCode = ref("");

// F1b ticket-based claim: solid Claim, anon → login wall (anti-farming).
async function claimRow(code: string): Promise<void> {
  // UX lock: early-return guard against double-click (keyboard Enter bypasses :disabled).
  if (claiming.value) return;
  claimingCode.value = code;
  try {
    const res = await voucherStore.claimVoucher(code);
    claimed.value = res.claim_code;
    claimNote.value = "";
    showSheet.value = false;
    // mark the claimed offer in the local list so the sheet shows "Sudah diklaim"
    offers.value = offers.value.map((o) =>
      o.code === code ? { ...o, claimed: true } : o,
    );
  } catch {
    claimNote.value = claimError.value || "Gagal klaim. Coba lagi.";
  } finally {
    claimingCode.value = "";
  }
}

// E1 history: write 1 entry per NEW generation (store: window guard + cap 20 + dedupe).
// A stored result is already in the list → re-opening it must not add a duplicate card.
// No id = the row was not saved → no card, because a card that cannot be opened is a dead link.
function pushHistory(): void {
  if (!generatedId.value) return;
  const r = list.value[0];
  if (!r) return;
  const floor = r.floor ? "L" + r.floor : "";
  useHistoryStore().push({
    kind: "food",
    id: generatedId.value,
    title: r.name || "—",
    sub: floor + (mallLabel.value ? " · " + mallLabel.value : ""),
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
  <div class="max-w-md mx-auto px-4 pb-10 py-5">
    <p class="text-[11.5px] text-gray-500 -mt-1 mb-2">
      {{
        isStored
          ? "Hasil tersimpan · buka gratis, quota nggak kepotong · " + mallLabel
          : "Quota makan " + quotaLabel + " tersisa · " + mallLabel
      }}
    </p>

    <AppLoader v-if="pending" variant="food" />
    <ResultError
      v-else-if="error"
      :is-wall="isWall"
      :login-cta="loginCta"
      :message="errorMessage"
      :pending="pending"
      wall-text="🔒 Kuota makan anon habis (1x/hari). Login 10 detik → quota jadi 5x/hari, gratis."
      @retry="refresh()"
    />
    <div v-else-if="list.length" class="flex flex-col">
      <!-- F1b BEST MATCH card -->
      <div
        class="shadow-lg rounded-[24px] overflow-hidden"
        :style="{ background: meta.cardBg, border: '1px solid #eee' }"
      >
        <div class="p-4">
          <div class="flex gap-1.5 flex-wrap mb-2">
            <span
              class="text-[11px] font-extrabold px-2.5 py-1 rounded-full"
              :style="{ background: meta.bestBg, color: '#0C0A09' }"
              >★ BEST MATCH</span
            >
            <span
              v-if="hero.halal === true"
              class="text-[11px] font-extrabold px-2.5 py-1 rounded-full"
              :style="{ background: meta.halalBg, color: meta.halalColor }"
              >✅ Halal</span
            >
            <span
              v-else-if="hero.halal === false"
              class="text-[11px] font-extrabold px-2.5 py-1 rounded-full"
              style="background: #fef2f2; color: #991b1b"
              >⚠️ Non-halal</span
            >
            <span
              v-else
              class="text-[11px] font-extrabold px-2.5 py-1 rounded-full"
              style="background: #f4f4f5; color: #71717a"
              >❓ Belum verifikasi</span
            >
          </div>
          <div class="font-extrabold text-[17px]">
            🍜 {{ hero.name }} — {{ mallLabel }} L{{ hero.floor }}
          </div>
          <p class="text-[12.5px] text-gray-600 my-1.5">
            Kenapa: {{ hero.reason }}
          </p>
          <p class="text-[12.5px]">
            💰 {{ hero.price }} · {{ hero.kids }} · 📍 L{{ hero.floor }}
          </p>

          <!-- Voucher gift inside the hero (moved from below, Oct 11 2026): Ada -20% + Buka banner, old top model removed -->
          <!-- V13A best-1 + link +2 other promos → V13B sheet (Addendum 23 v1.1). 1 dominant CTA, the rest in the sheet. -->
          <div
            class="rounded-[14px] p-3 flex gap-2 items-center mt-3"
            :style="{
              background: vGift.bg,
              border: '1px solid ' + vGift.border,
            }"
          >
            <div class="text-[26px]">🎁</div>
            <div class="flex-1 text-[13px] font-bold">
              Ada <b>-20%</b> buat lu<br /><small
                class="font-normal text-gray-500"
                >{{ hero.name }} · {{ mallLabel }} L{{ hero.floor }} · hari
                ini</small
              >
            </div>
            <button
              class="font-extrabold text-[13px] rounded-full px-[14px] py-2 cursor-pointer disabled:opacity-60"
              :style="{ background: vGift.goBg, color: vGift.goColor }"
              :disabled="claiming"
              @click="showSheet = true"
            >
              Buka →
            </button>
          </div>
          <button
            class="w-full text-center text-[12px] font-extrabold mt-1.5 underline"
            @click="showSheet = true"
          >
            +2 promo lain di sini
            <span
              class="inline-block rounded-full px-2 py-0.5 no-underline"
              style="background: #a3e635"
              >lihat ↓</span
            >
          </button>
          <p
            v-if="claimed"
            class="text-xs text-center mt-2"
            style="color: #047857"
          >
            🎟️ Kode: {{ claimed }} · s/d 23:59 WIB · 1 transaksi 1 kode
          </p>
          <p
            v-else-if="claimNote"
            class="text-xs text-center mt-2"
            style="color: #c2410c"
          >
            {{ claimNote }}
          </p>

          <!-- V13B sheet picker above the result: Pick 1 of 3 + remaining cap + Claim per row -->
          <VoucherSheet
            v-if="showSheet"
            :vouchers="offers"
            :hero-name="hero.name"
            :claiming="claiming"
            :claiming-code="claimingCode"
            @claim="claimRow"
            @close="showSheet = false"
          />

          <div class="flex gap-2.5 mt-3">
            <a
              :href="hero.maps"
              target="_blank"
              class="flex-1 text-center text-white p-[15px] rounded-2xl font-extrabold text-sm"
              :style="{ background: meta.ticketBg }"
              >📍 Maps tenant →</a
            >
            <button
              class="flex-1 p-[15px] rounded-2xl font-extrabold text-sm bg-white border-2 border-gray-200"
              title="Login untuk simpan"
              @click="claimNote = '🔒 Login 10 detik untuk simpan — gratis.'"
            >
              💾
            </button>
          </div>

          <div class="flex gap-1.5 mt-3">
            <span
              v-for="(c, i) in chips"
              :key="i"
              class="flex-1 text-center text-[11.5px] font-bold rounded-full px-2 py-1.5 bg-white border border-gray-200 truncate"
              >{{ c }}</span
            >
            <button
              class="flex-1 text-[11.5px] font-extrabold rounded-full px-2 py-1.5"
              :style="{ background: meta.claimBg, color: meta.claimColor }"
              @click="next()"
            >
              Lainnya →
            </button>
          </div>
        </div>

        <!-- Rank #1-3 -->
        <div class="px-4 pb-4">
          <div
            class="rounded-2xl p-3 flex flex-col gap-2"
            style="background: #f4f4f5"
          >
            <div
              v-for="(r, i) in rankItems"
              :key="i"
              class="text-[12.5px] leading-snug"
            >
              <b>#{{ i + 1 }} {{ r.name }}</b
              ><br />
              <span class="text-gray-500">{{ r.tags }}</span>
            </div>
          </div>
          <p class="text-[11px] text-gray-400 text-center mt-2">
            Gift di hero · klaim WAJIB login
          </p>
        </div>
      </div>
      <!-- end F1b (bottom voucher removed Oct 11 2026: gift has moved into the hero above) -->

      <p class="text-[11.5px] text-gray-500 mt-2 text-center">
        <u>Lapor tutup/buka</u> ·
        <button type="button" class="underline" @click="share()">
          Share ke temen
        </button>
        ·
        {{
          isStored
            ? "hasil tersimpan, buka tanpa quota"
            : "Quota makan " + quotaLabel + " tersisa"
        }}
      </p>
    </div>
  </div>
</template>
