/**
 * historyRow.spec.ts — RED test (TDD) for the `generations` row → HistoryEntry mapper.
 *
 * WHAT: locks the DB row → UI entry contract so /history never renders blank rows.
 * WHY: HistoryPage currently does `history.items = response.items` (raw rows) which renders
 *   `undefined` titles + `timeAgo(undefined)` → NaN. The row shape is
 *   `{ quiz_input, recommendations, created_at }`, the UI shape is `{ kind, title, sub, at }`.
 * EXAMPLE: toHistoryEntry({ quiz_input: { type: "food", mall_slug: "grand-indonesia" },
 *   recommendations: [{ name: "Kopi", floor: "2" }], created_at: "2026-10-18T10:00:00Z" })
 *   → { kind: "food", title: "Kopi", sub: "L2 · GI", at: 1760781600000 }
 */
import { describe, it, expect } from "vitest";
import { toHistoryEntry, toHistoryEntries } from "../historyRow";

const CREATED = "2026-10-18T10:00:00.000Z";
const AT = new Date(CREATED).getTime();

describe("toHistoryEntry — place rows", () => {
  it("maps name + location_area, kind place", () => {
    const entry = toHistoryEntry({
      quiz_input: { type: "place", location: "south-jakarta" },
      recommendations: [
        {
          name: "Kopi Kekinian",
          category: "cafe",
          location_area: "Senopati",
          reason: "x",
        },
      ],
      created_at: CREATED,
    });
    expect(entry).toEqual({
      kind: "place",
      title: "Kopi Kekinian",
      sub: "Senopati",
      at: AT,
    });
  });

  it("falls back to category when location_area is empty", () => {
    const entry = toHistoryEntry({
      quiz_input: { type: "place" },
      recommendations: [{ name: "A", category: "cafe", location_area: "" }],
      created_at: CREATED,
    });
    expect(entry.sub).toBe("cafe");
  });
});

describe("toHistoryEntry — food rows", () => {
  it("builds 'L<floor> · <mall short label>' sub, kind food", () => {
    const entry = toHistoryEntry({
      quiz_input: { type: "food", mall_slug: "grand-indonesia" },
      recommendations: [{ name: "Kopi Kenangan", floor: "2" }],
      created_at: CREATED,
    });
    expect(entry).toEqual({
      kind: "food",
      title: "Kopi Kenangan",
      sub: "L2 · GI",
      at: AT,
    });
  });

  it("omits the floor when it is missing", () => {
    const entry = toHistoryEntry({
      quiz_input: { type: "food", mall_slug: "aeon-bsd" },
      recommendations: [{ name: "Sushi" }],
      created_at: CREATED,
    });
    expect(entry.sub).toBe("Aeon");
  });

  it("uses the raw slug when the mall is unknown (no crash)", () => {
    const entry = toHistoryEntry({
      quiz_input: { type: "food", mall_slug: "mall-baru" },
      recommendations: [{ name: "Sushi", floor: "1" }],
      created_at: CREATED,
    });
    expect(entry.sub).toBe("L1 · mall-baru");
  });
});

describe("toHistoryEntry — defensive mapping (never blank / never NaN)", () => {
  it("missing recommendations → title '—', sub ''", () => {
    const entry = toHistoryEntry({
      quiz_input: { type: "place" },
      recommendations: null,
      created_at: CREATED,
    });
    expect(entry.title).toBe("—");
    expect(entry.sub).toBe("");
  });

  it("empty recommendations array → title '—'", () => {
    const entry = toHistoryEntry({
      quiz_input: null,
      recommendations: [],
      created_at: CREATED,
    });
    expect(entry.title).toBe("—");
    expect(entry.kind).toBe("place");
  });

  it("recommendation without a name → title '—'", () => {
    const entry = toHistoryEntry({
      quiz_input: { type: "food" },
      recommendations: [{ floor: "2" }],
      created_at: CREATED,
    });
    expect(entry.title).toBe("—");
  });

  it("missing/invalid created_at → at 0 (timeAgo stays finite)", () => {
    expect(
      toHistoryEntry({ quiz_input: { type: "place" }, recommendations: [] }).at,
    ).toBe(0);
    expect(
      toHistoryEntry({
        quiz_input: { type: "place" },
        recommendations: [],
        created_at: "bukan-tanggal",
      }).at,
    ).toBe(0);
  });

  it("unknown quiz_input.type → place (safe default)", () => {
    const entry = toHistoryEntry({
      quiz_input: { type: "entah" },
      recommendations: [{ name: "X" }],
      created_at: CREATED,
    });
    expect(entry.kind).toBe("place");
  });
});

describe("toHistoryEntries — list mapping", () => {
  it("maps every row, preserving order", () => {
    const list = toHistoryEntries([
      {
        quiz_input: { type: "food", mall_slug: "grand-indonesia" },
        recommendations: [{ name: "A", floor: "1" }],
        created_at: CREATED,
      },
      {
        quiz_input: { type: "place" },
        recommendations: [{ name: "B", location_area: "Kemang" }],
        created_at: CREATED,
      },
    ]);
    expect(list.map((e) => e.title)).toEqual(["A", "B"]);
    expect(list.map((e) => e.kind)).toEqual(["food", "place"]);
  });

  it("non-array input → []", () => {
    expect(toHistoryEntries(null)).toEqual([]);
    expect(toHistoryEntries(undefined)).toEqual([]);
  });
});
