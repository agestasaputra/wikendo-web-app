import { describe, it, expect } from "vitest";
import { readSource } from "~/test/utils";

/**
 * AppLoader.spec.ts — the skeleton MUST mirror the content it replaces.
 * WHY: a generic spinner above a card list taught the user nothing and caused a layout jump
 * when the real cards landed. Each surface now gets its own shape, with classes copied from
 * the live component:
 *   mall index   → MallListPage card (name/sub + mall pill + 2 CTAs min-h 56)
 *   mall detail  → TenantCard row (46px thumb + name/sub + chevron)
 *   place result → PlaceResultPage hero deck (5px strip + 150px photo + 3 CTAs + rank box)
 *   food result  → FoodResultPage BEST MATCH card (2 badges + gift banner + 2 CTAs)
 * Read as text: ZERO network, deterministic in CI (readSource collapses whitespace).
 */
const LOADER = readSource("common/components/AppLoader.vue");

describe("AppLoader · shape matches content", () => {
  it("supports every real layout + an explicit fallback branch", () => {
    expect(LOADER).toContain("mall-list");
    expect(LOADER).toContain("tenant-list");
    expect(LOADER).toContain("result-place");
    expect(LOADER).toContain("result-food");
    expect(LOADER).toContain("history-list");
    expect(LOADER).toContain("account");
    expect(LOADER).toContain("v-else");
  });

  it("history skeleton = Image Card (120px band + p-4 + title/sub/time)", () => {
    expect(LOADER).toMatch(
      /history-list[\s\S]{0,400}rounded-2xl overflow-hidden bg-white border border-stone-200/,
    );
    expect(LOADER).toMatch(/history-list[\s\S]{0,900}h-\[120px\] w-full/);
    expect(LOADER).toMatch(/history-list[\s\S]{0,1400}class="p-4"/);
  });

  it("account skeleton = identity card + 4 hub rows", () => {
    expect(LOADER).toMatch(
      /layout === 'account'[\s\S]{0,500}rounded-2xl p-4 bg-white border border-stone-200/,
    );
    expect(LOADER).toMatch(/layout === 'account'[\s\S]{0,900}w-12 h-12/);
    expect(LOADER).toMatch(/v-for="i in 4"[\s\S]{0,400}px-4 py-3\.5/);
  });

  it("mall list skeleton = the MallListPage card (pill + 2 CTA min-h 56)", () => {
    expect(LOADER).toMatch(
      /mall-list[\s\S]{0,1200}bg-white rounded-2xl border border-gray-100 p-4/,
    );
    expect(LOADER).toMatch(/mall-list[\s\S]{0,1600}h-6 w-20 rounded-full/);
    expect(LOADER).toMatch(/mall-list[\s\S]{0,2200}h-14 rounded-\[14px\]/);
  });

  it("tenant skeleton = the TenantCard row (46px thumb + p-2.5)", () => {
    expect(LOADER).toMatch(
      /tenant-list[\s\S]{0,900}border border-gray-100 rounded-2xl p-2\.5 bg-white flex gap-2\.5 items-center/,
    );
    expect(LOADER).toMatch(/w-\[46px\] h-\[46px\] flex-none rounded-xl/);
  });

  it("place skeleton = hero deck (150px photo + 3 CTAs) + #f4f4f5 rank box", () => {
    expect(LOADER).toMatch(/result-place[\s\S]{0,1600}h-\[150px\]/);
    expect(LOADER).toMatch(/result-place[\s\S]{0,2600}min-height:56px/);
    expect(LOADER).toMatch(/result-place[\s\S]{0,3200}background:#f4f4f5/);
    const placeBlock = LOADER.slice(LOADER.indexOf("result-place"));
    expect(placeBlock.match(/min-height:56px/g)?.length).toBeGreaterThanOrEqual(
      3,
    );
  });

  it("food skeleton = BEST MATCH card (2 badges + gift banner + 2 CTAs)", () => {
    expect(LOADER).toMatch(/result-food[\s\S]{0,1200}rounded-\[24px\]/);
    expect(LOADER).toMatch(/result-food[\s\S]{0,1600}rounded-\[14px\]/);
    expect(LOADER).toMatch(/result-food[\s\S]{0,2000}h-6 w-28 rounded-full/);
    const foodBlock = LOADER.slice(LOADER.indexOf("result-food"));
    expect(foodBlock.match(/min-height:56px/g)?.length).toBeGreaterThanOrEqual(
      2,
    );
  });

  it("is decorative for screen readers: status wrapper + aria-hidden shapes", () => {
    expect(LOADER).toContain('role="status"');
    expect(LOADER).toContain('aria-live="polite"');
    expect(LOADER).toContain('aria-hidden="true"');
    expect(LOADER).toContain("sr-only");
  });

  it("no variant still renders a bare spinner-only block as the default", () => {
    // The old failure mode: one 56px pulsing square above every page.
    expect(LOADER).not.toContain("mx-auto mb-4 rounded-md bg-gray-200");
  });
});

describe("AppLoader · load-more reuses the same bones", () => {
  it("exposes a count prop instead of a hand-rolled 2-row copy", () => {
    expect(LOADER).toContain("count?: number");
    expect(LOADER).toContain('v-for="i in rows"');
    // Count MUST come from the RESOLVED layout, else mall detail (tenant-list) gets 4 rows.
    expect(LOADER).toMatch(/props\.count \?\? defaultCount\(layout\.value\)/);
  });

  it("mall list load-more = AppLoader count 2 (no duplicate skeleton markup)", () => {
    const list = readSource("features/mall/MallListPage.vue");
    expect(list).toMatch(
      /<AppLoader v-if="loadingMore" variant="mall" :count="2" \/>/,
    );
    expect(list).not.toContain("bg-stone-100");
  });

  it("mall detail load-more = AppLoader tenant-list count 2", () => {
    const detail = readSource("features/mall/MallDetailPage.vue");
    expect(detail).toMatch(
      /<AppLoader[\s\S]{0,120}variant="mall"[\s\S]{0,80}layout="tenant-list"[\s\S]{0,40}:count="2"/,
    );
    expect(detail).not.toContain("bg-stone-100");
  });
});

describe("AppLoader · wired per surface", () => {
  it("mall list uses the card list layout", () => {
    expect(readSource("features/mall/MallListPage.vue")).toMatch(
      /<AppLoader v-if="pending" variant="mall" \/>/,
    );
  });

  it("mall detail overrides to tenant rows", () => {
    const detail = readSource("features/mall/MallDetailPage.vue");
    expect(detail).toContain(
      '<AppLoader v-if="pending" variant="mall" layout="tenant-list" />',
    );
  });

  it("place + food results keep their pending guard", () => {
    expect(readSource("features/place/PlaceResultPage.vue")).toContain(
      '<AppLoader v-if="pending" variant="place" />',
    );
    expect(readSource("features/food/FoodResultPage.vue")).toContain(
      '<AppLoader v-if="pending" variant="food" />',
    );
  });
});
