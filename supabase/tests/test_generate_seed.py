"""Unit tests for supabase/generate_seed.py (TDD: RED first, GREEN once the generator exists).

WHAT: tests the pure CSV → SQL conversion functions (parse mission, escape quote, bool, mall meta).
WHY: one unescaped quote (McDonald's) = the whole seed fails in Supabase. These tests guard that.
Run: cd supabase && python3 -m pytest tests/ -q  (or: npm run test:seed from app/)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from generate_seed import (
    MALL_META,
    parse_mission,
    parse_price,
    sql_escape,
    tenant_to_sql,
    to_bool,
    to_bool_nullable,
)


def test_parse_mission_single():
    assert parse_mission("family") == ["family"]


def test_parse_mission_pipe():
    assert parse_mission("quick_bite|family") == ["quick_bite", "family"]


def test_parse_mission_empty():
    assert parse_mission("") == []


def test_sql_escape_quote():
    # McDonald's & Roti'O are in the CSV — one unescaped quote = every INSERT fails
    # McDonald's has just 1 apostrophe → escaped to McDonald''s (2 quotes = 1 literal)
    assert sql_escape("McDonald's") == "McDonald''s"
    assert sql_escape("Roti'O") == "Roti''O"


def test_sql_escape_plain():
    assert sql_escape("HokBen") == "HokBen"


def test_to_bool():
    assert to_bool("true") is True
    assert to_bool("false") is False


def test_to_bool_nullable_empty_is_none():
    # New rule (approved): a field not researched yet → NULL, not FALSE.
    # Empty/"unknown"/"-" from scrape|deep-research = unknown, not non-halal.
    assert to_bool_nullable("") is None
    assert to_bool_nullable("unknown") is None
    assert to_bool_nullable("-") is None
    assert to_bool_nullable("true") is True
    assert to_bool_nullable("false") is False


def test_tenant_to_sql_null_halal_sets_needs_survey():
    # A scraped tenant without halal info → halal NULL + needs_survey TRUE,
    # so it enters the manual survey queue & is excluded from the halal-only filter.
    row = {
        "mall_slug": "grand-indonesia",
        "tenant_name": "Tenant Baru X",
        "category": "coffee",
        "floor": "LG",
        "halal": "",
        "budget_tier": "budget",
        "price_min": "",
        "price_max": "",
        "kids_friendly": "",
        "mission": "long_hangout",
        "hype_tiktok": "",
        "is_open": "true",
    }
    sql = tenant_to_sql(row)
    assert "NULL" in sql
    assert "'scrape'" in sql or "'curated'" in sql
    assert "needs_survey" in sql.lower() or "TRUE" in sql


def test_mall_meta_5_malls():
    assert len(MALL_META) == 5
    slugs = {m["slug"] for m in MALL_META}
    assert slugs == {
        "grand-indonesia",
        "central-park",
        "kota-kasablanka",
        "pondok-indah-mall",
        "aeon-bsd",
    }


def test_tenant_to_sql_uses_mission_array():
    row = {
        "mall_slug": "grand-indonesia",
        "tenant_name": "McDonald's",
        "category": "fastfood",
        "floor": "LG",
        "halal": "true",
        "budget_tier": "budget",
        "price_min": "30000",
        "price_max": "70000",
        "kids_friendly": "true",
        "mission": "quick_bite|family",
        "hype_tiktok": "false",
        "is_open": "true",
    }
    sql = tenant_to_sql(row)
    assert "McDonald''s" in sql
    assert "ARRAY['quick_bite','family']" in sql
    assert "WHERE slug='grand-indonesia'" in sql


def test_parse_price_integer_rupiah():
    assert parse_price("30000") == 30000
    assert parse_price(" 150000 ") == 150000


def test_parse_price_empty_is_none():
    # Unknown price → NULL (same tri-state idea as halal/kids/hype)
    assert parse_price("") is None
    assert parse_price(None) is None


def test_parse_price_rejects_bad_values():
    for bad in ("Rp 30-70rb", "30.5", "-1", "abc"):
        try:
            parse_price(bad)
        except ValueError:
            continue
        raise AssertionError("expected ValueError for %r" % bad)


def test_tenant_to_sql_writes_integer_price_columns():
    row = {
        "mall_slug": "grand-indonesia",
        "tenant_name": "HokBen",
        "category": "japanese",
        "floor": "3A",
        "halal": "true",
        "budget_tier": "budget",
        "price_min": "30000",
        "price_max": "80000",
        "kids_friendly": "true",
        "mission": "quick_bite",
        "hype_tiktok": "false",
        "is_open": "true",
    }
    sql = tenant_to_sql(row)
    assert "price_min, price_max" in sql
    assert "30000, 80000" in sql
    assert "price_range" not in sql


def test_tenant_to_sql_min_above_max_raises():
    row = {
        "mall_slug": "grand-indonesia",
        "tenant_name": "X",
        "category": "coffee",
        "floor": "1",
        "halal": "true",
        "budget_tier": "mid",
        "price_min": "90000",
        "price_max": "30000",
        "kids_friendly": "true",
        "mission": "family",
        "hype_tiktok": "false",
        "is_open": "true",
    }
    try:
        tenant_to_sql(row)
    except ValueError:
        return
    raise AssertionError("expected ValueError when price_min > price_max")
