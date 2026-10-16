<!-- features/makan/components/VoucherSheet.vue → Sheet picker V13B: pilih 1 dari 3 promo + sisa cap + Klaim per row.
APA: panel di atas hasil: judul tenant, aturan "1 transaksi 1 kode · s/d 23:59 WIB", 3 row (nama, min, sisa cap, tombol Klaim + spinner), Tutup.
KENAPA: dipisah dari MakanResultPage supaya halaman tipis. Klaim WAJIB login (anti-farming, 401 di server).
Contoh: <VoucherSheet :vouchers="vouchers" hero-name="Kopi" :claiming="claiming" :claiming-code="code" @claim="claimRow" @close="close" /> -->
<script setup lang="ts">
import AppSpinner from "~/common/components/AppSpinner.vue";
import type { VoucherItem } from "~/features/makan/@types/makan";

defineProps<{
  vouchers: VoucherItem[];
  heroName: string;
  claiming: boolean;
  claimingCode: string;
}>();
const emit = defineEmits<{ claim: [code: string]; close: [] }>();
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
    <p class="font-extrabold text-[13px]">🎁 3 promo di {{ heroName }}</p>
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
        <b>{{ v.name }}</b
        ><br />
        <small class="text-gray-500 font-bold"
          >{{ v.min }} · sisa {{ v.left }}/{{ v.cap }}</small
        >
      </div>
      <span
        class="text-[10px] font-extrabold rounded-full px-2 py-0.5"
        style="background: #fff7ed; color: #9a3412"
        >{{ v.left }}/{{ v.cap }}</span
      >
      <button
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
    </div>
    <p class="text-[10.5px] font-bold text-gray-500 text-center mt-1.5">
      1 tenant 1x/hari · login wajib · kode WKD-7X2K9A / WKD-4Y5B3C / WKD-L8M2N1
    </p>
    <button
      class="w-full text-center text-[12px] font-bold mt-1 underline"
      @click="emit('close')"
    >
      Tutup
    </button>
  </div>
</template>
