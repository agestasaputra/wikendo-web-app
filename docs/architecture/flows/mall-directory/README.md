---
topic: mall-directory
status: ready
related: [quiz-food, shared-ui]
code:
  - app/pages/mall/index.vue
  - app/pages/mall/[slug].vue
  - app/features/mall/MallListPage.vue
  - app/features/mall/MallDetailPage.vue
  - app/features/mall/components/TenantCard.vue
  - app/features/mall/components/PromoStrip.vue
  - app/features/mall/utils/directory.ts
  - app/features/mall/utils/tenantCard.ts
  - app/common/composables/useInfiniteList.ts
  - app/common/composables/useSentinelObserver.ts
  - app/utils/pagination.ts
  - app/server/api/malls/index.get.ts
  - app/server/api/malls/[slug]/tenants.get.ts
---

# Mall Directory

## TL;DR

`/mall` (hub of 5 malls) and `/mall/:slug` (tenants) are an SEO directory with no login/quota/LLM. Infinite scroll at 10/page (SSR page 1, continues on the client), server-side filter chips (reset the page), client-side keyword search, a promo strip above the list, and a CTA to `/food?mall=slug`.

## Entry Points

- `app/features/mall/MallListPage.vue` — `GET /api/malls?limit&offset`.
- `app/features/mall/MallDetailPage.vue` — `GET /api/malls/:slug/tenants?limit&offset&halal&budget&mission`.

## Sequence

```mermaid
sequenceDiagram
    autonumber
    participant P as MallDetailPage
    participant L as useInfiniteList
    participant S as useSentinelObserver
    participant API as GET /api/malls/:slug/tenants
    P->>L: await start() (SSR page-1)
    L->>API: limit=10 offset=0 + buildTenantQuery(filters)
    API-->>L: { items, total, hasMore }
    S->>L: sentinel enters viewport → loadMore()
    L->>API: offset = items.length
    P->>L: toggleFilter → reset() (reload from 0)
```

1. Without `?limit` the API returns the legacy array (40 tenants); `applyInfinitePage` wraps it (`hasMore` false).
2. Column filters run in SQL; `mission` (array) is filtered in memory; paging is sliced after all filters.
3. `getTenantPromo` derives the promo badge from `promo` or `hype_tiktok` — no fabricated data.

## Key Components

| Component             | File                                            | Role                             |
| --------------------- | ----------------------------------------------- | -------------------------------- |
| `useInfiniteList`     | `app/common/composables/useInfiniteList.ts`     | start / loadMore / reset + state |
| `useSentinelObserver` | `app/common/composables/useSentinelObserver.ts` | IntersectionObserver sentinel    |
| `applyInfinitePage`   | `app/utils/pagination.ts`                       | Merge page + dedupe (pure)       |
| `TenantCard`          | `app/features/mall/components/TenantCard.vue`   | Tenant card S2c                  |
| `PromoStrip`          | `app/features/mall/components/PromoStrip.vue`   | V13C promo strip (max 3)         |

## Data

```json
{
  "items": [
    {
      "name": "Kopi Kekinian",
      "category": "coffee",
      "floor": "2",
      "halal": true
    }
  ],
  "total": 40,
  "hasMore": true
}
```

## Failure & State

- Limit is clamped to max 50; negative offset → 0 (`parsePaginationParams`).
- Mall slug not found → 404; fetch fails → error box + "Coba lagi" (disabled while `pending`).

## See Also

[quiz-food](../quiz-food/README.md)
