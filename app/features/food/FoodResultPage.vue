<!-- features/makan/MakanResultPage.vue → GET /result-makan (Result TENANT + gift di hero).
APA: header Hasil + 5 rekomendasi + deck BEST MATCH (badge BEST lime + Halal mint) + gift di hero (Ada -20% + Buka) + Maps tenant + chips + rank #1-3 + quota makan.
KENAPA gift di hero 1:1 request Agesta 11 Okt: 1 CTA saja di atas, bawah bersih tanpa dobel, klaim WAJIB login (anti-farming), token lock paper #F5F5F4 + ink #0C0A09 + lime/rose/mint via getResultMakanMeta (1 sumber, tested).
Contoh: hero Kopi Kekinian — GI L2 Halal 50-100rb kids → gift Buka lalu Maps tenant. Lock: TENANT saja, 0 tempat wisata. -->
<script setup lang="ts">
import { storeToRefs } from "pinia";
import AppLoader from "~/common/components/AppLoader.vue";
import ResultError from "~/common/components/ResultError.vue";
import { useHistoryStore } from "~/common/store/HistoryStore";
import type { TenantRecommendation } from "~/common/types/api";
import { getMallShortLabel } from "~/common/utils/mall";
import VoucherSheet from "~/features/makan/components/VoucherSheet.vue";
import { MAKAN_PROMOS } from "~/features/makan/constants/questions";
import { useVoucherStore } from "~/features/makan/store/VoucherStore";
import {
  buildMakanChips,
  buildMakanHero,
  buildRankItems,
} from "~/features/makan/utils/resultHero";
import { getResultMakanMeta } from "~/features/makan/utils/resultMeta";
import { getVoucherCardMeta } from "~/features/makan/utils/voucherCard";
import { getErrorMessage, getErrorStatus } from "~/utils/error";

interface MakanResponse {
  recommendations: TenantRecommendation[];
  quota_remaining?: number;
}

const route = useRoute();
const { data, pending, error, refresh } = await useFetch<MakanResponse>(
  "/api/makan/recommend",
  { method: "POST", body: route.query },
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
    /login/i.test(errorMessage.value) || getErrorStatus(error.value) === 403,
);
// Quota real: sisa dari response POST (quota_remaining). Anon limit makan 2x.
const quotaLeft = computed(() => data.value?.quota_remaining);
const quotaLabel = computed(() =>
  isWall.value ? "0/2 habis 🔒" : (quotaLeft.value ?? 2) + "/2",
);
const mallSlug = computed(() =>
  String(route.query.mall_slug || route.query.mall || ""),
);
const mallLabel = computed(() =>
  mallSlug.value ? getMallShortLabel(mallSlug.value) : "Mall",
);
// F1b token lock (tested): tiket ink + diskon lime + Klaim rose + halal mint.
const meta = getResultMakanMeta();
// V12 gift surprise: meta grad cream-rose + pill rose (helper tested).
const vGift = getVoucherCardMeta("gift");
const hero = computed(() => buildMakanHero(list.value[idx.value]));
const chips = computed(() => buildMakanChips(list.value));
const rankItems = computed(() => buildRankItems(list.value));

function next(): void {
  if (list.value.length) idx.value = (idx.value + 1) % list.value.length;
}

// V13A/B wiring (Addendum 23 v1.1): hero best-1 + link +2 promo → sheet 3 row.
// Endpoint: /api/voucher/claim via VoucherStore ($fetch + Bearer access_token getSession).
const voucherStore = useVoucherStore();
const { claiming, claimError } = storeToRefs(voucherStore);
const showSheet = ref(false);
const claimingCode = ref("");

// F1b ticket-based claim: solid Klaim, anon → wall login (anti-farming).
async function claimRow(code: string): Promise<void> {
  // UX lock: early-return guard anti double-klik (keyboard Enter bypass :disabled).
  if (claiming.value) return;
  claimingCode.value = code;
  try {
    const res = await voucherStore.claimVoucher(code);
    claimed.value = res.claim_code;
    claimNote.value = "";
    showSheet.value = false;
  } catch {
    claimNote.value = claimError.value || "Gagal klaim. Coba lagi.";
  } finally {
    claimingCode.value = "";
  }
}

// E1 riwayat: tulis 1 entry pas data sukses (store: guard window + cap 20 + dedupe).
function pushHistory(): void {
  const r = list.value[0];
  if (!r) return;
  const lantai = r.lantai ? "L" + r.lantai : "";
  useHistoryStore().push({
    kind: "makan",
    title: r.name || "—",
    sub: lantai + (mallLabel.value ? " · " + mallLabel.value : ""),
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
      <NuxtLink to="/" class="font-extrabold">← Hasil 🍜/📍</NuxtLink>
      <span class="text-gray-500">{{ list.length || 5 }} rekomendasi</span>
    </div>
    <p class="text-[11.5px] text-gray-500 -mt-1 mb-2">
      Quota makan {{ quotaLabel }} tersisa · {{ mallLabel }}
    </p>

    <AppLoader v-if="pending" variant="makan" />
    <ResultError
      v-else-if="error"
      :is-wall="isWall"
      :message="errorMessage"
      :pending="pending"
      wall-text="🔒 Quota makan anon habis (2x/hari). Login 10 detik → quota jadi 5x/hari, gratis."
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

          <!-- Voucher gift di dalam hero (pindahan dari bawah, 11 Okt 2026): banner Ada -20% + Buka, model lama atas dihapus -->
          <!-- V13A best-1 + link +2 promo lain → sheet V13B (Addendum 23 v1.1). 1 CTA dominan, sisanya di sheet. -->
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

          <!-- V13B sheet picker di atas result: Pilih 1 dari 3 + sisa cap + Klaim per row -->
          <VoucherSheet
            v-if="showSheet"
            :vouchers="MAKAN_PROMOS"
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
      <!-- end F1b (voucher bawah dihapus 11 Okt 2026: gift sudah pindah ke dalam hero di atas) -->

      <p class="text-[11.5px] text-gray-500 mt-2 text-center">
        <u>Lapor tutup/buka</u> · <u>Share ke temen</u> · Quota makan
        {{ quotaLabel }} tersisa
      </p>
    </div>
  </div>
</template>
