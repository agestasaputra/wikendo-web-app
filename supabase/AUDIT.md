# Tenant Data V1 Audit — Valid vs Needs Field Survey

**Date:** 6 Oct 2026 | **Source:** `data/tenants-seed.csv` (200 rows, 5 malls x 40, AI-curated dummy)
**Goal:** separate the fields that are good enough for the MVP from those that MUST be verified manually before users can trust them.
**New ground rule (approved):** not researched yet = `NULL` + `needs_survey=TRUE`, not `FALSE`/empty string.

> Honest note: the V1 CSV is 100% filled (no empty cells) — even though the data is AI-generated,
> not survey results. So `needs_survey` after a regenerate = `FALSE` everywhere, and
> `verified_at` = `NULL` everywhere (there has been NO field verification AT ALL).
> This audit decides the survey queue priority, not the machine.

## 1. Summary per field

| Field | Distribution | Confidence | Verdict |
|---|---|---|---|
| `tenant_name` | 200 unique | ~80% — big brand names mostly correct, typos/closed outlets possible | CONDITIONALLY VALID — match during the survey |
| `category` | japanese 47, coffee 24, indonesian 22, fastfood 20, dessert 19, chinese 18, western 17, drinks 16, bakery 12, healthy 5 | ~75% — japanese 47 is too dominant (AI bias), healthy 5 is too few | CONDITIONALLY VALID |
| `floor` | 10 unique values: `G, LG, UG, GF, 1, 3, 3A, 5, Foodprint, Tribeca` | ~50% — `Foodprint` is odd, bare numbers (`1`,`3`,`5`) are ambiguous across malls | NEEDS SURVEY (see §2) |
| `halal` | true 194 / false 6 | LOW for the `true` ones — 97% halal cannot be accurate without research | NEEDS SURVEY PRIORITY 1 |
| `budget_tier` + `price_min`/`price_max` | budget 113 / mid 63 / splurge 24, price 0 empty | ~70% — the pattern is plausible, amounts may drift | CONDITIONALLY VALID |
| `kids_friendly` | true 133 / false 67 | ~60% — 133 kid-friendly sounds like too many | NEEDS SURVEY PRIORITY 3 |
| `mission` | family 90 (!) / quick_bite 59 / long_hangout 38 / healing 7 / combos 6 | IMBALANCE — family 90 vs healing 7, multi-mission only 6 rows (under-tagged) | TEMPORARILY VALID — retag healing/long_hangout during the survey |
| `hype_tiktok` | true 41 / false 159 | TIME-BOUND — hype goes stale within 90 days | NEEDS PERIODIC RE-CHECK (not a field survey) |
| `is_open` | true 200 / false 0 | IMPOSSIBLE — 200/200 always open is unrealistic | NEEDS A REPORTING MECHANISM (a "Lapor tutup/buka" button in the UI) |

## 2. Odd floors per mall (must be checked in the field)

| Mall | Unique floors | Notes |
|---|---|---|
| Grand Indonesia | `1, 3A, 5, Foodprint, G, LG` | `Foodprint` = GI food court zone? non-standard name — unify the format |
| Central Park | `1, LG, Tribeca` | `Tribeca` = a CP zone, valid as an area name but the format is inconsistent |
| Kota Kasablanka | `GF, LG, UG` | Clean ✅ |
| Pondok Indah Mall | `1, 3, GF, LG` | The numbers `1`,`3` are ambiguous (PIM 1/2/3 are separate buildings) — write `PIM1-L1` etc. |
| Aeon BSD | `1, GF` | Clean ✅ |

**Decision:** the floor format is NOT changed now (so the seed keeps working). Standardize during the first mall survey.

## 3. Survey queue (priority)

**P1 — Fatal if wrong:**
1. 6 tenants with `halal=false` — verify they really are non-halal. A wrong claim destroys trust.
2. Spot-check the 20 most popular `halal=true` tenants (McD, HokBen, etc. — known-halal brands are easy).

**P2 — Make the data accurate:**
3. `is_open` — rely on the report button + check during the P1 survey.
4. Odd floors at GI/CP/PIM (§2).
5. `mission` healing/long_hangout — add the missing tags (target: healing ≥20 rows).

**P3 — Nice to have:**
6. `kids_friendly` 133 true — downgrade the overclaims.
7. `hype_tiktok` 41 true — switch the source to periodic TikTok/GMaps review checks, not a survey.

## 4. Using the metadata columns (survey workflow)

```sql
-- Survey queue: rows never verified in the field
SELECT mall_id, name, halal, kids_friendly, hype_tiktok
FROM tenants WHERE verified_at IS NULL ORDER BY mall_id, name;

-- Finished surveying 1 tenant → close its queue entry
UPDATE tenants SET halal=true, kids_friendly=true, hype_tiktok=false,
  data_source='manual', verified_at=NOW(), needs_survey=false
WHERE id='<uuid>';

-- Scrape gate: reject raw non-Jabodetabek rows BEFORE normalization
UPDATE raw_scrape SET status='rejected' WHERE status='pending'
  AND city NOT IN ('Jakarta','Jakarta Selatan','Jakarta Utara','Jakarta Timur',
    'Jakarta Barat','Jakarta Pusat','Bogor','Depok','Tangerang',
    'Tangerang Selatan','Bekasi');
```

## 5. Decisions

1. The V1 seed STAYS for dev/demo (good enough for the flow, not for correctness).
2. Never claim "verified data" to users before P1 is done — the ❓ badge speaks for us.
3. Future scrapes MUST go through `raw_scrape` + the city gate above; empty halal/kids/hype → `NULL`.
