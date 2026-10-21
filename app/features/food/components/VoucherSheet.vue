<!-- features/food/components/VoucherSheet.vue → V13B/V13D sheet picker: real offers from the DB, 1 claim per tenant per day.
WHAT: panel above the result: tenant title, rule "1 transaksi 1 kode · s/d 23:59 WIB", one row per offer
  (promo text, tenant, live countdown from expires_at, discount label, Klaim / "Sudah diklaim"), Tutup.
WHY offers come from the server (V13D): the old list was hardcoded FOOD_PROMOS owned by ONE tenant
  (HokBen) but rendered under EVERY hero → a user in Central Park could claim a Grand Indonesia code.
WHY the countdown ticks locally every 30s: `expires_at` is absolute, so a static label goes stale on a
  page left open; the tick keeps "sisa 2j 59m" honest without extra API calls.
WHY claim REQUIRES login: anti-farming — the server answers 401 and the page shows the login wall.
WHY the wall is a prop and not "Klaim": an anonymous "Klaim" button can only fail; the row shows
  "Login →" so the tap lands on the action that actually unblocks the user (and the wall note lives
  inside the sheet because the hero note is hidden behind this panel).
EXAMPLE: <VoucherSheet :vouchers="offers" hero-name="Kopi" :claiming="claiming" :claiming-code="code"
  :login-wall="!auth.isLoggedIn" :note="claimNote" @claim="claimRow" @login="goLogin" @close="close" /> -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import AppSpinner from "~/common/components/AppSpinner.vue";
import type { VoucherOffer } from "~/features/food/@types/food";
import {
  buildDiscountLabel,
  claimState,
  countdownLabel,
} from "../utils/voucherOffers";

defineProps<{
  vouchers: VoucherOffer[];
  heroName: string;
  claiming: boolean;
  claimingCode: string;
  loginWall: boolean;
  note: string;
}>();
const emit = defineEmits<{ claim: [code: string]; login: []; close: [] }>();

// 30s tick: one timer per open sheet, precise enough for a minute-level label.
const nowMs = ref(Date.now());
let timer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  timer = setInterval(() => {
    nowMs.value = Date.now();
  }, 30_000);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
  timer = null;
});
</script>

<template>
  <div
    class="rounded-2xl p-3 mt-2 bg-white"
    style="border: 1.5px solid #0c0a09; border-top: 4px solid #0c0a09"
  >
    <div
      class="w-10 h-1 rounded-full mx-auto mb-1.5"
      style="background: #d6d3d1"
    />
    <p class="font-extrabold text-[13px]">🎁 Promo di mall ini</p>
    <p class="text-[11px] font-bold text-gray-500 mb-1">
      Pilih 1 · 1 transaksi 1 kode · s/d 23:59 WIB
    </p>
    <div
      v-for="v in vouchers"
      :key="v.code"
      class="rounded-xl p-2 mt-1.5 flex gap-2 items-center bg-white"
      style="border: 1.5px solid #e7e5e4"
    >
      <div class="flex-1 text-[12px]">
        <b>{{ v.promo_text }}</b
        ><br />
        <small class="text-gray-500 font-bold">
          {{ v.tenant_name }} · {{ countdownLabel(v.expires_at, nowMs) }}
        </small>
      </div>
      <span
        class="text-[10px] font-extrabold rounded-full px-2 py-0.5"
        style="background: #fff7ed; color: #9a3412"
        >{{ buildDiscountLabel(v) }}</span
      >
      <!-- Login wall first: an anon "Klaim" can only produce 401 → show the action that works. -->
      <button
        v-if="loginWall"
        class="text-[12px] font-extrabold rounded-full px-3 py-1.5"
        style="background: #a3e635; color: #0c0a09"
        @click="emit('login')"
      >
        Login →
      </button>
      <button
        v-else-if="claimState(v) !== 'claimed'"
        class="text-[12px] font-extrabold rounded-full px-3 py-1.5 text-white disabled:opacity-60 flex items-center gap-1"
        style="background: #e11d48"
        :disabled="claiming"
        @click="emit('claim', v.code)"
      >
        <AppSpinner
          v-if="claiming && claimingCode === v.code"
          size="w-3.5 h-3.5"
        />
        Klaim
      </button>
      <span
        v-else
        class="text-[12px] font-extrabold rounded-full px-3 py-1.5"
        style="background: #d1fae5; color: #065f46"
        >Sudah diklaim</span
      >
    </div>
    <p
      v-if="!vouchers.length"
      class="text-[11.5px] font-bold text-gray-500 text-center mt-2"
    >
      Belum ada promo aktif di tenant ini hari ini.
    </p>
    <!-- Claim feedback lives here: the hero note is covered by this panel. -->
    <p
      v-if="note"
      class="text-[11px] font-bold text-center mt-1.5"
      style="color: #c2410c"
    >
      {{ note }}
    </p>
    <p class="text-[10.5px] font-bold text-gray-500 text-center mt-1.5">
      {{
        loginWall
          ? "Login gratis: klaim voucher + riwayat lintas device."
          : "1 tenant 1x/hari · s/d 23:59 WIB"
      }}
    </p>
    <button
      class="w-full text-center text-[12px] font-bold mt-1 underline"
      @click="emit('close')"
    >
      Tutup
    </button>
  </div>
</template>
