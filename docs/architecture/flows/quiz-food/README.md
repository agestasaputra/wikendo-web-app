---
topic: quiz-food
status: ready
related: [quiz-place, quota, llm, voucher-claim, mall-directory, history]
code:
  - app/pages/food.vue
  - app/pages/result-food.vue
  - app/features/food/FoodQuizPage.vue
  - app/features/food/FoodResultPage.vue
  - app/features/food/constants/questions.ts
  - app/features/food/utils/foodQuiz.ts
  - app/features/food/utils/resultHero.ts
  - app/features/food/utils/resultMeta.ts
  - app/features/food/utils/voucherCard.ts
  - app/features/food/components/VoucherSheet.vue
  - app/server/api/food/recommend.post.ts
  - app/server/utils/foodCandidates.ts
  - app/server/utils/tenantFilters.ts
---

# Quiz & Result — Food

## TL;DR

4 questions (mall → mission → budget → group + halal/kids toggles). Coming from the directory (`/food?mall=slug`) skips Q1. The server filters tenants in Supabase (free, max 30), the LLM only ranks the Top 5, and the result is merged with tenant data + a Maps link. Anon gets at most 2x/day.

## Entry Points

- `app/pages/food.vue` → `FoodQuizPage.vue` (`getFoodStartStep(?mall, FOOD_MALL_SLUGS)`).
- `app/pages/result-food.vue` → `FoodResultPage.vue`.
- `app/server/api/food/recommend.post.ts`.

## Sequence

```mermaid
sequenceDiagram
    autonumber
    participant R as FoodResultPage
    participant API as POST /api/food/recommend
    participant C as foodCandidates
    participant DB as Supabase
    participant LLM as rankTenants
    R->>API: POST body=route.query (halal_only:"false" string!)
    API->>API: cookie food_quota_used >= 2 ? 403 FOOD_QUOTA_EXCEEDED
    API->>C: fetchFoodCandidates(db, body)
    C->>DB: malls(slug→id) + tenants(is_open + eq filters) limit 30
    C-->>API: TenantRow[] (empty → 404)
    API->>LLM: rankTenants (retry 1x → deterministic fallback)
    LLM-->>API: RankResult[5]
    API->>DB: insert generations {type: food}
    API-->>R: { recommendations, quota_remaining } + cookie +1
```

1. The `.eq()` filters are built by `buildFoodEqFilters`; `coerceBool` prevents the string `"false"` from turning on the halal filter.
2. Tri-state: `halal`/`kids` NULL are automatically excluded when the filter is on; the UI shows ❓.
3. `toTenantRecommendation` adds `maps_url` (`buildMapsUrl`) and `needs_survey`.
4. In the hero: the gift banner (`Ada -20% buat lu` + `Buka →`) opens `VoucherSheet` (3 seed promos `FOOD_PROMOS`); claiming goes through [voucher-claim](../voucher-claim/README.md).

## Key Components

| Component              | File                                             | Role                                           |
| ---------------------- | ------------------------------------------------ | ---------------------------------------------- |
| `FOOD_QUESTIONS`      | `app/features/food/constants/questions.ts`      | Question data + seed promos + valid slugs     |
| `fetchFoodCandidates` | `app/server/utils/foodCandidates.ts`            | Tenant candidates (404 if mall/tenants empty)|
| `buildFoodEqFilters`  | `app/server/utils/tenantFilters.ts`              | Body → eq conditions (pure, tested)          |
| `buildFoodHero/Chips` | `app/features/food/utils/resultHero.ts`         | Hero data, chips, rank #1–3                  |
| `VoucherSheet`         | `app/features/food/components/VoucherSheet.vue` | 3-promo picker + Klaim per row               |

## Data

```json
{
  "recommendations": [
    {
      "name": "Kopi Kekinian",
      "category": "coffee",
      "floor": "2",
      "halal": true,
      "budget_tier": "mid",
      "price_min": 50000,
      "price_max": 100000,
      "kids_friendly": null,
      "hype_tiktok": false,
      "reason": "Cocok buat nongkrong",
      "maps_url": "https://www.google.com/maps/search/Kopi%20Kekinian%20grand-indonesia",
      "data_source": "curated",
      "needs_survey": true
    }
  ],
  "quota_remaining": 1
}
```

## Failure & State

- Quota exhausted → `403 FOOD_QUOTA_EXCEEDED`; mall not found → 404; no candidates → 404 ("Tidak ada tenant cocok").
- LLM returns a wrong format / hallucinated names → retry 1x → `buildRankFallback` (Food never returns 500 because of the LLM).
- The `food_quota_used` cookie (maxAge 1 day) is incremented by 1 only on success.

## See Also

[quota](../quota/README.md) · [llm](../llm/README.md) · [voucher-claim](../voucher-claim/README.md) · [mall-directory](../mall-directory/README.md)
