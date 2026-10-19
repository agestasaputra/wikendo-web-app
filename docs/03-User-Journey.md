# User Journey — Weekend Planner MVP

**Version:** 2.1 (Oct 7, 2026 — Addendum 09 v1.3 patch: progressive auth + 5+10+15 combo + voucher)
**Date:** October 5, 2026 (original) + Oct 7, 2026 patch
**Status:** Final + v1.3 patch LOCKED

---

## Overview

Weekend Planner has 2 main user types with distinct journeys:
1. **Anonymous Users** (first-time visitors, no account)
2. **Registered Users** (logged-in)

**Quota Rules (patch Addendum 09 v1.3 — split + progressive, LOCKED):**
- **Place** (`/quiz`→`/result`): 2/day (anonymous 1x cookie `quota_used`, logged in 2x)
- **Food** (`/food`→`/result-food`): 5/day SEPARATE (anonymous 2x cookie `food_quota_used`, logged in 5x, does not eat into place quota)
- **Food voucher claims REQUIRE login** (1 user per tenant/day, anti-farming)
- **Locked for anonymous:** Save/Wishlist/History. **Allowed for anonymous:** full result + Maps + Report closed/open + Vote + read-only share
- **4 login wall moments:** 2nd place generate / 3rd food generate → 403 LOGIN_REQUIRED; tap Save/Claim voucher → login bottom sheet; anonymous opens Wishlist/History → prompt; quota exhausted → 00.00 countdown + login button
- Each generate: **5 recommendations** (place + food never mixed)
- Reset 00:00 WIB | LLM fail → quota not deducted | clear-storage abuse accepted at soft launch (growth > strict)

---

## Journey 1: Anonymous User (First Visit)

### Step 1: Landing Page (`/`)

**Goal:** Convert visitor to quiz starter

**Elements:**
- Hero headline: "Bingung Weekend Ngapain? Kami Bantu Putuskan!"
- Subheadline: "5 pertanyaan singkat → 5 rekomendasi tempat yang pas buatmu"
- Primary CTA: "Mulai Sekarang" (large button)
- Trust signals: "Gratis • 30 detik • Tanpa login dulu"
- Optional: Social proof ("1,247 orang udah dapat rekomendasi minggu ini")

**User Action:**
→ Click "Mulai Sekarang"  
→ Navigate to `/quiz`

**Analytics:**
```javascript
gtag('event', 'landing_cta_clicked')
```

---

### Step 2: Quiz Page (`/quiz`)

**Goal:** Collect enough context for quality recommendations

**UI Structure:**
- Progress indicator (Question 2 of 5)
- One question at a time (mobile-first)
- Large tap targets (radio buttons)
- "Lanjut" button (enabled after selection)

**Questions:**

1. **"Weekend ini lu pengen yang gimana?"**
   - Relaxed/healing 🧘
   - Active/adventure 🏃
   - Productive (working while enjoying it) 💼
   - Quality time with loved ones ❤️
   - Other (text input)

2. **"Sama siapa?"**
   - Alone 🚶
   - Partner (2 people) 💑
   - Friends (2-4 people) 👥
   - Small family, with kids 👨‍👩‍👧
   - Extended family 👨‍👩‍👧‍👦

3. **"Usia anak?"** (conditional, only if family with kids)
   - Toddlers (0-5 years)
   - Elementary school (6-12 years)
   - Teens (13+ years)
   - No kids

4. **"Budget per orang?"**
   - Frugal (<100k) 💵
   - Mid-range (100k-300k) 💴
   - Comfortable (>300k) 💰

5. **"Mau kemana?"**
   - Around Jabodetabek 🌆
   - Far, up for a road trip 🚗
   - Other (text input for the city)

6. **"Waktu?"** (optional)
   - Morning (before 12:00) ☀️
   - Midday/Afternoon (12:00-18:00) 🌤️
   - All day (morning until night) 🌙

**User Action:**
→ Answer all required questions  
→ Click "Generate Rekomendasi"  
→ Navigate to loading state → `/result`

**Analytics:**
```javascript
gtag('event', 'quiz_started')
// On each answer
gtag('event', 'quiz_question_answered', { question_num: 1 })
// On completion
gtag('event', 'quiz_completed', {
  mood: mood,
  companion: companion,
  budget: budget,
  location: location
})
```

---

### Step 3: Loading State

**Duration:** 2-5 seconds (LLM API call)

**UI:**
- Centered spinner or progress animation
- Text: "Lagi cariin tempat yang cocok buat kamu..."
- Optional: Rotating tips
  - "Pro tip: Cek jam operasional di Google Maps dulu ya"
  - "Jangan lupa booking kalau weekend rame!"
  - "Ajak teman untuk lebih seru 🎉"

**Background Process:**
```
1. Server receives quiz data
2. Check quota (anonymous: max 1)
3. Generate session_id (cookie)
4. Call Hermes-combo API
5. Parse JSON response
6. Save to database
7. Increment quota counter
8. Return 5 recommendations
```

**Error Handling:**
- If API fails → Show error modal, don't count quota
- If timeout (>15s) → Show retry option
- If quota exceeded → Show login prompt

---

### Step 4: Result Page - First Generation (`/result?session=xxx`)

**Header:**
- Title: "Ini Rekomendasi Weekend Buat Kamu!"
- Quota indicator: "🎁 1x gratis sudah dipakai • Login untuk 1x lagi"

**Main Content: 5 Recommendation Cards**

```
┌────────────────────────────────────────┐
│ 🏖️ Pantai Ancol                         │
│ [Badge: Outdoor • Wisata]              │
│                                         │
│ Why it fits:                           │
│ "Perfect untuk quality time bareng     │
│ pasangan dengan suasana santai. Ada    │
│ area tenang jauh dari keramaian."      │
│                                         │
│ 💰 Budget: Rp 150k - 250k/person       │
│ 📍 Area: North Jakarta                 │
│ ⏰ Best time: Sat, 16:00-18:00         │
│                                         │
│ [Button: 📍 Lihat di Maps]             │
│ [Button: 💾 Simpan] (login required)   │
└────────────────────────────────────────┘

[4 more cards...]
```

**Actions Available:**

1. **"Lihat di Maps"** - Opens Google Maps search in new tab
   ```javascript
   window.open(`https://www.google.com/maps/search/${encodeURIComponent(name + ' ' + area)}`)
   gtag('event', 'recommendation_clicked', { index, action: 'maps' })
   ```

2. **"Simpan"** - Shows login modal (feature requires auth)
   ```javascript
   if (!user) {
     showLoginModal()
     gtag('event', 'login_prompted', { reason: 'save_favorite' })
   }
   ```

3. **"Generate Lagi"** (sticky bottom button)
   - For anonymous users → **Show login wall:**
   ```
   ┌────────────────────────────────────────┐
   │  Want More Recommendations?            │
   │                                         │
   │  Log in first to get 1 more generate   │
   │  today!                                │
   │                                         │
   │  [Login/Daftar]  [Nanti Aja]           │
   └────────────────────────────────────────┘
   ```

4. **"Ubah Jawaban"** - Back to quiz with pre-filled answers

**User Paths:**

#### Path A: Satisfied, Exits
- User clicks "Lihat di Maps" for 1+ recommendations
- User leaves the page
- **Journey ends** ✅ (Success)

#### Path B: Wants More, Prompted to Login
- User clicks "Generate Lagi" or "Simpan"
- Sees login/register modal
- Decision:
  - Click "Login/Daftar" → Go to Step 5
  - Click "Nanti Aja" → Stay on page, journey ends

#### Path C: Not Satisfied, Changes Quiz
- User clicks "Ubah Jawaban"
- Returns to `/quiz` with pre-filled data
- But: already used 1 quota → Can't generate again without login

---

### Step 5: Auth Flow (Login or Register)

**Option A: Login (`/login`)**

Form:
- Email (validation)
- Password
- "Remember me" checkbox
- "Lupa password?" link

Actions:
- "Login" button → Supabase Auth
- "Login dengan Google" button → OAuth flow

**Option B: Register (`/register`)** (patch Addendum 09 v1.3: phone OPTIONAL)

Form:
- Email (validation, check duplicate)
- Password (min 8 chars, strength indicator)
- Confirm password
- Phone (+62, OPTIONAL — collapsible field "Tambah HP (opsional, buat info promo)" — empty = valid)
- Checkbox: "Setuju dengan [Syarat] dan [Privasi]"

Actions:
- "Daftar" button → Supabase signup + create profile (phone=NULL if skipped)
- "Daftar dengan Google" button → OAuth logs straight in, WITHOUT phone modal (zero friction)

**Google OAuth Flow (patch v1.3):**
```
1. Click "Login dengan Google" (primary button, 1-tap)
2. Redirect to Google consent screen
3. User approves
4. Redirect to /auth/callback
5. Profile auto-created phone=NULL via initialize_new_user trigger (WITHOUT "Masukkan nomor HP" modal)
6. Initialize place quota 2 + food quota 5 for today
7. Redirect back to /quiz or previous page
```

**Why is phone optional?** Every extra field = drop-off. Phone is only used for the Phase 2 broadcast (not built yet) — asking for it now = paying the cost with no benefit. Google 1-tap without a modal = highest conversion.

**Success:**
- Set session cookie (httpOnly)
- Show toast: "Selamat datang! Kamu punya 1x generate lagi hari ini"
- Redirect to `/quiz` or `/result` (if came from there)

**Analytics:**
```javascript
gtag('event', 'user_registered', { method: 'email' | 'google' })
gtag('event', 'user_logged_in', { method: 'email' | 'google' })
```

---

## Journey 2: Registered User (Logged In)

### Step 6: Returning User - Quiz (`/quiz`)

**Differences from Anonymous:**

**Header:**
- "Hai, Agesta! 👋"
- Quota indicator: "Quota hari ini: 2/2 tersisa ⚡"

**Features:**
- Quiz answers auto-saved (can resume if interrupted)
- Optional: "Pakai quiz terakhir" quick action

**User Action:**
→ Complete quiz  
→ Generate (quota: 1/2 remaining)

---

### Step 7: Registered User Result Page

**Header:**
- "Rekomendasi Weekend Buat Agesta!"
- Quota: "Quota: 1/2 tersisa"

**New Capabilities:**

1. **"Simpan" works** (no login wall)
   - Click "Simpan" → Saved to user_profiles
   - Show toast: "✅ Tersimpan!"
   - Can view in `/favorites`

2. **View History** (nav link)
   - Click "History" in navbar
   - See list of past generations
   - Format:
   ```
   Sabtu, 5 Okt 2026 - 14:30
   "Santai bareng pasangan, budget menengah, Jabodetabek"
   [Lihat Lagi]
   ```

3. **Generate Again**
   - Click "Generate Lagi" → Back to quiz
   - Complete new quiz → Generate (place quota: 0/2) + food quota SEPARATE 5/day (not deducted)
   - After 2nd place generate: **Place quota exhausted** → 00.00 countdown, food can still run

---

### Step 8: Quota Exhausted — wallet 2-state (patch Addendum 09 v1.3)

**Anonymous (login wall + countdown):**
```
┌────────────────────────────────────────┐
│  Today's free quota is used up 🎁       │
│  Free login → unlock 2 places +        │
│  5 food/day. Resets tomorrow 00:00 WIB │
│  ⏰ 8 hours 23 minutes left            │
│  [Login 10 detik (Google 1-tap)]       │
│  [Lihat Wishlist] → login too          │
└────────────────────────────────────────┘
```

**Registered (countdown only, can still view history/save/share):**

**Modal/Screen:**
```
┌────────────────────────────────────────┐
│  Today's Quota Is Used Up! 😊          │
│                                         │
│  Resets tomorrow at 00:00 WIB          │
│  ⏰ 8 hours 23 minutes left            │
│                                         │
│  While you wait, you can:              │
│  • View your recommendation history    │
│  • Share results with friends          │
│  • Check the places you've saved       │
│                                         │
│  [Lihat History]  [Share]              │
└────────────────────────────────────────┘
```

**Available Actions:**
1. **"Lihat History"** → `/history`
2. **"Share"** → Copy link or share to WhatsApp/Instagram
3. **Wait for reset** → Come back tomorrow

**Analytics:**
```javascript
gtag('event', 'quota_exhausted', {
  user_type: 'registered',
  total_generations_today: 2
})
```

---

### Step 9: Next Day (Quota Reset)

**Trigger:** Automated at 00:00 WIB (database cron job)

**Database Update:**
```sql
UPDATE user_quota
SET quota_used = 0, last_reset_at = NOW()
WHERE last_reset_at < NOW() - INTERVAL '1 day';
```

**User Returns:**
- Sees updated quota: "Quota: 2/2 tersisa ✨"
- Can generate 2 more times
- **Cycle repeats**

---

## Navigation Structure

### Anonymous User Nav
```
┌────────────────────────────────────────┐
│ [Logo] Weekend Planner                 │
│                    [Login] [Mulai]     │
└────────────────────────────────────────┘
```

### Logged-In User Nav
```
┌────────────────────────────────────────┐
│ [Logo] Weekend Planner                 │
│  [History] [Favorites] [👤 Agesta ▼]   │
│                        ├─ Profile      │
│                        ├─ Settings     │
│                        └─ Logout       │
└────────────────────────────────────────┘
```

---

## Edge Cases & Error Handling

### Case 1: LLM Generation Failed

**Error Screen:**
```
┌────────────────────────────────────────┐
│  Oops! Something Went Wrong...         │
│                                         │
│  The system is busy right now. Don't   │
│  worry, your quota isn't deducted!     │
│                                         │
│  [Coba Lagi]  [Ubah Jawaban]           │
└────────────────────────────────────────┘
```

**Behavior:**
- Don't count as quota used
- Allow immediate retry
- Log error to analytics

---

### Case 2: Network Timeout (>15s)

**Loading State Message:**
```
The request is taking longer than expected...
[Cancel]  [Keep Waiting]
```

**After Cancel:**
- Return to quiz
- Don't count quota
- Option to retry

---

### Case 3: User Clears Browser Data

**Anonymous:**
- Lose session_id
- Can generate again (new anonymous session)
- Effectively "resets" quota (minor abuse vector, acceptable)

**Registered:**
- Session cleared → Must login again
- Quota preserved in database

---

### Case 4: Shared Result Link

**Scenario:** User copies `/result?session=xxx` and sends it to a friend

**Behavior:**
- Friend opens link → Can view results (read-only)
- No "Simpan" or "Generate Lagi" buttons
- CTA: "Buat rekomendasi sendiri" → Landing page

---

### Case 5: Multiple Tabs/Devices

**Scenario:** User opens app in 2 tabs, generates in both

**Behavior:**
- Quota is server-side (database)
- First tab generates → quota: 1/2
- Second tab generates → quota: 0/2
- Third attempt (either tab) → Quota exhausted

---

## Mobile-Specific Considerations

### Quiz Flow
- **One question per screen** (no scroll between questions)
- Large tap targets (min 44×44px)
- Swipe to next question (optional)

### Result Cards
- **Stack vertically** (one card = full viewport width)
- Swipeable carousel (alternative layout)
- Sticky CTA at bottom ("Generate Lagi")

### Modals
- Use **bottom sheet** instead of center modal
- Easier thumb reach on tall screens

### Performance
- Lazy load images (if added later)
- Preload next question in quiz
- Optimistic UI (show loading immediately)

---

## Analytics Events Summary

### Page Views (Automatic)
```javascript
pageview('/') // Landing
pageview('/quiz') // Quiz started
pageview('/result') // Result viewed
pageview('/login') // Auth page
pageview('/register')
pageview('/history')
pageview('/favorites')
```

### Custom Events
```javascript
// Acquisition
gtag('event', 'landing_cta_clicked')
gtag('event', 'quiz_started')

// Engagement
gtag('event', 'quiz_question_answered', { question_num })
gtag('event', 'quiz_completed', { mood, budget, location, companion })
gtag('event', 'recommendation_generated', { 
  is_logged_in, 
  quota_remaining, 
  response_time_ms 
})
gtag('event', 'recommendation_clicked', { 
  index, 
  action: 'maps' | 'save',
  category 
})

// Auth (patch Addendum 09 v1.3: 4 wall moments)
gtag('event', 'login_prompted', { reason: 'quota_limit' | 'save_favorite' | 'claim_voucher' | 'open_wishlist' | 'open_history' })
gtag('event', 'anon_quota_exhausted', { type: 'place' | 'food' })
gtag('event', 'voucher_claimed', { tenant_id, mall_slug })
gtag('event', 'user_registered', { method })
gtag('event', 'user_logged_in', { method })

// Retention
gtag('event', 'quota_exhausted', { user_type })
gtag('event', 'history_viewed')
gtag('event', 'favorite_saved')
gtag('event', 'result_shared', { method })

// Errors
gtag('event', 'generation_failed', { error_type })
gtag('event', 'timeout_occurred')
```

---

## Success Metrics by Journey Stage

### Landing Page
- **CTA Click Rate:** >40%
- **Bounce Rate:** <50%
- **Avg Time on Page:** >15 seconds

### Quiz
- **Start → Complete Rate:** >70%
- **Avg Completion Time:** 30-60 seconds
- **Drop-off:** <20% per question

### Result Page
- **Recommendation Click Rate:** >50% (at least 1 clicked)
- **Avg Time on Page:** >60 seconds
- **Save/Share Rate:** >10%

### Auth Conversion (patch Addendum 09 v1.3 — progressive funnel, not mandatory)
- **Anonymous → Register:** >15% (7-day window, `user_registered` event after `anon_quota_exhausted`)
- **Login Prompt → Signup:** >40% per moment (measured separately for `quota_limit` / `claim_voucher` — the voucher wall is usually the highest)
- **Voucher Claim Rate:** >20% of logged-in food result viewers (tenant monetization signal)

### Retention
- **Day 2 Return:** >30%
- **Day 7 Return:** >20%
- **Quota Reset → Comeback:** >40%

---

## Journey 3: Find Food (Split Quiz — Addendum 07 v1.1 Approved Oct 6, 2026)

### Step 10: Entry `/food`
**Goal:** Answer "I'm at the mall, what should I eat?" in <10 seconds.
**UI:** 4 questions, 1 question per screen (reuse quiz.html, 80% copy-paste):
1. "Mau makan di mall mana?" → [GI] / [Central Park] / [Kokas] / [PIM] / [Aeon BSD] (pick 1, required)
2. "Misi makan kali ini?" → Quick bite / Long hangout / Family / Healing
3. "Budget per orang?" → Frugal (<50k) / Mid-range (50-150k) / Comfortable (>150k)
4. "Rombongan + pantangan?" → Alone / Two / Group + Halal only toggle + Kids-friendly
**Result `/result-food`:** 5 pure TENANTS (no place mixing). Card: Name + [Category • Mall Floor X] + [✅ Halal] + [🔥 Hype] + 1-sentence reason + price range + Maps + Save + Report closed.
**Quota:** Separate 5x/day (anonymous 2x via cookie `food_quota_used`, logged in 5x). Doesn't eat into place quota.

### Step 11: SEO Directory `/mall/:slug`
**Goal:** Zero-cost organic acquisition, no LLM/quota.
List of 40 searchable tenants + halal/budget/floor/kids/mission/search filters + banner "Males scroll? Cariin yang cocok →" → `/food?mall=grand-indonesia` (pre-fills Q1).

### Step 12: History/Favorites Split
Place | Food tab. JSONB snapshot + `type: 'place'|'food'` so they don't get mixed up.

### Step 13: Food Voucher Claim — LOGIN REQUIRED (Addendum 09 v1.3, Oct 7, 2026)
**Goal:** User eats → shows code → tenant happy → repeat order.
**Flow:** Food result → tenant promo card → tap "Klaim Voucher" → if anonymous: login bottom sheet ("Login buat klaim voucher — 10 detik via Google") → claim → code `WKD-XXXXXX` + "Tunjukin ke kasir" → 1 user per tenant per day (`voucher_claims` UNIQUE) → double claim = 409 `ALREADY_CLAIMED` + invite to try another tenant. Cashier does visual validation in Phase 1 (show the code), dashboard validation in Phase 2.
**Analytics:** `gtag('event','voucher_claimed',{tenant_id,mall_slug})` + `login_prompted{reason:'claim_voucher'}`.

### Step 14: Superapp Home Combo 5+10+15 (visual ref `design/revamp-combo-5-10-15.html`)
Wallet quota 2-state in the hero ("🎁 1 tempat • 1 makan free — Login buat buka 2+5" vs registered countdown 00.00) + 2 CTAs "Cari Tempat" / "Cari Makan" + Event/Promo/Wishlist/History grid (2 padlocked for anonymous) + mall strip GI/CP/Kokas/PIM/Aeon → `/mall/:slug` → `/food?mall=` pre-fill.

---

## Future Journey Enhancements (Post-MVP)

1. **Onboarding Tutorial** (first-time overlay)
2. **Quiz Presets** ("Weekend bareng pasangan lagi")
3. **Collaborative Planning** (invite friend, vote together)
4. **Social Share with OG Image** (beautiful preview card)
5. **Calendar Integration** ("Add to Google Calendar")
6. **Push Notifications** ("Weekend planner ready! 🎉")
7. **Referral Program** ("Ajak teman, dapat +1 quota")

---

**Document Status:** FINAL  
**Last Updated:** October 5, 2026  
**Next Review:** After soft launch (30 users)
