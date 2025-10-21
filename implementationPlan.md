# Slab Advisor Implementation Plan

## 📊 Overall Progress Summary

**Last Updated:** January 6, 2025

### Project Completion: ~65%

#### ✅ Fully Completed
- **Phase 1**: Foundation & Authentication (100%)
- **Phase 2**: Core Upload & Grading Framework (100%)
- **Database Schema**: Pokemon cards, collections, pricing infrastructure (85%)
- **Pricing Pipeline**: Python scripts for daily price updates (90%)
- **Variant System**: Multi-pattern support (Poké Ball, Master Ball) (90%)
- **Collection Management**: CRUD operations, grid/list views (70%)
- **Browse Experience**: Card browsing, set viewing, filtering (80%)

#### 🟡 Partially Completed
- **Phase 3**: Dashboard & Navigation (60%)
- **Phase 4**: Collection Features (70%)
- **Phase 5**: Add Card Flow (85%)
- **Pricing Display**: Smart price formatting implemented, historical tracking missing
- **Ximilar Integration**: Types defined (20%), API implementation pending (0%)

#### ❌ Not Started
- **Historical Portfolio Tracking**: Portfolio snapshots, value charts (0%)
- **Social Features**: Username, followers, shareable collections (0%)
- **Ximilar Grading**: API integration, UI display (0%)
- **Ximilar Recognition**: Card identification from images (0%)
- **Pre-grading Recommendations**: Grading ROI analysis (0%)
- **Gamma/Preprod Pipeline**: Staging environment setup (0%)
- **Store/Marketplace**: Internal product purchasing (0%)

---

## 🎯 Implementation Priority Tiers

### Tier 1: Core Value Proposition (Do First)

These features deliver unique value that competitors don't have and form the foundation of the product's value proposition.

#### 1. Historical Pricing with Redis Cache ⚠️ IN PROGRESS
**Status:** 🟡 60% Complete
**Priority:** 🔴 Critical
**Estimated Effort:** 1-2 weeks

**What's Done:**
- ✅ Python price update script (`scripts/update_pokemon_prices.py`)
- ✅ Database columns: `price_data` (JSONB), `price_last_updated`
- ✅ Smart price display utilities (`src/utils/priceUtils.ts`)
- ✅ Multi-variant price support (Poké Ball, Master Ball patterns)
- ✅ Daily price fetching from TCGCSV API

**What's Missing:**
- ❌ `daily_raw_prices` table (store historical price snapshots)
- ❌ `portfolio_snapshots` table (track portfolio value over time)
- ❌ `price_cache` table (cache expensive API calls)
- ❌ Redis cache wrapper around PokemonPriceTracker API
- ❌ Historical price chart components
- ❌ Portfolio value calculation service (`src/lib/portfolio-service.ts`)
- ❌ Vercel cron job configuration (`vercel.json`)
- ❌ API endpoint `/api/cron/update-prices`

**Implementation Tasks:**
1. Create database migrations for missing tables:
   ```sql
   -- daily_raw_prices: historical price snapshots
   -- portfolio_snapshots: user portfolio value tracking
   -- price_cache: API response caching
   ```
2. Set up Redis/Upstash for caching layer
3. Create `src/lib/pricing-service.ts` with PokemonPriceTracker API wrapper
4. Create `src/lib/portfolio-service.ts` for portfolio calculations
5. Build `/api/cron/update-prices` Vercel endpoint
6. Create `vercel.json` with cron configuration
7. Implement portfolio value calculation API
8. Build historical price chart components

**Files to Create:**
- `/src/lib/pricing-service.ts`
- `/src/lib/portfolio-service.ts`
- `/src/app/api/cron/update-prices/route.ts`
- `/src/app/api/portfolio/calculate/route.ts`
- `/src/components/portfolio/PortfolioValue.tsx`
- `/src/components/portfolio/PortfolioChart.tsx`
- `/vercel.json`

**Dependencies:**
- Upstash Redis account (or alternative Redis provider)
- PokemonPriceTracker API key
- CRON_SECRET environment variable

---

#### 2. Grading Using Ximilar ❌ NOT STARTED
**Status:** ❌ 0% Complete
**Priority:** 🔴 Critical
**Estimated Effort:** 2 weeks

**What's Done:**
- ✅ TypeScript types defined (`src/types/ximilar.ts`)
- ✅ Database field: `grading_data` (JSONB) in collection_cards table
- ✅ API research documentation (`XIMILAR_API_RESEARCH.md`)

**What's Missing:**
- ❌ Ximilar API service layer (`src/lib/ximilar-service.ts`)
- ❌ Grading API endpoint (`/api/ximilar/grade`)
- ❌ Image upload and processing flow
- ❌ Grading results display UI
- ❌ Grade visualization components (corners, edges, surface, centering)
- ❌ Credit deduction for grading operations
- ❌ Error handling for failed grading attempts

**Implementation Tasks:**
1. Create Ximilar API service wrapper:
   ```typescript
   // src/lib/ximilar-service.ts
   export async function gradeCard(imageUrl: string)
   export function parseGradingResults(response: XimilarGradingResponse)
   ```
2. Build API endpoint for secure grading requests
3. Implement image upload flow (front + back card images)
4. Create grading results display components:
   - Overall grade with confidence score
   - Corner grades with visual indicators
   - Edge quality assessment
   - Surface condition analysis
   - Centering measurements
5. Integrate credit system (charge credits only on success)
6. Add error handling and retry logic
7. Update add-to-collection flow with grading option

**Files to Create:**
- `/src/lib/ximilar-service.ts`
- `/src/app/api/ximilar/grade/route.ts`
- `/src/components/grading/GradingResults.tsx`
- `/src/components/grading/GradeVisualizer.tsx`
- `/src/components/grading/GradingFlow.tsx`

**Files to Modify:**
- `/src/components/collection/AddToCollectionForm.tsx` (add grading option)
- `/src/components/collection/CollectionQuickViewContent.tsx` (display grades)

**Dependencies:**
- Ximilar API key (XIMILAR_API_TOKEN)
- Image storage (Supabase Storage already configured)
- Credit system (already implemented)

---

#### 3. Card Identification Using Ximilar ❌ NOT STARTED
**Status:** ❌ 0% Complete
**Priority:** 🔴 Critical
**Estimated Effort:** 1.5 weeks

**What's Done:**
- ✅ TypeScript types for card identification (`src/types/ximilar.ts`)
- ✅ Database schema supports card metadata

**What's Missing:**
- ❌ Image recognition API integration
- ❌ Card matching against database (fuzzy search)
- ❌ Auto-populate card details from recognition
- ❌ Confidence scoring for matches
- ❌ Manual override when recognition fails
- ❌ UI for reviewing and confirming identifications

**Implementation Tasks:**
1. Extend Ximilar service with identification methods:
   ```typescript
   // src/lib/ximilar-service.ts
   export async function identifyCard(imageUrl: string)
   export function matchCardToDatabase(identificationResults: XimilarIdentificationResponse)
   ```
2. Create fuzzy matching service against pokemon_cards table
3. Build identification review UI:
   - Show top 3 matches with confidence scores
   - Display card images for visual confirmation
   - Allow manual selection or search
4. Integrate into add-to-collection flow
5. Handle edge cases (card not found, low confidence)
6. Add credit cost for identification

**Files to Create:**
- `/src/app/api/ximilar/identify/route.ts`
- `/src/components/identification/CardIdentificationResults.tsx`
- `/src/components/identification/CardMatchConfirmation.tsx`
- `/src/lib/card-matching-service.ts`

**Files to Modify:**
- `/src/lib/ximilar-service.ts` (add identify methods)
- `/src/components/collection/AddToCollectionForm.tsx` (integrate identification)

**Dependencies:**
- Ximilar API key
- Pokemon cards database (already populated)

---

#### 4. Pre-grading Recommendations ❌ NOT STARTED
**Status:** ❌ 0% Complete
**Priority:** 🟠 High
**Estimated Effort:** 1 week

**What's Done:**
- ✅ Price data exists for graded cards
- ✅ Grading data structure defined

**What's Missing:**
- ❌ ROI calculation engine
- ❌ Grading service cost data (PSA, BGS, SGC)
- ❌ Break-even analysis
- ❌ Recommendation algorithm
- ❌ UI displaying recommendations
- ❌ Service comparison (which grading service to use)

**Implementation Tasks:**
1. Research and compile grading service pricing:
   - PSA: Economy, Regular, Express, Super Express
   - BGS: Standard, Premium, Crossover
   - SGC: Standard, Express
2. Create grading cost calculator:
   ```typescript
   // src/lib/grading-calculator.ts
   export function calculateGradingROI(card, estimatedGrade, service)
   export function recommendGradingService(card, estimatedGrade)
   export function shouldGrade(card, estimatedGrade)
   ```
3. Build recommendation engine:
   - Compare ungraded price vs. graded price at estimated grade
   - Subtract grading costs (service + shipping + insurance)
   - Calculate percentage ROI
   - Factor in confidence score
4. Create recommendation UI components:
   - "Should You Grade?" widget
   - Service comparison table
   - Expected profit/loss breakdown
   - Best service recommendation
5. Integrate into card detail and collection views

**Files to Create:**
- `/src/lib/grading-calculator.ts`
- `/src/data/grading-costs.ts` (static pricing data)
- `/src/components/grading/GradingRecommendation.tsx`
- `/src/components/grading/ServiceComparison.tsx`

**Files to Modify:**
- `/src/components/collection/CollectionQuickViewContent.tsx` (show recommendations)
- `/src/app/browse/pokemon/[setId]/[cardId]/page.tsx` (show recommendations)

**Dependencies:**
- Grading implementation (Tier 1, Item 2)
- Price data (already implemented)

---

### Tier 2: User Growth Features

These features enable viral growth, user acquisition, and retention.

#### 5. AI Collection Advisor (Claude Agent SDK) ❌ NOT STARTED
**Status:** ❌ 0% Complete
**Priority:** 🟠 High (Premium Feature)
**Estimated Effort:** 2-3 weeks
**Revenue Potential:** $9.99/month premium tier

**What's Done:**
- ✅ Collection data exists
- ✅ Price data pipeline
- ✅ User authentication

**What's Missing:**
- ❌ Claude Agent SDK integration
- ❌ Custom tools for database queries
- ❌ Chat UI component
- ❌ Conversation history storage
- ❌ Premium subscription tier
- ❌ Credit system for AI queries

**Core Capabilities:**

1. **Grading ROI Analyzer** (Highest Value)
   - Analyze entire collection for grading profit potential
   - Calculate profit at different grades (PSA 8, 9, 10)
   - Subtract grading fees (PSA, BGS, SGC)
   - Flag cards with >$50 profit potential
   - Generate prioritized "Send to Grade" list

2. **Collection Insights Chat**
   - Natural language queries about collection
   - "What's my most valuable set?"
   - "Which cards increased most this month?"
   - "Should I sell my Charizard now?"
   - Portfolio analysis and trends

3. **Smart Collection Assistant**
   - Card-specific recommendations
   - Collection strategy advice
   - Market context and trends
   - Set completion suggestions
   - Investment recommendations

4. **Market Alert Agent** (Future)
   - Monitor price changes on user's cards
   - Alert on buying/selling opportunities
   - Track market trends
   - Tournament meta impact analysis

**Implementation Tasks:**

1. Set up Claude Agent SDK:
   ```typescript
   // src/lib/claude-agent.ts
   import { Agent } from '@anthropic-ai/agent-sdk'

   export function createCollectionAgent(userId: string)
   export function chat(message: string, sessionId: string)
   ```

2. Create custom tools for agent:
   ```typescript
   // src/lib/agent-tools/collection-tools.ts
   - get_collection_stats(user_id)
   - analyze_grading_roi(user_id, min_profit_threshold)
   - get_price_history(card_id, days)
   - get_set_completion(user_id, set_id)
   - calculate_portfolio_value(user_id)
   - find_high_value_cards(user_id, criteria)
   ```

3. Build chat interface:
   - Chat bubble UI component
   - Message history display
   - Streaming responses
   - Tool execution visualization
   - Cost tracking per conversation

4. Create conversation management:
   - `ai_conversations` table (user_id, session_id, messages JSONB)
   - `ai_usage_logs` table (user_id, tokens_used, cost, timestamp)
   - Session persistence
   - Cost tracking and limits

5. Implement premium tier:
   - Free tier: 10 AI queries/month
   - Premium tier ($9.99/month): Unlimited AI queries
   - Credit-based alternative: 1 credit = 1 grading analysis

6. Build API endpoints:
   - `/api/ai/chat` - Send message to agent
   - `/api/ai/sessions` - Manage conversation sessions
   - `/api/ai/usage` - Track usage and costs

**Database Schema:**

```sql
-- Conversation storage
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT UNIQUE NOT NULL,
  title TEXT,
  messages JSONB, -- Array of {role, content, timestamp}
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Usage tracking
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  tokens_used INTEGER,
  cost_usd NUMERIC(10, 4),
  query_type TEXT, -- 'grading_analysis', 'collection_query', etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Premium subscriptions
CREATE TABLE premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  tier TEXT, -- 'free', 'premium', 'enterprise'
  stripe_subscription_id TEXT,
  status TEXT, -- 'active', 'cancelled', 'past_due'
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Files to Create:**
- `/src/lib/claude-agent.ts` - Agent SDK wrapper
- `/src/lib/agent-tools/collection-tools.ts` - Custom tools
- `/src/lib/agent-tools/grading-tools.ts` - ROI analysis tools
- `/src/lib/agent-tools/market-tools.ts` - Price/market tools
- `/src/components/ai/ChatInterface.tsx` - Chat UI
- `/src/components/ai/ChatBubble.tsx` - Message display
- `/src/components/ai/ToolExecutionView.tsx` - Show tool usage
- `/src/app/api/ai/chat/route.ts` - Chat endpoint
- `/src/app/api/ai/sessions/route.ts` - Session management
- `/src/app/(authenticated)/advisor/page.tsx` - AI Advisor page
- `/src/hooks/useAIChat.ts` - Chat React hook

**Files to Modify:**
- `/src/app/(authenticated)/layout.tsx` - Add "AI Advisor" nav item
- `/src/components/navigation/Sidebar.tsx` - Add AI icon
- `/src/models/database.ts` - Add new table types

**Cost Estimation:**
- Per grading analysis: $0.50-$2 (analyzes 100+ cards)
- Per collection query: $0.05-$0.10
- Monthly cost per active user: $10-$18
- Premium tier price: $9.99/month
- Profit margin: 40-50% at scale

**Revenue Model Options:**

1. **Subscription Tier:**
   - Free: 10 AI queries/month
   - Premium ($9.99/month): Unlimited AI queries + advanced features
   - Enterprise ($29.99/month): Multi-user, API access

2. **Credit-Based:**
   - 1 credit = 1 grading ROI analysis
   - 1 credit = 5 collection queries
   - Purchase credits: $4.99 for 10 credits

3. **Hybrid:**
   - Free: 5 AI queries/month
   - Pay-per-use: $0.50 per grading analysis
   - Premium: Unlimited

**Competitive Advantage:**
- 🚀 AI that understands YOUR specific collection
- 💰 Personalized profit recommendations
- 🤖 Natural language insights (not just dashboards)
- 📊 Contextual market advice based on your holdings

**Dependencies:**
- Ximilar Grading (Tier 1, Item 2) - Provides estimated grades
- Historical Pricing (Tier 1, Item 1) - Provides trend data
- Pre-grading ROI Calculator (Tier 1, Item 4) - Provides base calculations
- Claude API key (ANTHROPIC_API_KEY)
- Stripe integration (for premium subscriptions)

**Implementation Priority:**
Build this AFTER Tier 1 features are complete. The AI layer needs:
- Grading data (from Ximilar)
- Price history (from historical pricing)
- ROI calculations (from pre-grading recommendations)

This becomes the "premium intelligence layer" on top of solid foundations.

---

#### 6. Username + Shareable Collections ❌ NOT STARTED
**Status:** ❌ 0% Complete
**Priority:** 🟠 High
**Estimated Effort:** 1.5 weeks

**What's Done:**
- ✅ Authentication system (email/password + Google OAuth)
- ✅ User credits table

**What's Missing:**
- ❌ `profiles` table (username, display_name, bio, avatar_url, is_public)
- ❌ `follows` table (follower_id, following_id)
- ❌ Username field in signup flow
- ❌ Username availability check
- ❌ Profile settings page
- ❌ Public collection URLs (`/u/[username]`)
- ❌ Collection visibility toggle (public/private)
- ❌ Share collection functionality
- ❌ Social preview cards (Open Graph meta tags)

**Implementation Tasks:**
1. Create database migrations:
   ```sql
   CREATE TABLE profiles (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id) UNIQUE,
     username TEXT UNIQUE NOT NULL,
     display_name TEXT,
     bio TEXT,
     avatar_url TEXT,
     is_public BOOLEAN DEFAULT true,
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now()
   );

   CREATE TABLE follows (
     follower_id UUID REFERENCES profiles(id),
     following_id UUID REFERENCES profiles(id),
     created_at TIMESTAMPTZ DEFAULT now(),
     PRIMARY KEY (follower_id, following_id)
   );
   ```
2. Update signup flow to require username:
   - Add username input field
   - Implement real-time availability check
   - Validate username format (3-30 chars, alphanumeric + underscore)
3. Create profile settings page (`/settings/profile`)
4. Build public profile pages (`/u/[username]`)
5. Add collection visibility toggle (per-card or entire collection)
6. Implement share functionality:
   - Generate shareable URLs
   - Add Open Graph meta tags
   - QR code generation for in-person sharing
7. Create social preview cards for link sharing

**Files to Create:**
- `/src/app/(authenticated)/settings/profile/page.tsx`
- `/src/app/u/[username]/page.tsx`
- `/src/components/profile/ProfileHeader.tsx`
- `/src/components/profile/PublicCollection.tsx`
- `/src/components/sharing/ShareCollectionButton.tsx`
- `/src/app/api/profile/username-check/route.ts`
- `/src/app/api/profile/update/route.ts`

**Files to Modify:**
- `/src/components/auth/AuthForm.tsx` (add username to signup)
- `/src/models/database.ts` (add profiles and follows tables)
- `/src/components/collection/CollectionClient.tsx` (add share button)

**Dependencies:**
- None (can be built independently)

---

#### 7. Dashboard Completion ⚠️ IN PROGRESS
**Status:** 🟡 40% Complete
**Priority:** 🟠 High
**Estimated Effort:** 3-5 days

**What's Done:**
- ✅ Dashboard page exists (`src/app/(authenticated)/dashboard/page.tsx`)
- ✅ Layout components (DashboardStats, QuickActions, RecentActivity)
- ✅ Responsive design
- ✅ Navigation integration

**What's Missing:**
- ❌ Real data integration (currently shows "Coming Soon")
- ❌ Total cards count from collection
- ❌ Estimated collection value calculation
- ❌ Cards by category breakdown (Pokemon, One Piece, Sports, Other TCG)
- ❌ Recent activity feed (cards added, grades updated)
- ❌ Portfolio value chart (requires historical tracking)
- ❌ Followers/following counts (requires social features)

**Implementation Tasks:**
1. Create dashboard data API:
   ```typescript
   // /src/app/api/dashboard/stats/route.ts
   export async function GET() {
     // Calculate total cards
     // Calculate collection value (sum of prices)
     // Get category breakdown
     // Fetch recent activity
   }
   ```
2. Implement collection value calculator:
   - Sum all card prices from collection_cards
   - Use variant-specific pricing
   - Handle cards without prices
3. Create category breakdown query:
   - Count cards per category
   - Calculate value per category
4. Build recent activity query:
   - Last 10 cards added
   - Recent grade updates
   - Recent price changes
5. Update DashboardStats component to fetch real data
6. Add loading states and error handling
7. Create mini sparkline charts for trends

**Files to Modify:**
- `/src/app/(authenticated)/dashboard/page.tsx`
- `/src/components/dashboard/DashboardStats.tsx`
- `/src/components/dashboard/RecentActivity.tsx`

**Files to Create:**
- `/src/app/api/dashboard/stats/route.ts`
- `/src/lib/dashboard-service.ts`

**Dependencies:**
- Collection data (already exists)
- Price data (already exists)
- Portfolio tracking (Tier 1, Item 1) - for charts

---

#### 8. Card Detail Page Completion ⚠️ IN PROGRESS
**Status:** 🟡 80% Complete
**Priority:** 🟡 Medium
**Estimated Effort:** 2-3 days

**What's Done:**
- ✅ Browse card detail page (`src/app/browse/pokemon/[setId]/[cardId]/page.tsx`)
- ✅ Collection quick view modal
- ✅ Card information display
- ✅ Price display (current price)
- ✅ Add to collection functionality
- ✅ Edit/delete for owned cards

**What's Missing:**
- ❌ Historical price chart
- ❌ Grading information display (when implemented)
- ❌ Pre-grading recommendations (when implemented)
- ❌ Similar cards suggestions
- ❌ Set completion progress
- ❌ Market trend indicators

**Implementation Tasks:**
1. Add historical price chart component:
   - Fetch price history from daily_raw_prices
   - Display 7-day, 30-day, 1-year views
   - Show price change percentage
   - Requires Tier 1, Item 1 (Historical Pricing)
2. Integrate grading display:
   - Show estimated grade if graded
   - Display detailed grading breakdown
   - Requires Tier 1, Item 2 (Grading)
3. Add pre-grading recommendations:
   - Show ROI analysis
   - Recommend service
   - Requires Tier 1, Item 4 (Pre-grading Recommendations)
4. Build similar cards section:
   - Same set, similar rarity
   - Same Pokemon, different set
   - Price-based recommendations
5. Add set completion widget:
   - Show % of set owned
   - Highlight missing cards
   - Link to missing cards

**Files to Modify:**
- `/src/app/browse/pokemon/[setId]/[cardId]/page.tsx`
- `/src/components/collection/CollectionQuickViewContent.tsx`

**Files to Create:**
- `/src/components/cards/HistoricalPriceChart.tsx`
- `/src/components/cards/SimilarCards.tsx`
- `/src/components/cards/SetCompletion.tsx`

**Dependencies:**
- Historical pricing (Tier 1, Item 1)
- Grading (Tier 1, Item 2)
- Pre-grading recommendations (Tier 1, Item 4)

---

### Tier 3: Infrastructure & Polish

These features ensure production readiness, prevent disasters, and polish the user experience.

#### 9. Gamma/Preprod Pipeline Setup ❌ NOT STARTED
**Status:** ❌ 0% Complete
**Priority:** 🔴 Critical (before production launch)
**Estimated Effort:** 3-5 days

**What's Missing:**
- ❌ Preprod Supabase project
- ❌ Preprod database schema
- ❌ Database migration scripts
- ❌ Preprod Vercel deployment
- ❌ Environment-specific configuration
- ❌ Data seeding for testing
- ❌ Migration testing workflow

**Implementation Tasks:**
1. Create preprod Supabase project:
   - Separate project from production
   - Same schema as production
   - Test data seeded
2. Set up preprod Vercel deployment:
   - Create `preview` branch for preprod
   - Configure Vercel to deploy preview branch to preprod URL
   - Set up environment variables for preprod
3. Create database migration workflow:
   ```bash
   # scripts/migrate-to-preprod.sh
   # Test migrations on preprod before production
   ```
4. Set up data seeding scripts:
   - Sample users
   - Sample collections
   - Sample cards
5. Create preprod testing checklist:
   - Database migrations work
   - New features work
   - No regressions
   - Performance acceptable
6. Document preprod workflow for team

**Files to Create:**
- `/scripts/migrate-to-preprod.sh`
- `/scripts/seed-preprod-data.sh`
- `/docs/preprod-workflow.md`
- `.env.preprod` (environment variables)

**Configuration Changes:**
- Create new Vercel project for preprod
- Configure Supabase preprod project
- Set up separate API keys for preprod

**Dependencies:**
- None (infrastructure setup)

---

#### 10. App Polish & UX Improvements 🔄 ONGOING
**Status:** 🟡 Varies by area
**Priority:** 🟡 Medium (ongoing after features)
**Estimated Effort:** Ongoing

**Areas to Polish:**

**Search & Filtering:**
- ❌ Collection search by card name
- ❌ Filter by category, grade, price range
- ❌ Sort by date, grade, value, alphabetical
- ❌ Saved filter presets

**Bulk Operations:**
- ❌ Select multiple cards
- ❌ Bulk delete
- ❌ Bulk privacy toggle
- ❌ Bulk export

**Mobile Optimization:**
- ✅ Responsive layouts (mostly done)
- ❌ Touch-optimized controls
- ❌ Mobile camera integration
- ❌ Progressive Web App (PWA) features
- ❌ Offline support

**Performance:**
- ✅ Image optimization (Next.js Image)
- ❌ Lazy loading for large collections
- ❌ Pagination or infinite scroll
- ❌ Request caching
- ❌ Bundle size optimization

**Accessibility:**
- 🟡 Basic ARIA labels (partial)
- ❌ Keyboard navigation
- ❌ Screen reader optimization
- ❌ Color contrast audit
- ❌ Focus indicators

**Error Handling:**
- ✅ Basic error messages
- ❌ Error recovery suggestions
- ❌ Retry mechanisms
- ❌ Offline detection
- ❌ Graceful degradation

**Implementation Tasks:**
1. Implement collection search and filtering
2. Add bulk operations UI
3. Mobile optimization pass
4. Performance audit and optimization
5. Accessibility audit and fixes
6. Comprehensive error handling review
7. Loading state polish
8. Animation and transition polish

**Files to Modify:**
- `/src/components/collection/CollectionClient.tsx` (search, filter, bulk ops)
- `/src/app/manifest.json` (PWA configuration)
- `/src/components/*` (accessibility improvements)
- Multiple files for performance optimization

**Dependencies:**
- None (polish is ongoing and independent)

---

## 🗄️ Database Schema Status

### ✅ Implemented Tables

#### pokemon_cards
- ✅ Complete card data from TCGdex
- ✅ Pricing fields: `price_data` (JSONB), `price_last_updated`, `tcgplayer_product_id`
- ✅ Multi-variant support: `tcgplayer_products` (JSONB array)
- ✅ Variant flags: `variant_normal`, `variant_holo`, `variant_reverse`, `variant_first_edition`, `variant_poke_ball`, `variant_master_ball`
- ✅ Images, rarity, set information

#### collection_cards
- ✅ User collections with variant tracking
- ✅ Fields: `pokemon_card_id`, `user_id`, `variant`, `variant_pattern`, `quantity`
- ✅ Metadata: `acquisition_date`, `acquisition_price`, `condition`, `notes`
- ✅ Grading placeholder: `grading_data` (JSONB)

#### pokemon_sets
- ✅ Set information from TCGdex
- ✅ TCGPlayer integration: `tcgplayer_group_id`, `tcgplayer_groups` (JSONB), `tcgplayer_url`

#### pokemon_products
- ✅ Sealed products (booster boxes, ETBs, etc.)
- ✅ TCGPlayer product data

#### user_credits
- ✅ Credit system: `free_credits`, `purchased_credits`, `total_credits`

### ❌ Missing Tables

#### daily_raw_prices
**Purpose:** Store historical price snapshots for charting and trend analysis
**Schema:**
```sql
CREATE TABLE daily_raw_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pokemon_card_id UUID REFERENCES pokemon_cards(id),
  variant TEXT,
  variant_pattern TEXT,
  price NUMERIC(10, 2),
  market_price NUMERIC(10, 2),
  low_price NUMERIC(10, 2),
  mid_price NUMERIC(10, 2),
  high_price NUMERIC(10, 2),
  recorded_at TIMESTAMPTZ DEFAULT now(),
  source TEXT -- 'tcgcsv', 'pokemonpricetracker', etc.
);

CREATE INDEX idx_daily_raw_prices_card ON daily_raw_prices(pokemon_card_id);
CREATE INDEX idx_daily_raw_prices_date ON daily_raw_prices(recorded_at);
```

#### portfolio_snapshots
**Purpose:** Track user portfolio value over time
**Schema:**
```sql
CREATE TABLE portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  total_value NUMERIC(12, 2),
  total_cards INTEGER,
  cards_by_category JSONB, -- {"pokemon": 100, "onepiece": 50}
  snapshot_date TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_portfolio_snapshots_user ON portfolio_snapshots(user_id);
CREATE INDEX idx_portfolio_snapshots_date ON portfolio_snapshots(snapshot_date);
```

#### price_cache
**Purpose:** Cache expensive API calls to PokemonPriceTracker
**Schema:**
```sql
CREATE TABLE price_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL, -- e.g., "card:{cardId}:variant:{variant}"
  data JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_price_cache_key ON price_cache(cache_key);
CREATE INDEX idx_price_cache_expires ON price_cache(expires_at);
```

#### profiles
**Purpose:** User profiles with usernames for social features
**Schema:**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_user ON profiles(user_id);
CREATE INDEX idx_profiles_username ON profiles(username);
```

#### follows
**Purpose:** Track follower/following relationships
**Schema:**
```sql
CREATE TABLE follows (
  follower_id UUID REFERENCES profiles(id),
  following_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
```

---

## 📝 Implementation Notes

### Already Implemented Features

#### Pricing Pipeline
- **Script:** `scripts/update_pokemon_prices.py`
- **Capabilities:**
  - Fetches prices from TCGCSV API
  - Multi-group set support (main + trainer gallery)
  - Multi-variant card handling (Poké Ball, Master Ball patterns)
  - 24-hour throttling with force update option
  - Unknown product tracking
- **Database:** Updates `price_data` JSONB column
- **Status:** ✅ Production-ready, runs manually or via systemd

#### Variant System
- **Utilities:** `src/utils/variantUtils.ts`
- **Functions:**
  - `parseVariantSelection()` - Split UI variant into DB fields
  - `combineVariantPattern()` - Combine for display
  - `buildAvailableVariants()` - Generate options from card data
  - `getVariantLabel()` - User-friendly labels
- **Sync Script:** `scripts/sync_card_variants_v2.py`
  - Maps multiple TCGPlayer products to cards
  - Auto-classifies patterns (base, poke_ball, master_ball)
  - Corrects incorrect mappings
- **Status:** ✅ Fully functional, integrated into collection forms

#### Collection Management
- **Components:**
  - `CollectionClient.tsx` - Main view with grid/list toggle
  - `CollectionCardGridItem.tsx` - Card display in grid
  - `CollectionCardListItem.tsx` - Card display in list
  - `CollectionQuickViewContent.tsx` - Modal quick view
  - `AddToCollectionForm.tsx` - Add cards with variant selection
  - `EditCollectionForm.tsx` - Edit card details
  - `DeleteCardDialog.tsx` - Delete confirmation
- **Features:**
  - ✅ Dual view modes (grid/list)
  - ✅ Trading card aspect ratio (2.5:3.5)
  - ✅ Variant-specific pricing display
  - ✅ Responsive design (2-5 columns)
  - ✅ CRUD operations
- **Missing:** Search, filtering, sorting, bulk operations
- **Status:** 🟡 70% complete

#### Authentication
- **Methods:** Email/password, Google OAuth
- **Features:**
  - ✅ Signup/login/logout
  - ✅ Protected routes (middleware)
  - ✅ Session management
  - ✅ Auth callbacks
- **Missing:** Username in signup flow
- **Status:** ✅ 90% complete

---

## 🚀 Deployment & Automation

### Current Setup

#### Manual Scripts
- ✅ `scripts/update_pokemon_prices.py` - Price updates
- ✅ `scripts/sync_card_variants_v2.py` - Variant mapping
- ✅ `scripts/backfill_pokemon_data.py` - Initial data import
- ✅ `scripts/auto_sync_tcg_data.py` - Daily sync
- ✅ Shell scripts for automation (`run_auto_sync.sh`, `update_all_prices.sh`)

#### Systemd Services (Linux Deployment)
- ✅ `tcg-pipeline.service` - Systemd service
- ✅ `tcg-pipeline.timer` - Systemd timer for scheduling

### Missing Automation

#### Vercel Cron Jobs
**Status:** ❌ Not configured
**Needed:**
- Create `vercel.json` with cron configuration:
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/update-prices",
        "schedule": "0 2 * * *"
      },
      {
        "path": "/api/cron/portfolio-snapshot",
        "schedule": "0 3 * * *"
      }
    ]
  }
  ```
- Create API endpoints:
  - `/api/cron/update-prices` - Daily price updates
  - `/api/cron/portfolio-snapshot` - Daily portfolio snapshots
- Add `CRON_SECRET` environment variable
- Implement secret verification in endpoints

---

## 📚 Additional Context

### Completed Phases (from implementationPlan.txt)

✅ **Phase 1: Foundation & Authentication** (100%)
- Next.js app setup with Slab Advisor branding
- Orange (#f25733) and grey palette
- Supabase authentication (email/password + Google OAuth)
- Protected routes
- Basic layout structure

✅ **Phase 2: Core Upload & Grading** (100%)
- Image upload interface (drag & drop)
- Front/back image upload with preview
- Image validation (size, format)
- Database schema (cards, credits, users)
- Security vulnerabilities fixed
- Card collection dashboard
- Individual card details view

🟡 **Phase 3: Core Navigation & Dashboard** (60%)
- ✅ Sidebar navigation (Dashboard, Collection, Add Card)
- ✅ Mobile hamburger menu
- ✅ Credits display in navigation
- ⚠️ Dashboard shows placeholders ("Coming Soon")
- ❌ Discover page not implemented
- ❌ Settings page not implemented

🟡 **Phase 4: Enhanced Collection Management** (70%)
- ✅ Collection page with header
- ✅ Grid and list views with excellent UX
- ✅ Trading card aspect ratio (2.5:3.5)
- ✅ Responsive grid (2-5 columns)
- ❌ Search and filtering not implemented
- ❌ Bulk operations not implemented
- ❌ Export functionality not implemented

🟡 **Phase 5: Add Card Flow** (85%)
- ✅ Drag & drop upload interface
- ✅ Front/back image upload
- ✅ Credit system integration
- ✅ Card identification modal
- ✅ Comprehensive error handling
- ❌ Manual entry forms not implemented
- ❌ Market price integration not implemented

❌ **Phase 2.5: Database Foundation & User Profiles** (0%)
- Not started (see Tier 2, Item 5)

❌ **Phase 6: Social Features & Public Profiles** (0%)
- Not started (see Tier 2, Item 5)

❌ **Phase 7: Market Price Analysis & Advanced Features** (0%)
- Not started (see Tier 1, Items 1, 2, 4)

❌ **Phase 8: Additional Features & Mobile Optimization** (0%)
- Not started (see Tier 3, Item 9)

---

## 🎯 Recommended Implementation Order

### Week 1-2: Historical Pricing Foundation
**Goal:** Enable portfolio tracking and value charts
**Tasks:**
- Create missing database tables (daily_raw_prices, portfolio_snapshots, price_cache)
- Set up Redis/Upstash for caching
- Build pricing-service.ts and portfolio-service.ts
- Create Vercel cron endpoints
- Implement portfolio value calculation API

### Week 3-4: Ximilar Grading Integration
**Goal:** Core product differentiator
**Tasks:**
- Create Ximilar service layer
- Build grading API endpoint
- Implement image upload flow
- Create grading results UI
- Integrate credit system
- Add to collection flow

### Week 5: Card Identification
**Goal:** Frictionless add-to-collection
**Tasks:**
- Extend Ximilar service for identification
- Build fuzzy matching against database
- Create identification review UI
- Integrate into add-to-collection flow

### Week 6: Pre-grading Recommendations
**Goal:** High-value feature for collectors
**Tasks:**
- Research grading service costs
- Build ROI calculator
- Create recommendation engine
- Build recommendation UI
- Integrate into card detail views

### Week 7-9: AI Collection Advisor (Claude Agent SDK)
**Goal:** Premium intelligence layer with revenue potential
**Tasks:**
- Set up Claude Agent SDK integration
- Create custom tools (collection stats, grading ROI, price history)
- Build chat interface with streaming responses
- Implement conversation management and history
- Create premium subscription tier (Stripe integration)
- Build API endpoints for chat and sessions
- Add usage tracking and cost monitoring

### Week 10: Username & Shareable Collections
**Goal:** Enable viral growth
**Tasks:**
- Create profiles and follows tables
- Update signup flow with username
- Build profile settings page
- Create public profile pages
- Implement share functionality

### Week 11: Dashboard & Card Details Completion
**Goal:** Polish existing features
**Tasks:**
- Integrate real data into dashboard
- Add historical price charts
- Build similar cards section
- Add set completion widget

### Week 12: Gamma/Preprod Pipeline
**Goal:** Safe production deployment
**Tasks:**
- Set up preprod Supabase project
- Configure preprod Vercel deployment
- Create migration scripts
- Document workflow

### Week 13+: Polish & Launch Prep
**Goal:** Production-ready
**Tasks:**
- Search and filtering
- Bulk operations
- Mobile optimization
- Accessibility audit
- Performance optimization
- Error handling polish

---

## 📊 Feature Comparison Matrix

| Feature | Status | Priority | Effort | Dependencies |
|---------|--------|----------|--------|--------------|
| Historical Pricing | 🟡 60% | 🔴 Critical | 1-2 weeks | Redis, API keys |
| Grading (Ximilar) | ❌ 0% | 🔴 Critical | 2 weeks | Ximilar API |
| Card Identification | ❌ 0% | 🔴 Critical | 1.5 weeks | Ximilar API |
| Pre-grading Recs | ❌ 0% | 🟠 High | 1 week | Grading |
| AI Collection Advisor | ❌ 0% | 🟠 High (Premium) | 2-3 weeks | Grading, Historical Pricing, Claude API |
| Username/Sharing | ❌ 0% | 🟠 High | 1.5 weeks | None |
| Dashboard Completion | 🟡 40% | 🟠 High | 3-5 days | Collection data |
| Card Detail Polish | 🟡 80% | 🟡 Medium | 2-3 days | Historical pricing |
| Gamma Pipeline | ❌ 0% | 🔴 Critical* | 3-5 days | None |
| App Polish | 🔄 Ongoing | 🟡 Medium | Ongoing | None |

*Critical before production launch, not for development

---

## 🏁 Launch Readiness Checklist

### Before Beta Launch
- [ ] Historical pricing implemented (Tier 1, Item 1)
- [ ] Grading implemented (Tier 1, Item 2)
- [ ] Card identification implemented (Tier 1, Item 3)
- [ ] Pre-grading recommendations (Tier 1, Item 4)
- [ ] Dashboard with real data (Tier 2, Item 6)
- [ ] Username system (Tier 2, Item 5)
- [ ] Preprod pipeline (Tier 3, Item 8)
- [ ] Mobile responsive (Tier 3, Item 9)
- [ ] Error handling comprehensive (Tier 3, Item 9)
- [ ] Performance optimized (Tier 3, Item 9)

### Before Public Launch
- [ ] Shareable collections (Tier 2, Item 5)
- [ ] Social features (profiles, follows)
- [ ] Search and filtering (Tier 3, Item 9)
- [ ] Bulk operations (Tier 3, Item 9)
- [ ] Accessibility audit complete (Tier 3, Item 9)
- [ ] PWA features (Tier 3, Item 9)
- [ ] Terms of service
- [ ] Privacy policy
- [ ] User documentation
- [ ] Support system

---

## 📖 Technical Documentation References

### API Documentation
- **Ximilar API:** https://docs.ximilar.com/
- **TCGdex API:** https://tcgdex.dev/
- **TCGCSV API:** Used for price data
- **Supabase:** https://supabase.com/docs
- **Vercel Cron:** https://vercel.com/docs/cron-jobs

### Implemented Files Reference
- **Pricing:** `scripts/update_pokemon_prices.py`, `src/utils/priceUtils.ts`
- **Variants:** `scripts/sync_card_variants_v2.py`, `src/utils/variantUtils.ts`
- **Collection:** `src/components/collection/*`
- **Types:** `src/types/ximilar.ts`, `src/models/database.ts`

### Architecture Diagram
```
Frontend (Next.js 15)
      ↓
  API Routes
      ↓
Services Layer
      ├── Supabase (Auth & DB)
      ├── Ximilar (Grading & Recognition)
      ├── TCGCSV (Price Data)
      ├── PokemonPriceTracker (Historical Prices)
      ├── Redis/Upstash (Caching)
      └── Stripe (Payments - future)
```

---

**Last Updated:** January 6, 2025
**Document Version:** 2.0 (Unified)