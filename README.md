# Wikendo — Project Repository (`wikendo-web-app`)

**Status:** Planning & Design Phase  
**Started:** 2026-10-05  
**Owner:** Agesta  
**Tech Stack:** Nuxt 3 + Supabase + Hermes-combo  

---

## 📁 Project Structure

```
wikendo-web-app/
├── docs/                           # Complete documentation (01–09 inti, 10–16 mirror, 17 indeks desain)
│   ├── 01-PRD.md … 06-MVP-Checklist.md  # Dok inti (PRD, ADR, Journey, Schema, API, Checklist)
│   ├── 07-PRD-Addendum-Mall-F&B.md      # Scope mall + tenant F&B (quota makan 5/hari)
│   ├── 08-PROGRESS.md                  # Board + log eksekusi (sumber "udah sampai mana?")
│   ├── 09-PRD-Addendum-Revamp-Combo-Auth.md  # Kombo 5+10+15 + progressive login (APPROVED)
│   ├── 10-App-Guide.md                 # MIRROR dari app/README.md (jangan edit, re-sync)
│   ├── 11-AGENTS-App.md                # POINTER ke /AGENTS.md (isi lama dipindah)
│   ├── 12-Supabase-Guide.md            # MIRROR dari supabase/README.md
│   ├── 13-Data-Audit-Tenant-V1.md      # MIRROR dari supabase/AUDIT.md
│   ├── 14-Prototype-Guide.md           # MIRROR dari design/prototype/README.md
│   ├── 15-Wireframes.md                # MIRROR dari design/wikendo-wireframes.md
│   ├── 16-Repo-Overview.md             # MIRROR dari README.md (file ini)
│   ├── 17-Design-Index.md              # Indeks aset design/ (logo D16 P3 + board revamp)
│   └── wikendo-complete-docs.pdf  # All docs in PDF (161KB)
│
├── design/                         # UI/UX design assets
│   ├── wikendo-wireframes.md      # Text wireframes (26KB)
│   └── prototype/                         # Interactive HTML prototype
│       ├── index.html             # Landing page + modals
│       ├── quiz.html              # Interactive quiz flow
│       ├── result.html            # Recommendation results
│       └── README.md              # Prototype testing guide
│
└── README.md                       # This file
```

---

## 🎯 Project Overview

**Problem:** Decision fatigue saat planning weekend di Jabodetabek  
**Solution:** Quiz 30 detik → AI generate 5 rekomendasi tempat personal  

**Target Users:**
- Usia 20-35 tahun
- Jabodetabek residents
- Value convenience over research

**Business Model (MVP):**
- Pure FREE (no monetization)
- 2 quota per user per day (daily reset)
- Add premium only after PMF (500+ users, 30%+ retention)

---

## 🏗️ Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Nuxt 3 + TypeScript + Tailwind | Vue ecosystem, SSR, file-based routing |
| **Backend** | Nuxt Server Routes | No separate backend needed |
| **Database** | Supabase (PostgreSQL) | Free tier, built-in auth, RLS |
| **LLM** | Hermes-combo (9router) | Existing setup, no per-request cost |
| **Auth** | Supabase Auth | Email/password + Google OAuth |
| **Analytics** | Google Analytics 4 | Free, unlimited events |
| **Hosting** | Vercel Hobby | Zero-config, free tier |
| **Cost** | **$0/month** | All free tiers |

---

## 📊 Key Metrics

### Success Criteria (2 weeks post-launch)

**Minimum Viable:**
- 50+ registered users
- 60%+ quiz completion rate
- 40%+ recommendation click-through
- 20%+ day-2 return rate

**Strong Success:**
- 100+ registered users
- 75%+ quiz completion rate
- 60%+ recommendation click-through
- 30%+ day-2 return rate

---

## 🎨 Design System

**Style:** Modern Indonesian Casual (Gojek + Traveloka vibe)  
**Colors:**
- Primary: Teal (#0891b2) - Trust, fresh
- Accent: Orange (#f97316) - Energy, CTA
- Neutral: Gray scale

**Components:** Nuxt UI (Tailwind-based)  
**Principles:** Mobile-first, conversion-focused, trust signals

**Prototype Status:** ✅ Approved by Agesta

---

## ⏱️ Timeline

### Phase 1: Setup & Backend (Week 1)
- [ ] Nuxt 3 project init
- [ ] Supabase setup (database + auth)
- [ ] Database migrations
- [ ] Hermes-combo integration
- [ ] API routes implementation
**Estimate:** 28 hours

### Phase 2: Frontend Core (Week 2)
- [ ] Landing page
- [ ] Quiz flow (5-6 questions)
- [ ] Result page (5 cards)
- [ ] Auth modals (login/register)
- [ ] State management (quota, session)
**Estimate:** 24 hours

### Phase 3: Polish & Launch (Week 3)
- [ ] Analytics integration (GA4)
- [ ] Testing (manual + basic E2E)
- [ ] Error handling & loading states
- [ ] Deployment to Vercel
- [ ] Soft launch to 30-50 users
**Estimate:** 12 hours

**Total P0:** 64 hours = **13-16 days** (4-5h/day solo)

---

## 🚀 Launch Plan

1. **Week 1-2:** Build MVP (all P0 features)
2. **Week 3:** Soft launch to personal network (30-50 users)
3. **Week 4-5:** Iterate based on feedback
4. **Week 6+:** Public launch (social media, Product Hunt)

---

## 💰 Business Strategy

### Monetization Timeline
**MVP (Month 1-2):** Pure free, focus on PMF

**Add Premium When:**
- 500+ registered users
- 30%+ DAU/MAU ratio
- 20%+ weekly retention
- OR LLM cost > budget

**Premium Tier Ideas (Post-PMF):**
- Unlimited generations
- Advanced filters (distance, rating)
- Group planning features
- Priority support

---

## 🔐 Quota System

| User Type | Daily Quota | Reset Time |
|-----------|-------------|------------|
| Anonymous | 1 generation | 00:00 WIB |
| Registered | 2 generations | 00:00 WIB |

**Rules:**
- Each generation = 5 recommendations
- Regenerate/skip counts as quota
- Must login to use 2nd quota
- Hard limit enforced server-side

---

## 📝 Database Schema (Summary)

```sql
-- 5 main tables
user_profiles        -- Phone, preferences
user_quota          -- Daily quota tracking
generation_sessions -- All generation history
user_favorites      -- Saved recommendations (P1)
analytics_events    -- Internal cost tracking
```

Full schema: `docs/04-Database-Schema.md`

---

## 🔌 API Endpoints (Summary)

```
POST   /api/generate           # Generate recommendations ⭐
GET    /api/quota              # Check quota status
POST   /api/auth/register      # Signup
POST   /api/auth/login         # Login
POST   /api/auth/logout        # Logout
GET    /api/auth/callback      # OAuth callback
GET    /api/history            # View history (P1)
POST   /api/favorites          # Save favorite (P1)
GET    /api/health             # Health check
```

Full spec: `docs/05-API-Specification.md`

---

## 🧪 Testing Strategy

### Manual Testing
- [ ] Landing page (all devices)
- [ ] Quiz flow (5 questions + conditional)
- [ ] Result page (cards, maps, favorites)
- [ ] Auth (email + Google OAuth)
- [ ] Quota system (anonymous vs registered)
- [ ] Error states (network, API failure)

### Automated (P1)
- Unit tests for utils/helpers
- Integration tests for API routes
- E2E tests with Playwright (critical flows)

---

## 📚 Documentation Status

| Document | Status | Location |
|----------|--------|----------|
| PRD v2.0 | ✅ Done | `docs/01-PRD.md` |
| ADR v2.0 | ✅ Done | `docs/02-ADR.md` |
| User Journey v2.0 | ✅ Done | `docs/03-User-Journey.md` |
| Database Schema | ✅ Done | `docs/04-Database-Schema.md` |
| API Specification | ✅ Done | `docs/05-API-Specification.md` |
| MVP Checklist | ✅ Done | `docs/06-MVP-Checklist.md` |
| UI Wireframes | ✅ Done | `design/wikendo-wireframes.md` |
| HTML Prototype | ✅ Done | `design/prototype/` |
| Complete PDF | ✅ Done | `docs/wikendo-complete-docs.pdf` |

---

## ⚠️ Known Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM hallucination (fake venues) | High | Prompt engineering + user feedback loop |
| LLM cost explosion | Medium | Hard quota limit + daily monitoring |
| Low quiz completion rate | High | A/B test copy, reduce friction |
| Poor recommendation quality | High | Iterate system prompt, collect feedback |
| Auth friction (phone required) | Medium | Make phone optional in MVP |

---

## 📞 Contact & Support

**Project Owner:** Agesta  
**Tech Stack:** Nuxt 3 + Supabase + Hermes-combo  
**Repository:** `/home/ubuntu/wikendo-web-app/` (GitHub: `wikendo-web-app`, private)

---

## 🎯 Current Phase

**Status:** ✅ Planning & Design Complete  
**Next:** Start Phase 1 (Setup & Backend)  
**Waiting:** Approval to begin coding

---

**Last Updated:** 2026-10-05  
**Version:** 1.0
