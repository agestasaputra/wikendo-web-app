/**
 * __tests__/directoryMetrics.spec.ts — RED→GREEN for the directory funnel metric.
 *
 * WHY these cases: the metric is the ONLY evidence that the new default sort/search/filter
 * actually moves behaviour. A wrong row is worse than no row (a dashboard that lies), so the
 * pure builder is tested for: no-op browse, search, filter breakdown, and the truncation of
 * a hostile long keyword.
 */
import { describe, it, expect } from "vitest";
import {
  buildDirectoryMetric,
  recordDirectoryMetric,
} from "../directoryMetrics";
import { ANALYTICS_EVENTS } from "../../../common/constants/analytics";

describe("buildDirectoryMetric (query → analytics row)", () => {
  it("plain browse (no search, no filter) → null (nothing to learn, no row)", () => {
    expect(buildDirectoryMetric({ limit: "10", offset: "0" }, 40)).toBeNull();
  });

  it("search only → directory_search + trimmed keyword + result count", () => {
    expect(buildDirectoryMetric({ search: "  sushi  " }, 4)).toEqual({
      event_type: ANALYTICS_EVENTS.directorySearch,
      metadata: { search: "sushi", filters: [], result_count: 4 },
    });
  });

  it("filter only → directory_filter + every active filter in a stable order", () => {
    expect(
      buildDirectoryMetric({ halal: "true", mission: "family" }, 7),
    ).toEqual({
      event_type: ANALYTICS_EVENTS.directoryFilter,
      metadata: {
        search: null,
        filters: ["halal", "mission"],
        result_count: 7,
      },
    });
  });

  it("search + filter → search wins the event type, filters stay in metadata", () => {
    const metric = buildDirectoryMetric({ search: "kopi", budget: "mid" }, 0);
    expect(metric?.event_type).toBe(ANALYTICS_EVENTS.directorySearch);
    expect(metric?.metadata.filters).toEqual(["budget"]);
    expect(metric?.metadata.result_count).toBe(0);
  });

  it("hostile input: 200-char keyword is truncated to 80, array search ignored", () => {
    expect(
      buildDirectoryMetric({ search: "x".repeat(200) }, 1)?.metadata.search,
    ).toHaveLength(80);
    expect(buildDirectoryMetric({ search: ["a", "b"] }, 1)).toBeNull();
  });

  it("negative / NaN result count is clamped to 0", () => {
    expect(
      buildDirectoryMetric({ halal: "true" }, Number.NaN)?.metadata
        .result_count,
    ).toBe(0);
  });
});

describe("recordDirectoryMetric (best-effort write)", () => {
  /** Minimal stand-in for the Supabase client — same shape recordDirectoryMetric declares. */
  interface FakeDb {
    rows: unknown[];
    from: () => { insert: (row: unknown) => Promise<void> };
  }

  const fakeDb = (fail: boolean): FakeDb => {
    const rows: unknown[] = [];
    return {
      rows,
      from: () => ({
        insert: async (row: unknown) => {
          if (fail) throw new Error("db down");
          rows.push(row);
        },
      }),
    };
  };

  it("writes one row with the mall slug attached", async () => {
    const db = fakeDb(false);
    await recordDirectoryMetric(
      db,
      buildDirectoryMetric({ search: "sushi" }, 4),
      { mallSlug: "grand-indonesia", sessionId: "sid-1" },
    );
    expect(db.rows).toEqual([
      {
        event_type: ANALYTICS_EVENTS.directorySearch,
        session_id: "sid-1",
        metadata: {
          search: "sushi",
          filters: [],
          result_count: 4,
          mall_slug: "grand-indonesia",
        },
      },
    ]);
  });

  it("null metric → no write; DB failure → swallowed (never breaks the page)", async () => {
    const ok = fakeDb(false);
    await recordDirectoryMetric(ok, null, {
      mallSlug: "x",
      sessionId: "sid-2",
    });
    expect(ok.rows).toHaveLength(0);

    const broken = fakeDb(true);
    await expect(
      recordDirectoryMetric(
        broken,
        buildDirectoryMetric({ halal: "true" }, 1),
        { mallSlug: "x", sessionId: "sid-2" },
      ),
    ).resolves.toBeUndefined();
  });
});
