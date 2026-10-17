import { describe, it, expect } from "vitest";
import { readSource, sourceExists } from "~/test/utils";

/**
 * MakanResultPage.spec.ts — Result MAKAN: voucher gift di hero (11 Okt) + multi-voucher V13A/B (Gas v13)
 * + riwayat E1 + Coba lagi. File-assert deterministik: NOL network, NOL browser.
 * V13A hero best-1 + link +2 promo → sheet. V13B sheet pilih 1 dari 3 + Klaim per row + spinner + guard.
 */
const PAGE = readSource("features/makan/MakanResultPage.vue");
const SHEET = readSource("features/makan/components/VoucherSheet.vue");
const VIEW = `${PAGE} ${SHEET}`;
const ALL = readSource(
  "features/makan/MakanResultPage.vue",
  "features/makan/components/VoucherSheet.vue",
  "features/makan/constants/questions.ts",
  "common/components/AppSpinner.vue",
);
const ERR = readSource("common/components/ResultError.vue");
const STORE = readSource("features/makan/store/VoucherStore.ts");

function count(hay: string, needle: string): number {
  return hay.split(needle).length - 1;
}

describe("result-makan voucher — tiket atas dihapus", () => {
  it("TIDAK ada tiket dashed: tanpa VOUCHER + Klaim → + tunjukin ke kasir + dashed", () => {
    expect(VIEW).not.toContain("VOUCHER");
    expect(VIEW).not.toContain("Klaim →");
    expect(VIEW).not.toContain("tunjukin ke kasir");
    expect(VIEW).not.toContain("dashed");
  });

  it("ADA banner gift di dalam hero: Ada -20% buat lu + Buka + vGift", () => {
    expect(PAGE).toContain("Ada");
    expect(PAGE).toContain("-20%");
    expect(PAGE).toContain("buat lu");
    expect(PAGE).toContain("Buka →");
    expect(PAGE).toContain("vGift");
    expect(PAGE).toMatch(/getVoucherCardMeta\(["']gift["']\)/);
  });

  it("HANYA 1 voucher: Buka → muncul tepat 1x (bawah bersih)", () => {
    expect(count(VIEW, "Buka →")).toBe(1);
  });

  it("Hero tetap utuh: BEST MATCH + Maps tenant + rank + Coba lagi", () => {
    expect(PAGE).toContain("BEST MATCH");
    expect(PAGE).toContain("Maps tenant →");
    expect(PAGE).toContain("#{{ i + 1 }}");
    expect(`${PAGE} ${ERR}`).toContain("Coba lagi");
    expect(ERR).toContain(':disabled="pending"');
  });
});

describe("V13A hero best-1 + link +2 promo", () => {
  it("ADA link +2 promo lain pemicu sheet", () => {
    expect(PAGE).toContain("+2 promo lain");
  });

  it("ADA state sheet (showSheet)", () => {
    expect(PAGE.toLowerCase()).toContain("sheet");
    expect(PAGE).toMatch(/showSheet|sheetOpen|sheet/);
  });
});

describe("V13B sheet picker 3 row + Klaim API", () => {
  it("ADA judul pilih 1 + aturan 1 transaksi 1 kode + 23:59", () => {
    expect(ALL).toContain("Pilih 1");
    expect(ALL).toContain("1 transaksi 1 kode");
    expect(ALL).toContain("23:59");
  });

  it("ADA 3 kode seed WKD-7X2K9A/4Y5B3C/L8M2N1 atau sisa cap per row", () => {
    const hasCodes =
      ALL.includes("WKD-7X2K9A") &&
      ALL.includes("WKD-4Y5B3C") &&
      ALL.includes("WKD-L8M2N1");
    const hasCap = ALL.includes("/20") || ALL.includes("sisa");
    expect(hasCodes || hasCap).toBe(true);
  });

  it("ADA tombol Klaim per row (tanpa panah, beda dari Buka)", () => {
    expect(VIEW).toContain("Klaim");
    expect(VIEW).not.toContain("Klaim →");
  });

  it("UX lock: spinner animate-spin + :disabled + early-return guard", () => {
    expect(ALL).toContain("animate-spin");
    expect(ALL).toContain(":disabled");
    expect(PAGE).toMatch(/if\s*\(\s*claiming/i);
  });

  it("Wiring API: POST /api/voucher/claim via $fetch + Bearer token (VoucherStore)", () => {
    expect(STORE).toContain("/api/voucher/claim");
    expect(STORE).toMatch(/\$fetch|fetch/);
    expect(STORE).toMatch(/authorization|Bearer|access_token|getSession/i);
  });

  it("ADA store VoucherStore dengan claimVoucher", () => {
    expect(sourceExists("features/makan/store/VoucherStore.ts")).toBe(true);
    expect(STORE).toContain("claimVoucher");
    expect(STORE).toContain("/api/voucher/claim");
  });
});

describe("E1 result makan tulis riwayat", () => {
  it("push ke HistoryStore pas data sukses (kind makan)", () => {
    expect(PAGE).toContain("useHistoryStore");
    expect(PAGE).toMatch(/kind:\s*["']makan["']/);
  });
});
