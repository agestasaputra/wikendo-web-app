import { describe, it, expect } from "vitest";
import { readSource, sourceExists } from "~/test/utils";

/**
 * FoodResultPage.spec.ts — FOOD result: voucher gift in hero (Oct 11) + multi-voucher V13A/B (Gas v13)
 * + E1 history + Coba lagi. Deterministic file-assert: ZERO network, ZERO browser.
 * V13A hero best-1 + "+2 promo lain" link → sheet. V13B sheet pick 1 of 3 + Klaim per row + spinner + guard.
 */
const PAGE = readSource("features/food/FoodResultPage.vue");
const SHEET = readSource("features/food/components/VoucherSheet.vue");
const VIEW = `${PAGE} ${SHEET}`;
const ALL = readSource(
  "features/food/FoodResultPage.vue",
  "features/food/components/VoucherSheet.vue",
  "features/food/constants/questions.ts",
  "common/components/AppSpinner.vue",
);
const ERR = readSource("common/components/ResultError.vue");
const STORE = readSource("features/food/store/VoucherStore.ts");

function count(hay: string, needle: string): number {
  return hay.split(needle).length - 1;
}

describe("result-food voucher — top ticket removed", () => {
  it("NO dashed ticket: no VOUCHER, no 'Klaim →', no 'tunjukin ke kasir', no dashed", () => {
    expect(VIEW).not.toContain("VOUCHER");
    expect(VIEW).not.toContain("Klaim →");
    expect(VIEW).not.toContain("tunjukin ke kasir");
    expect(VIEW).not.toContain("dashed");
  });

  it("HAS gift banner inside hero: 'Ada' '-20%' 'buat lu' + 'Buka →' + vGift", () => {
    expect(PAGE).toContain("Ada");
    expect(PAGE).toContain("-20%");
    expect(PAGE).toContain("buat lu");
    expect(PAGE).toContain("Buka →");
    expect(PAGE).toContain("vGift");
    expect(PAGE).toMatch(/getVoucherCardMeta\(["']gift["']\)/);
  });

  it("ONLY 1 voucher: 'Buka →' appears exactly 1x (clean bottom)", () => {
    expect(count(VIEW, "Buka →")).toBe(1);
  });

  it("Hero stays intact: BEST MATCH + tenant Maps + rank + Coba lagi", () => {
    expect(PAGE).toContain("BEST MATCH");
    expect(PAGE).toContain("Maps tenant →");
    expect(PAGE).toContain("#{{ i + 1 }}");
    expect(`${PAGE} ${ERR}`).toContain("Coba lagi");
    expect(ERR).toContain(':disabled="pending"');
  });
});

describe("V13A hero best-1 + '+2 promo' link", () => {
  it("HAS a '+2 promo lain' link triggering the sheet", () => {
    expect(PAGE).toContain("+2 promo lain");
  });

  it("HAS sheet state (showSheet)", () => {
    expect(PAGE.toLowerCase()).toContain("sheet");
    expect(PAGE).toMatch(/showSheet|sheetOpen|sheet/);
  });
});

describe("V13B sheet picker 3 rows + Klaim API", () => {
  it("HAS a 'Pilih 1' title + '1 transaksi 1 kode' rule + 23:59", () => {
    expect(ALL).toContain("Pilih 1");
    expect(ALL).toContain("1 transaksi 1 kode");
    expect(ALL).toContain("23:59");
  });

  it("HAS 3 seed codes WKD-7X2K9A/4Y5B3C/L8M2N1 or remaining cap per row", () => {
    const hasCodes =
      ALL.includes("WKD-7X2K9A") &&
      ALL.includes("WKD-4Y5B3C") &&
      ALL.includes("WKD-L8M2N1");
    const hasCap = ALL.includes("/20") || ALL.includes("sisa");
    expect(hasCodes || hasCap).toBe(true);
  });

  it("HAS Klaim button per row (no arrow, different from Buka)", () => {
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

  it("HAS a VoucherStore store with claimVoucher", () => {
    expect(sourceExists("features/food/store/VoucherStore.ts")).toBe(true);
    expect(STORE).toContain("claimVoucher");
    expect(STORE).toContain("/api/voucher/claim");
  });
});

describe("E1 food result writes history", () => {
  it("pushes to HistoryStore on success (kind food)", () => {
    expect(PAGE).toContain("useHistoryStore");
    expect(PAGE).toMatch(/kind:\s*["']food["']/);
  });
});
