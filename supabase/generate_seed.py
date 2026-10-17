"""Generate supabase/seed.sql from data/tenants-seed.csv (200 rows, 5 malls x 40).

WHAT: reads the CSV → writes seed.sql with INSERT malls + INSERT tenants, ready to paste into the Supabase SQL Editor.
WHY a script (not hand-written SQL): the CSV has traps — quotes in names (McDonald's, D'Crepes,
Roti'O), pipe-separated mission (quick_bite|family → TEXT[]), text bools → TRUE/FALSE. One miss = the seed fails.
The script + unit test (tests/test_generate_seed.py) guard against that.

Usage:
  cd supabase && python3 generate_seed.py   → writes seed.sql
  python3 -m pytest tests/ -q               → verify the conversion

Idempotent: malls use ON CONFLICT(slug) DO UPDATE; tenants are DELETEd per mall first, then INSERTed
(tenants has no unique constraint yet, so a rerun without the DELETE = duplicates).
"""

from __future__ import annotations

import csv
import os
from urllib.parse import quote_plus

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "..", "data", "tenants-seed.csv")
OUT_PATH = os.path.join(BASE_DIR, "seed.sql")

# Mall metadata NOT in the CSV (city/area). Order = INSERT order (keeps the output tidy).
# total_tenant is filled automatically = CSV row count per mall (must be 40, checked on generate).
MALL_META = [
    {"slug": "grand-indonesia", "name": "Grand Indonesia", "city": "Jakarta", "area": "Thamrin / Menteng"},
    {"slug": "central-park", "name": "Central Park", "city": "Jakarta", "area": "Tanjung Duren / Grogol"},
    {"slug": "kota-kasablanka", "name": "Kota Kasablanka", "city": "Jakarta", "area": "Tebet"},
    {"slug": "pondok-indah-mall", "name": "Pondok Indah Mall", "city": "Jakarta", "area": "Pondok Indah"},
    {"slug": "aeon-bsd", "name": "Aeon Mall BSD City", "city": "Tangerang Selatan", "area": "BSD City"},
]

VALID_BUDGET = ("budget", "mid", "splurge")


def parse_mission(raw: str) -> list:
    """'quick_bite|family' → ['quick_bite', 'family']. Empty → []."""
    raw = (raw or "").strip()
    if not raw:
        return []
    return [m.strip() for m in raw.split("|") if m.strip()]


def sql_escape(s: str) -> str:
    """Escape quotes for a SQL literal: McDonald's → McDonald''s."""
    return (s or "").replace("'", "''")


def to_bool(raw: str) -> bool:
    """CSV 'true'/'false' → Python bool (written as TRUE/FALSE in SQL)."""
    return (raw or "").strip().lower() == "true"


def to_bool_nullable(raw: str) -> bool | None:
    """NULL-safe version: empty/unknown/-/null → None (= not researched yet, not FALSE).

    WHAT: distinguishes 'no' from 'don't know' for the halal/kids/hype fields.
    WHY: '' → FALSE is a dangerous overclaim (e.g. non-halal when it was never researched).
    NULL + needs_survey=TRUE = queued for the manual survey, excluded from the halal-only filter.
    """
    s = (raw or "").strip().lower()
    if s in ("", "unknown", "-", "null", "na", "n/a", "?"):
        return None
    if s == "true":
        return True
    if s == "false":
        return False
    return None


def sql_bool_nullable(v: bool | None) -> str:
    """Python bool|None → SQL literal TRUE/FALSE/NULL."""
    if v is None:
        return "NULL"
    return "TRUE" if v else "FALSE"


def parse_price(raw: str | None) -> int | None:
    """CSV price bound → integer rupiah, or None when empty (= unknown, stored as NULL).

    WHY integers: the DB stores numbers, the UI formats "Rp 30-80rb" (see app/utils/price.ts).
    Raises ValueError for anything that is not a non-negative whole number.
    """
    s = (raw or "").strip()
    if not s:
        return None
    if not s.isdigit():
        raise ValueError("price must be a non-negative integer (rupiah): %r" % raw)
    return int(s)


def sql_int_nullable(v: int | None) -> str:
    """Python int|None → SQL literal number or NULL."""
    return "NULL" if v is None else str(v)


def mission_to_sql(raw: str) -> str:
    """CSV mission → TEXT[] literal: ARRAY['a','b'], or '{}' when empty."""
    parts = parse_mission(raw)
    if not parts:
        return "'{}'"
    return "ARRAY[" + ",".join("'%s'" % sql_escape(p) for p in parts) + "]"


def tenant_to_sql(row: dict) -> str:
    """1 CSV row → 1 INSERT INTO tenants statement (mall_id via slug subselect).

    NULL rule (approved): empty halal/kids/hype → NULL (not FALSE).
    + metadata columns: data_source ('curated' V1 / 'scrape' / 'deep_research' / 'manual'),
      verified_at (NULL = not verified in the field), needs_survey
      (TRUE if any field is NULL → queued for the manual survey).
    """
    if row["budget_tier"] not in VALID_BUDGET:
        raise ValueError("budget_tier invalid: %r (%s)" % (row["budget_tier"], row["tenant_name"]))
    price_min = parse_price(row.get("price_min"))
    price_max = parse_price(row.get("price_max"))
    if price_min is not None and price_max is not None and price_min > price_max:
        raise ValueError("price_min > price_max (%s)" % row["tenant_name"])
    halal_v = to_bool_nullable(row.get("halal", ""))
    kids_v = to_bool_nullable(row.get("kids_friendly", ""))
    hype_v = to_bool_nullable(row.get("hype_tiktok", ""))
    needs_survey = halal_v is None or kids_v is None or hype_v is None
    data_source = (row.get("data_source") or "curated").strip() or "curated"
    verified_raw = (row.get("verified_at") or "").strip()
    verified_sql = "'%s'" % sql_escape(verified_raw) if verified_raw else "NULL"
    return (
        "INSERT INTO tenants (mall_id, name, category, floor, halal, budget_tier, "
        "price_min, price_max, kids_friendly, mission, hype_tiktok, is_open, maps_url, "
        "data_source, verified_at, needs_survey) VALUES ("
        "(SELECT id FROM malls WHERE slug='{slug}'), "
        "'{name}', '{cat}', '{floor}', {halal}, '{budget}', {pmin}, {pmax}, "
        "{kids}, {mission}, {hype}, {open}, NULL, "
        "'{ds}', {verified}, {survey});"
    ).format(
        slug=row["mall_slug"],
        name=sql_escape(row["tenant_name"]),
        cat=sql_escape(row["category"]),
        floor=sql_escape(row["floor"]),
        halal=sql_bool_nullable(halal_v),
        budget=row["budget_tier"],
        pmin=sql_int_nullable(price_min),
        pmax=sql_int_nullable(price_max),
        kids=sql_bool_nullable(kids_v),
        mission=mission_to_sql(row["mission"]),
        hype=sql_bool_nullable(hype_v),
        open="TRUE" if to_bool(row.get("is_open", "true")) else "FALSE",
        ds=sql_escape(data_source),
        verified=verified_sql,
        survey="TRUE" if needs_survey else "FALSE",
    )


def main() -> None:
    with open(CSV_PATH, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))

    slugs_csv = {r["mall_slug"] for r in rows}
    slugs_meta = {m["slug"] for m in MALL_META}
    assert slugs_csv == slugs_meta, "mall CSV vs MALL_META differ: %s vs %s" % (slugs_csv, slugs_meta)

    per_mall: dict = {}
    for r in rows:
        per_mall.setdefault(r["mall_slug"], []).append(r)
    for slug, items in per_mall.items():
        assert len(items) == 40, "%s has only %d rows (must be 40)" % (slug, len(items))

    lines = [
        "-- seed.sql — AUTO-GENERATED by generate_seed.py, DO NOT edit by hand.",
        "-- Source: data/tenants-seed.csv (%d rows). Regenerate: cd supabase && python3 generate_seed.py" % len(rows),
        "-- Usage: paste this ENTIRE file into Supabase Dashboard → SQL Editor → Run.",
        "-- Idempotent: safe to re-run (malls upsert, tenants delete+insert per mall).",
        "",
        "-- 1. Malls (5 rows)",
    ]
    for m in MALL_META:
        maps = "https://www.google.com/maps/search/?api=1&query=" + quote_plus(m["name"] + " " + m["city"])
        lines.append(
            "INSERT INTO malls (slug, name, city, area, maps_url, total_tenant) VALUES ("
            "'{slug}', '{name}', '{city}', '{area}', '{maps}', {total}) "
            "ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, city=EXCLUDED.city, "
            "area=EXCLUDED.area, maps_url=EXCLUDED.maps_url, total_tenant=EXCLUDED.total_tenant;".format(
                slug=m["slug"],
                name=sql_escape(m["name"]),
                city=sql_escape(m["city"]),
                area=sql_escape(m["area"]),
                maps=maps,
                total=len(per_mall[m["slug"]]),
            )
        )

    lines += [
        "",
        "-- 2. Tenants (200 rows): delete first so a rerun does not duplicate, then insert fresh.",
        "DELETE FROM tenants WHERE mall_id IN (SELECT id FROM malls WHERE slug IN "
        "('grand-indonesia','central-park','kota-kasablanka','pondok-indah-mall','aeon-bsd'));",
        "",
    ]
    for m in MALL_META:
        lines.append("-- %s (%d tenants)" % (m["name"], len(per_mall[m["slug"]])))
        for r in per_mall[m["slug"]]:
            lines.append(tenant_to_sql(r))
    lines += [
        "",
        "-- 3. Verification (a count mismatch = the seed failed, do not continue):",
        "-- SELECT m.slug, m.total_tenant, COUNT(t.id) AS aktual FROM malls m",
        "-- LEFT JOIN tenants t ON t.mall_id = m.id GROUP BY m.slug, m.total_tenant ORDER BY m.slug;",
    ]

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print("OK: %d rows → %s" % (len(rows), OUT_PATH))


if __name__ == "__main__":
    main()
