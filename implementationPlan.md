# Slab Advisor Implementation Plan

## 📊 Overall Progress Summary

**Last Updated:** February 6, 2026

### Project Completion: ~92%

#### ✅ Fully Completed
- **Phase 1**: Foundation & Authentication (100%)
- **Phase 2**: Core Upload & Grading Framework (100%)
- **Database Schema**: Pokemon cards, collections, pricing infrastructure, portfolio snapshots (100%)
- **Pricing Pipeline**: Python scripts for daily price updates (100%)
- **Variant System**: Multi-pattern support (Poké Ball, Master Ball) (100%)
- **Collection Management**: CRUD operations, grid/list views, products (90%)
- **Browse Experience**: Card browsing, set viewing, filtering (90%)
- **Explore Page**: Game selection hub + widgets (100%)
- **Ximilar Card Identification**: Camera scan, image upload, card matching (100%)

#### 🟡 Partially Completed
- **Phase 3**: Dashboard & Navigation (85%)
- **Phase 4**: Collection Features (90%)
- **Phase 5**: Add Card Flow (95%)
- **Pricing Display**: Smart price formatting implemented, historical tracking complete (95%)
- **Ximilar Integration**: Card ID complete (100%), Grading complete (100%)
- **Camera Configuration**: Use-case specific camera settings (100%)
- **Explore/Browse Polish**: UI cleanup, mobile filters, variant display fixes (90%)

#### ✅ Recently Completed
- **Observability Stack**: PostHog analytics with custom events + Sentry error tracking with performance spans, logs, and metrics ✅ (February 8, 2026)
- **Waitlist Landing Page**: Pre-launch waitlist with email signup, Resend integration, mobile-responsive design, bypass system for internal access ✅ (February 6, 2026)
- **App Icon Redesign**: Premium dark slate slab design with amber vault, PWA manifest, updated metadata ✅ (February 6, 2026)
- **Gamma/Preprod Pipeline**: Full staging environment with dual-database workflow, environment badge, DB change management ✅ (January 31, 2026)
- **Historical Portfolio Tracking**: Portfolio value chart with live KPIs ✅ (January 17, 2026)
- **Price Migration**: Migrated from price_data column to pokemon_card_prices table ✅ (January 16, 2026)
- **Product Collection**: Quick-add sealed products to collection ✅ (January 18, 2026)
- **Product Prices**: Sealed product pricing with pokemon_product_price_history ✅ (January 15, 2026)
- **Pipeline Scripts**: Reorganized into numbered step-based pipeline (step1-step5) ✅ (January 16, 2026)

#### ❌ Not Started
- **Social Features**: Username, followers, shareable collections (0%)
- **Store/Marketplace**: Internal product purchasing (0%)

---

## 🎯 Implementation Priority Tiers

### Tier 1: Core Value Proposition (Do First)

These features deliver unique value that competitors don't have and form the foundation of the product's value proposition.

#### 1. Historical Pricing ✅ COMPLETED
**Status:** ✅ 100% Complete
**Priority:** 🔴 Critical
**Completed:** January 17, 2026

**What's Done:**
- ✅ Python price update script (`scripts/update_pokemon_prices.py`)
- ✅ ~~Database columns: `price_data` (JSONB), `price_last_updated`~~ (Removed - now using pokemon_card_prices table)
- ✅ Smart price display utilities (`src/utils/priceUtils.ts`)
- ✅ Multi-variant price support (Poké Ball, Master Ball patterns)
- ✅ Daily price fetching from TCGCSV API
- ✅ **PokemonPriceTracker sync script** (`scripts/sync_pokemon_price_tracker.ts`) - Fetches raw + graded historical prices
- ✅ **pokemon_card_prices table** - Stores historical price data with pre-sliced time ranges (serves as our price cache)
- ✅ **PriceWidget component** - Interactive price chart with Raw/Graded toggle
- ✅ **Price history chart** with Recharts (AreaChart, natural curves)
- ✅ **Time range selector** (7D, 1M, 3M, 1Y)
- ✅ **Condition/grade selectors** for filtering chart data
- ✅ **Variant selector** for multi-variant cards
- ✅ **Volume display** - Shows sales count for selected period
- ✅ **On-the-fly percent change** - Calculated from chart data (works for all conditions/grades)
- ✅ **PSA 10 potential upsell** - Shows graded value for Near Mint raw cards
- ✅ **Confidence indicator** - Shows price confidence for graded cards
- ✅ **Chart UX improvements** - Limited X-axis ticks, Y-axis padding, single data point handling, smooth curves
- ✅ **`portfolio_snapshots` table** - Tracks portfolio value over time with RLS policies
- ✅ **`snapshot_all_portfolios()` function** - Efficient bulk INSERT with variant/condition mapping
- ✅ **pg_cron job** - Daily midnight UTC snapshots scheduled
- ✅ **Initial snapshot created** - Verified working (1 user, 91 cards, $2,430.14)
- ✅ **`PortfolioHistoryChart.tsx` component** - Recharts AreaChart with time ranges (7D, 30D, 90D, 1Y)
- ✅ **Live portfolio KPIs** - Real-time card count, product count, total value
- ✅ **Dashboard integration** - Portfolio chart prominently displayed on dashboard
- ✅ **UTC to local timezone conversion** - Chart displays dates in user's local timezone

**Code Migration COMPLETED:**
- ✅ Updated `src/lib/pokemon-db-server.ts` to join with `pokemon_card_prices` instead of using removed `price_data` column
- ✅ Updated all components that use `price_data` from cards
- ✅ Updated utility files for new price structure
- ✅ Python scripts reorganized into step-based pipeline (step1-step5)
- ✅ `update_pokemon_prices.py` marked as deprecated - replaced by step4_sync_pokemon_price_tracker.py

**Note:** Type System Refactor TODO remains - see dedicated section below for cleaning up TypeScript types after migration

**Type System Refactor TODO (Post-Price Migration):**
- ❌ Refactor TypeScript types after migrating to `pokemon_card_prices` and `pokemon_product_price_history` tables
  - Review and update `src/models/pokemon.ts`:
    - Clean up `PokemonCard` type (remove `any` type for `price_data`)
    - Create proper typed interface for card price data from `pokemon_card_prices`
    - Update `PokemonProductWithPrice` to use `pokemon_product_latest_prices` view types
    - Remove or deprecate legacy `PokemonProductPrice` type
    - Fix `CardFull` type (currently uses `Partial` with TODO comment)
  - Review and update `src/models/database.ts`:
    - Ensure `pokemon_card_prices` table types are properly defined
    - Ensure `pokemon_product_price_history` table types are properly defined
    - Verify `pokemon_product_latest_prices` view types are complete
  - Create dedicated price type interfaces:
    - `CardPriceData` - structured type for card prices (replaces JSONB `price_data`)
    - `ProductPriceData` - structured type for product prices
    - `PriceHistoryEntry` - type for historical price records
  - Fix all TypeScript errors and remove `eslint-disable` comments:
    - `src/models/pokemon.ts` - remove `@typescript-eslint/no-explicit-any`
    - Search codebase for other `any` types related to price data
  - Update functions that return price data to use new types:
    - `getSetWithCardsAndProductsServer()` in `pokemon-db-server.ts`
    - `getCardWithSetServer()` in `pokemon-db-server.ts`
    - Price utility functions in `src/utils/priceUtils.ts`
  - Run `npm run build` to verify no type errors remain

**Database Implementation Details:**

The `portfolio_snapshots` table stores daily portfolio values:
```sql
CREATE TABLE portfolio_snapshots (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  total_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  card_count INTEGER NOT NULL DEFAULT 0,
  product_value NUMERIC(12, 2) NOT NULL DEFAULT 0,  -- Future: sealed products
  product_count INTEGER NOT NULL DEFAULT 0,          -- Future: sealed products
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_date UNIQUE (user_id, recorded_at)
);
```

The `snapshot_all_portfolios()` function:
- **Bulk INSERT with UPSERT** - No loops, efficient for any number of users
- **Variant mapping**: collection_cards → prices_raw keys
  - `holo` → `Holofoil`
  - `reverse_holo` → `Reverse Holofoil`
  - `first_edition` → `1st Edition Holofoil`
  - `illustration_rare`, `alt_art`, `full_art`, `secret_rare` → `Holofoil`
  - Default → `Normal`
- **Condition mapping**: collection_cards → prices_raw keys
  - `mint`, `near_mint` → `Near Mint`
  - `lightly_played` → `Lightly Played`
  - `moderately_played` → `Moderately Played`
  - `heavily_played` → `Heavily Played`
  - `damaged` → `Damaged`
- **Price fallback priority**:
  1. Exact variant/condition price from `prices_raw`
  2. `current_market_price` (reliable default with condition)
  3. Market average from `prices_raw->>'market'`
  4. Zero (no price available)

**Next Steps (After Data Accumulates - ~7 days):**

1. **Create TypeScript types** (`/src/types/database.ts`):
   ```typescript
   export interface PortfolioSnapshot {
     id: number;
     user_id: string;
     recorded_at: string;
     total_value: number;
     card_count: number;
     product_value: number;
     product_count: number;
     created_at: string;
   }
   ```

2. **Create data fetcher** (`/src/lib/portfolio-server.ts`):
   - `getPortfolioHistory(userId, days)` - Fetch snapshots for chart
   - `getCurrentPortfolioValue(userId)` - Get latest snapshot or live calculation

3. **Create chart component** (`/src/components/dashboard/PortfolioHistoryChart.tsx`):
   - Use existing Recharts patterns from `PriceWidget.tsx`
   - Green gradient fill (`#10B981` / emerald-500)
   - Time range selector: 7D, 30D, 90D, 1Y
   - Custom tooltip with date + currency formatted value
   - Empty state: Show current live value as single point if no history

4. **Update Dashboard** (`/src/app/(authenticated)/dashboard/page.tsx`):
   - Add `PortfolioHistoryChart` below `DashboardStats`
   - Fetch portfolio history in server component

5. **Update `getDashboardStats()`** (`/src/lib/collection-server.ts`):
   - Return `estimatedValue` from latest `portfolio_snapshots` entry
   - Fall back to live calculation if no snapshots

**Files to Create:**
- `/src/lib/portfolio-server.ts`
- `/src/components/dashboard/PortfolioHistoryChart.tsx`

**Files to Modify:**
- `/src/types/database.ts` - Add PortfolioSnapshot type
- `/src/lib/collection-server.ts` - Update getDashboardStats
- `/src/app/(authenticated)/dashboard/page.tsx` - Add chart component

**Dependencies:**
- ✅ pg_cron extension (enabled)
- ✅ portfolio_snapshots table (created)
- ✅ snapshot_all_portfolios() function (created)
- ✅ Daily cron job (scheduled at midnight UTC)

---

#### 2. Grading Using Ximilar ✅ COMPLETED
**Status:** ✅ 100% Complete
**Priority:** 🔴 Critical
**Completed:** January 10, 2026

**Implementation Summary:**
Full AI-powered card grading system integrated with the Grading Opportunities widget. Users can scan cards from a curated list of profitable grading opportunities, capture front/back images, and receive AI grading results with detailed breakdowns.

**What Was Implemented:**
- ✅ Ximilar grading API integration (`/collectibles/v2/pokemon/grading`)
- ✅ Private image storage (Supabase Storage bucket for user images)
- ✅ Image upload API with base64 encoding for Ximilar
- ✅ Grading API endpoint with credit deduction and refunds
- ✅ Multi-step grading UI flow (capture front → preview → capture back → preview → confirm → process → results)
- ✅ Grading results display with overall grade and breakdown (corners, edges, surface, centering)
- ✅ Centering measurements (front/back LR and TB percentages)
- ✅ Annotated image storage (Ximilar's annotated images downloaded and stored)
- ✅ Credit system integration (deduct on start, refund on failure)
- ✅ Race condition protection with idempotency tokens
- ✅ SSRF protection for downloading external images
- ✅ `collection_card_gradings` table for grading history
- ✅ Dashboard widgets: Grading Opportunities (profitable cards to grade) + Recent Scans (grading history carousel)
- ✅ Grading Analysis Modal with profit breakdown (PSA 10/PSA 9 potential)
- ✅ Dynamic badges (Safe Bet vs PSA 10 Required based on PSA 9 profitability)

**Files Created:**
- `/src/lib/ximilar-grading-service.ts` - Ximilar grading API integration
- `/src/lib/storage-service.ts` - Image upload/download/base64 conversion
- `/src/lib/grading-opportunities-server.ts` - Fetch profitable grading opportunities
- `/src/lib/recent-scans-server.ts` - Fetch user's recent grading history
- `/src/app/api/cards/grade/route.ts` - Grading API endpoint
- `/src/app/api/cards/upload-image/route.ts` - Image upload API endpoint
- `/src/app/api/grading-opportunities/route.ts` - API for grading opportunities
- `/src/components/dashboard/GradingOpportunitiesWidget.tsx` - Server component widget
- `/src/components/dashboard/GradingOpportunityList.tsx` - Client list with modal trigger
- `/src/components/dashboard/GradingOpportunityRow.tsx` - Row component with card info
- `/src/components/dashboard/GradingAnalysisModal.tsx` - Multi-step grading flow modal
- `/src/components/dashboard/GradingConfirmation.tsx` - Pre-grading confirmation view
- `/src/components/dashboard/GradingResultView.tsx` - Grading results display
- `/src/components/dashboard/ImagePreview.tsx` - Image preview with retake option
- `/src/components/dashboard/RecentScansWidget.tsx` - Horizontal carousel of recent scans
- `/src/types/grading-opportunity.ts` - TypeScript types for grading opportunities

**Database Changes:**
- Created `collection_card_gradings` table with RLS policies
- Added columns: `grade_final`, `grade_corners`, `grade_edges`, `grade_surface`, `grade_centering`, `condition`, centering measurements, annotated image paths
- Indexes on `user_id` and `collection_card_id`

**Security Hardening:**
- Race condition protection using unique constraint on `(collection_card_id, idempotency_token)`
- SSRF protection: Only allow downloads from trusted Ximilar domains
- Credit refunds on grading failure
- Server-side image storage (user images never exposed publicly)

**Dependencies:**
- ✅ Ximilar API key (XIMILAR_API_TOKEN)
- ✅ Image storage (Supabase Storage - private bucket)
- ✅ Credit system (already implemented)

---

#### 3. Card Identification Using Ximilar ✅ COMPLETED
**Status:** ✅ 100% Complete
**Priority:** 🔴 Critical
**Completed:** December 21, 2025

**Implementation Summary:**
Full camera-based card identification integrated into Quick Add flow. Users can scan cards with their device camera or upload from gallery, and the system identifies the card using Ximilar's TCG identification API, matches it against the database, and allows adding to collection.

**What Was Implemented:**
- ✅ Ximilar TCG Identification API integration (`/collectibles/v2/tcg_id`)
- ✅ Camera capture with card alignment guide overlay
- ✅ Gallery image upload support
- ✅ Front/back camera switching
- ✅ Database matching with multiple strategies (exact ID, name+set fuzzy match)
- ✅ English-only card filtering (filters out Japanese/other language cards)
- ✅ Horizontal carousel UI showing all matches with confidence scores
- ✅ Variant selection (Normal, Holo, Reverse Holo)
- ✅ Quantity selector for batch adding
- ✅ Auto-return to camera after successful add (rapid scanning workflow)
- ✅ Visual feedback with green checkmark for selected cards
- ✅ Processing/identifying loading states
- ✅ Error handling for camera access and API failures

**Files Created:**
- `/src/lib/ximilar-service.ts` - Ximilar API integration with card identification
- `/src/app/api/cards/identify/route.ts` - Server-side API route for card identification
- `/src/components/camera/CameraCapture.tsx` - Full-screen camera viewfinder component
- `/src/components/search/ScanResultsView.tsx` - Carousel results display with add-to-collection
- `/src/hooks/useCardIdentification.ts` - Hook for identification state management
- `/src/hooks/useCameraCapture.ts` - Hook for camera access and capture logic
- `/src/types/ximilar.ts` - TypeScript types for Ximilar API responses

**Files Modified:**
- `/src/contexts/QuickAddContext.tsx` - Added camera/identifying/results view states
- `/src/components/search/QuickAddModal.tsx` - Support for camera workflow
- `/src/components/search/QuickAddContent.tsx` - Camera button integration

**Key Technical Decisions:**
- Base64 image encoding for camera capture (avoids file upload complexity)
- Server-side Ximilar API calls (protects API key)
- Database-only results filtering (only shows cards that exist in our database)
- 1.5 second delay before returning to camera (allows user to see success message)

---

#### 3.5 Camera Configuration ✅ COMPLETED
**Status:** ✅ 100% Complete
**Priority:** 🟡 Medium
**Completed:** January 13, 2026

**Implementation Summary:**
Configurable camera settings that allow different use cases (grading vs quick add) to have optimized camera behavior. Flash functionality was removed entirely due to glare issues on card surfaces.

**What Was Implemented:**
- ✅ Removed all flash/torch functionality (causes glare on cards during grading)
- ✅ `allowCameraSwitch` prop - Enable/disable front/back camera toggle per use case
- ✅ `showLevelIndicator` prop - Enable/disable bubble level indicator per use case
- ✅ Device orientation API integration for level detection (iOS permission handling)
- ✅ Visual bubble level indicator (turns green when phone is level within ±3°)

**Use Case Configuration:**
| Use Case | Camera Switch | Level Indicator | Rationale |
|----------|---------------|-----------------|-----------|
| **AI Grading** | Disabled | Enabled | Back camera only for quality; level helps with precise alignment |
| **Quick Add** | Enabled | Disabled | Front camera acceptable for identification; speed over precision |

**Files Modified:**
- `/src/hooks/useCameraCapture.ts` - Removed flash functionality entirely
- `/src/components/camera/CameraCapture.tsx` - Added `allowCameraSwitch` and `showLevelIndicator` props
- `/src/contexts/QuickAddContext.tsx` - Set `allowCameraSwitch={true}` for quick add flow
- `/src/components/dashboard/GradingAnalysisModal.tsx` - Set `showLevelIndicator={true}` for grading flow

**Files Created:**
- `/src/hooks/useDeviceLevel.ts` - Device orientation hook with iOS permission handling
- `/src/components/camera/LevelIndicator.tsx` - Visual bubble level component

**Technical Details:**
- Level threshold: ±3° (configurable via `levelThreshold` option)
- Level update frequency: 50ms (configurable via `updateInterval` option)
- iOS 13+ requires explicit permission request via user gesture
- Bubble offset calculated from beta (front/back tilt) and gamma (left/right tilt)

**Why Flash Was Removed:**
Flash/torch causes glare on glossy card surfaces, making it counterproductive for both grading (need to see surface details) and identification (need clear image). The `MediaStreamTrack.getCapabilities()` API also has limited browser compatibility, causing the flash button to not appear on many Android devices.

---

#### 4. Pre-grading Recommendations ✅ COMPLETED
**Status:** ✅ 100% Complete
**Priority:** 🟠 High
**Completed:** January 10, 2026

**Implementation Summary:**
Complete grading ROI engine with dashboard widget showing profitable cards from user's collection. Integrates safety tier logic to identify cards worth grading.

**What Was Implemented:**
- ✅ Price data exists for graded cards (psa10, psa9, psa8 in `pokemon_card_prices`)
- ✅ Raw market prices available (`current_market_price`)
- ✅ Grading data structure defined
- ✅ Price sync script exists (`sync_pokemon_price_tracker.py`)
- ✅ **Grading ROI Engine implemented** in sync script:
  - `grading_cost_basis_entry` - Upfront cash required (Entry Fee + Shipping)
  - `grading_fee_entry` - PSA fee tier based on raw price
  - `grading_fee_psa9` / `grading_fee_psa10` - Final fees including upcharges
  - `profit_at_psa9` / `profit_at_psa10` - Value Added calculations
  - `roi_psa10` - ROI percentage on PSA 10
  - `upcharge_potential` - Flag for tier bump scenarios
  - `grading_safety_tier` - SAFE_BET, GAMBLE, or DO_NOT_GRADE
  - **SAFE_BET criteria updated:** Requires $20+ PSA 10 profit AND positive PSA 9 profit
- ✅ **PSA fee ladder** implemented (all tiers from Bulk $19.99 to Premium 10+ $9,999+)
- ✅ **Database columns & indexes** added to `pokemon_card_prices`
- ✅ **Integrated into price sync** - calculates on every sync
- ✅ **Dashboard "Grading Opportunities" widget** - Shows top cards to grade from user's collection
  - Bento box UI with sparkles icon and badge count
  - High-density row design (thumbnail, card info with set name + card number, hero profit number, chevron)
  - Footer "View all X opportunities" button
  - Filters out cards already graded
  - Sorts by SAFE_BET first, then by profit_at_psa10 descending
- ✅ **Grading Analysis Modal** - Profit breakdown with PSA 10/PSA 9 scenarios
  - Dynamic "Safe Bet" vs "PSA 10 Required" badge based on PSA 9 profitability
  - Safety net box with red background when PSA 9 profit is negative
  - Card number display for physical search workflow
  - ROI percentage display
  - Fee transparency
- ✅ **Recent Scans widget** - Horizontal carousel showing user's grading history

**Files Created:**
- `/src/lib/grading-opportunities-server.ts` - Server-side fetching of profitable cards
- `/src/components/dashboard/GradingOpportunitiesWidget.tsx` - Dashboard widget
- `/src/components/dashboard/GradingOpportunityList.tsx` - List component with modal
- `/src/components/dashboard/GradingOpportunityRow.tsx` - Row with card info + profit
- `/src/components/dashboard/GradingAnalysisModal.tsx` - Profit analysis modal
- `/src/components/dashboard/RecentScansWidget.tsx` - Recent grading history carousel
- `/src/types/grading-opportunity.ts` - TypeScript types

**Files Modified:**
- `/scripts/sync_pokemon_price_tracker.py` - Updated SAFE_BET logic to require $20+ PSA 10 profit
- `/src/app/(authenticated)/dashboard/page.tsx` - Integrated new widgets
- `/src/components/widgets/WidgetSection.tsx` - Added icon, badgeCount, noPadding props
- `/src/app/globals.css` - Added scrollbar-hide utility for carousel

**What's Still Missing (Future Enhancements):**
- ❌ Service comparison UI (PSA vs BGS vs SGC)
- ❌ Integration into browse card detail page

**Dependencies:**
- ✅ Price data (implemented)
- ✅ Ximilar grading integration (implemented)

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

**Phase 1: Username System ✅ COMPLETED**
1. ✅ Create `profiles` table with RLS policies
2. ✅ Create database functions (`create_user_profile`, `check_username_available`)
3. ✅ Update signup flow (redirects to complete-profile page)
4. ✅ Implement real-time username availability check with authentication
5. ✅ Validate username format (3-30 chars, alphanumeric + underscore, 70+ reserved words)
6. ✅ Create complete-profile page for both OAuth and email/password users
7. ✅ Server-side middleware to enforce profile requirement
8. ✅ Security hardening:
   - ✅ Rate limiting (30/min username checks, 5/hour profile creation)
   - ✅ Race condition protection (INSERT ON CONFLICT)
   - ✅ Authentication requirements
   - ✅ Input validation and sanitization
   - ✅ Generic error messages
   - ✅ Security headers

**Phase 2: Social Features ❌ TODO**
1. Create `follows` table with indexes
2. Create profile settings page (`/settings/profile`)
3. Build public profile pages (`/u/[username]`)
4. Add collection visibility toggle (per-card or entire collection)
5. Implement share functionality:
   - Generate shareable URLs
   - Add Open Graph meta tags
   - QR code generation for in-person sharing
6. Create social preview cards for link sharing

**Files Created:**
- ✅ `/sql/profiles/001_create_tables.sql`
- ✅ `/sql/profiles/002_create_indexes.sql`
- ✅ `/sql/profiles/003_create_rls.sql`
- ✅ `/sql/profiles/004_create_functions.sql`
- ✅ `/src/types/profile.ts`
- ✅ `/src/utils/usernameValidation.ts`
- ✅ `/src/utils/__tests__/usernameValidation.test.ts`
- ✅ `/src/utils/sanitization.ts` (XSS prevention)
- ✅ `/src/app/api/profile/username-check/route.ts`
- ✅ `/src/app/api/profile/create/route.ts`
- ✅ `/src/app/auth/complete-profile/page.tsx`
- ✅ `/src/lib/profile-service.ts`
- ✅ `/src/middleware/rateLimit.ts`

**Files To Create (Phase 2):**
- `/src/app/(authenticated)/settings/profile/page.tsx`
- `/src/app/u/[username]/page.tsx`
- `/src/components/profile/ProfileHeader.tsx`
- `/src/components/profile/PublicCollection.tsx`
- `/src/components/sharing/ShareCollectionButton.tsx`
- `/src/app/api/profile/update/route.ts`
- `/sql/profiles/005_create_follows_table.sql`

**Files Modified:**
- ✅ `/src/components/auth/AuthForm.tsx` (removed username field, redirect to complete-profile)
- ✅ `/src/app/auth/callback/page.tsx` (profile check for OAuth)
- ✅ `/src/app/(authenticated)/layout.tsx` (profile check before dashboard)
- ✅ `/middleware.ts` (server-side profile enforcement)
- ✅ `/next.config.ts` (security headers)
- ✅ `/src/models/database.ts` (regenerated with profiles table)

**Security Status:** ✅ STRONG
- All critical vulnerabilities fixed
- Defense-in-depth implemented
- Rate limiting active
- Server-side enforcement
- Production-ready for single-instance deployments

**Production Notes:**
- ✅ Works for single-instance (Vercel hobby, single server)
- ⚠️ **Multi-instance production**: Replace in-memory rate limiting with Redis/Vercel KV before scaling horizontally
- All database migrations applied and verified in production

**Dependencies:**
- None for Phase 1 ✅ COMPLETED
- Phase 2 depends on Phase 1 completion

---

#### 7. Dashboard Completion ✅ MOSTLY COMPLETE
**Status:** 🟡 90% Complete
**Priority:** 🟠 High
**Completed:** January 17, 2026 (core features)

**What's Done:**
- ✅ Dashboard page exists (`src/app/(authenticated)/dashboard/page.tsx`)
- ✅ Layout components (DashboardStats, QuickActions)
- ✅ Responsive design
- ✅ Navigation integration
- ✅ **Total Cards widget** - Server-side count from collection_cards table
- ✅ **Grading Opportunities widget** - Shows profitable cards to grade with profit potential
- ✅ **Recent Scans widget** - Horizontal carousel of AI grading history (replaced RecentActivity)
- ✅ Real data integration for card counts and grading opportunities
- ✅ **Portfolio Value Chart** - Interactive chart with 7D/30D/90D/1Y time ranges
- ✅ **Live KPIs** - Card count, product count, total estimated value
- ✅ **Sealed Products in Portfolio** - Products now included in daily snapshot calculations

**What's Missing:**
- ❌ Cards by category breakdown (Pokemon, One Piece, Sports, Other TCG)
- ❌ Followers/following counts (requires social features)

**Implementation Tasks:**
1. ~~Create dashboard data API~~ ✅ COMPLETED (via getDashboardStats in collection-server.ts)
2. ~~Implement collection value calculator~~ ✅ COMPLETED (live portfolio tracking)
3. Create category breakdown query:
   - Count cards per category
   - Calculate value per category
4. ~~Build recent activity query~~ ✅ REPLACED with Recent Scans widget
5. ~~Update DashboardStats component to fetch real data~~ ✅ COMPLETED
6. ~~Add loading states and error handling~~ ✅ COMPLETED
7. ~~Create portfolio value chart~~ ✅ COMPLETED (PortfolioHistoryChart.tsx)

**Files Modified:**
- `/src/app/(authenticated)/dashboard/page.tsx` - Integrated new widgets
- `/src/components/dashboard/DashboardStats.tsx` - Real data from server
- `/src/lib/collection-server.ts` - Added getDashboardStats function

**Files Created:**
- `/src/components/dashboard/GradingOpportunitiesWidget.tsx`
- `/src/components/dashboard/GradingOpportunityList.tsx`
- `/src/components/dashboard/GradingOpportunityRow.tsx`
- `/src/components/dashboard/GradingAnalysisModal.tsx`
- `/src/components/dashboard/RecentScansWidget.tsx`
- `/src/lib/grading-opportunities-server.ts`
- `/src/lib/recent-scans-server.ts`

**Files Deleted:**
- `/src/components/dashboard/RecentActivity.tsx` - Replaced by RecentScansWidget

**Dependencies:**
- ✅ Collection data (implemented)
- ✅ Price data (implemented)
- ❌ Portfolio tracking (Tier 1, Item 1) - for value charts

---

#### 8. Card Detail Page Completion ⚠️ IN PROGRESS
**Status:** 🟡 95% Complete
**Priority:** 🟡 Medium
**Estimated Effort:** 1-2 days

**What's Done:**
- ✅ Browse card detail page (`src/app/browse/pokemon/[setId]/[cardId]/page.tsx`)
- ✅ Collection quick view modal
- ✅ Card information display
- ✅ Price display (current price)
- ✅ Add to collection functionality
- ✅ Edit/delete for owned cards
- ✅ **Historical price chart** - PriceWidget with Raw/Graded toggle, multiple time ranges
- ✅ **Market trend indicators** - Percent change calculated on-the-fly from chart data
- ✅ **Volume display** - Shows sales count for selected period
- ✅ **Confidence indicators** - For graded prices
- ✅ **PriceHeadline responsiveness** - Percent change badge wraps when space is tight
- ✅ **Chart stability** - Added debounce to ResponsiveContainer to prevent infinite re-renders
- ✅ **Tablet-optimized layout** - Split view kicks in at md: breakpoint (768px)
- ✅ **Technical spec sheet grid** - 2-column metadata grid under image (tablet/desktop)
- ✅ **Mobile scrollable pills** - Horizontal scroll metadata under title (mobile only)
- ✅ **Responsive sticky footer** - Hidden on tablet+, shows inline action buttons instead
- ✅ **Background gap fix** - Extended white div prevents grey background showing below sticky footer

**What's Missing:**
- ❌ Grading information display (when implemented)
- ❌ Pre-grading recommendations (when implemented)
- ❌ Similar cards suggestions
- ❌ Set completion progress

**Implementation Tasks:**
1. ~~Add historical price chart component~~ ✅ COMPLETED (PriceWidget)
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

#### 9. Gamma/Preprod Pipeline Setup ✅ COMPLETED
**Status:** ✅ 100% Complete (January 31, 2026)
**Priority:** 🔴 Critical (before production launch)

**What Was Delivered:**
- ✅ Gamma Supabase project (`oeqgpubjdeomnfunezot`) - cloned from production via "Restore to new project"
- ✅ Full database schema, data, indexes, RLS policies, storage buckets transferred
- ✅ Gamma branch (`gamma`) in git with Vercel Preview deployments
- ✅ Vercel environment variable scoping (Production keys → Production, Gamma keys → Preview)
- ✅ Environment-aware `next.config.ts` (dynamic Supabase hostname from env var)
- ✅ `.env.local` points to gamma, `.env.production` and `.env.gamma` reference files created
- ✅ Database change management workflow established (gamma first → test → production)
- ✅ Baseline schema snapshot (`supabase/migrations/00000000000000_baseline_schema.sql`)
- ✅ Migration log tracking all 44 existing migrations (`supabase/MIGRATION_LOG.md`)
- ✅ CLAUDE.md updated with dual-environment workflow documentation
- ✅ Environment indicator badge (amber "GAMMA" pill in lower-right corner for non-production)
- ✅ Verification: local dev + Vercel preview both write to gamma, production untouched

**Key Files:**
- `supabase/migrations/00000000000000_baseline_schema.sql` - Full schema reference
- `supabase/MIGRATION_LOG.md` - Migration promotion tracking
- `src/components/ui/EnvironmentBadge.tsx` - Visual environment indicator
- `.env.gamma` / `.env.production` - Reference environment files

**Environments:**
| Environment | Project ID | Branch | Vercel |
|---|---|---|---|
| Gamma (staging) | `oeqgpubjdeomnfunezot` | `gamma` | Preview |
| Production | `syoxdgxffdvvpguzvcxo` | `main` | Production |

**Dependencies:**
- None (infrastructure setup)

---

#### 10. App Polish & UX Improvements 🔄 ONGOING
**Status:** 🟡 Varies by area
**Priority:** 🟡 Medium (ongoing after features)
**Estimated Effort:** Ongoing

**Areas to Polish:**

**Code Cleanup / Tech Debt:**
- ✅ ~~Remove unused `manual_` columns from `collection_cards` table~~ (Completed 2026-02-06)
  - Removed columns, index, API manual-entry mode, and utility fallback logic
  - Migration: `20260206000000_drop_manual_card_columns.sql`

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

#### 11. Explore & Browse Page Polish 🆕 IN PROGRESS
**Status:** 🟡 85% Complete
**Priority:** 🟡 Medium
**Estimated Effort:** 3-5 days

**What's Done:**
- ✅ Explore page exists with game grid
- ✅ Pokemon browse page with set listing
- ✅ Set detail page with card grid
- ✅ Card quick view modal
- ✅ Filter persistence via URL params
- ✅ **Pokemon Hero Section redesign** - Dark gradient background with fanned cards
- ✅ **HorizontalScroll improvements** - Arrow navigation + gradient fade indicators
- ✅ **NewestSetsWidget** - Self-contained widget with horizontal scroll
- ✅ **NewlyReleasedTopCardsWidget** - Top priced cards from recent sets
- ✅ **WidgetSection component** - Reusable section wrapper with "View All" link
- ✅ **Responsive hero layout** - Stacks on mobile, side-by-side on large screens
- ✅ **Text readability** - Text shadows for visibility against dynamic card backgrounds
- ✅ **SetOwnershipSummary widget** - Dynamic ownership stats from database with real-time refresh
- ✅ **Explore page cleanup** - Removed coming soon cards, added "More TCGs coming soon" message
- ✅ **Set Detail Desktop Redesign** - 3-column "Triad" layout (Identity/Scoreboard/Actions)
- ✅ **Premium Stats Grid** - Key/value grid with uppercase labels on desktop
- ✅ **Search Bar Toolbar** - Capped width (w-96) on desktop with controls pushed right
- ✅ **Responsive SetStatistics** - Mobile pills, tablet inline bullets, desktop key/value grid
- ✅ **Compact Sort/View Controls** - Icon-only buttons with dropdown/bottom sheet

**What's Missing:**

**1. Explore Page Refresh** ✅ COMPLETED
- ✅ Pokemon Hero Section with dark theme and fanned cards
- ✅ Newest Sets horizontal carousel
- ✅ Newly Released Top Cards carousel
- ✅ Remove "Coming Soon" placeholder cards (Yu-Gi-Oh!, Magic, Sports)
- ✅ Professional design with subtle hint about future TCG support
- ✅ Clean, minimal layout focusing on available content

**2. Browse Page Mobile Filter UX** ✅ COMPLETED
- ✅ Compact icon-only sort/view toggle buttons
- ✅ Sort dropdown with mobile bottom sheet
- ✅ Touch-friendly controls with proper sizing
- ✅ Single-row toolbar layout

**3. Set Detail Page UI Cleanup** ✅ COMPLETED
- ✅ Desktop: 3-column "Triad" layout (Identity | Scoreboard | Actions)
- ✅ Desktop: Premium key/value grid for stats with uppercase labels
- ✅ Tablet: 2-column layout with logo row + content row
- ✅ Mobile: Stacked layout with horizontal scrolling stat pills
- ✅ Removed redundant ownership title on desktop
- ✅ Better information hierarchy across all breakpoints

**4. Set Detail Page Ownership Awareness**
- ❌ Visual indicator on owned cards (badge/icon/border overlay)
- ❌ "Owned" / "Not Owned" filter dropdown (members only)
- ❌ Filter UI hidden for non-authenticated users
- ❌ Persist ownership filter in URL params
- ❌ Show ownership count in filter label (e.g., "Owned (12)")

**5. Ownership Widget Completion**
- ✅ Redesigned widget with circular progress indicator
- ✅ Dynamic color gradient (red → orange → yellow → green based on ownership %)
- ✅ Center content shows cards remaining + percentage complete
- ✅ "Start your collection!" message for 0% ownership
- ✅ Green glow animation for 100% ownership ("Set Complete")
- ✅ Set name in title ("{Set Name} Set")
- ❌ Add flip animation to show rarity breakdown on click
- ❌ Test 100% ownership state with glow animation
- ❌ Add variant breakdown in ownership stats
- ❌ Show value of owned cards vs total set value

**6. Variant Count Display Bug (Investigation Required)**
- ❌ Card grid shows "2 variants" but quick view shows 3 variants (Normal, Holo, Reverse)
- ❌ Investigate: Is this "2 variants WITH prices" vs "3 variants total"?
- ❌ Clarify wording to avoid user confusion
- ❌ Possible solutions:
  - "2 variants available" (with prices)
  - "3 variants (2 priced)"
  - Show all variants, mark unpriced ones

**7. Quick Add to Collection Feature** ✅ COMPLETED
- ✅ Add "+" button overlay on cards for quick collection add
- ✅ Desktop: button appears on hover, opens anchored popover
- ✅ Tablet: button always visible, opens centered modal
- ✅ Mobile: button always visible, opens bottom sheet
- ✅ Form fields: Variant, Quantity (default: 1), Condition (default: Near Mint)
- ✅ Only visible for authenticated users
- ✅ List view: Quick Add as first column
- ✅ Success: close modal + show toast + refresh ownership widget
- ✅ Create reusable Toast component for app-wide notifications

**Implementation Tasks:**
1. ✅ Redesign Pokemon Hero Section with dark gradient and fanned cards
2. ✅ Create HorizontalScroll component with arrow navigation
3. ✅ Create NewestSetsWidget with horizontal carousel
4. ✅ Create NewlyReleasedTopCardsWidget with top priced cards
5. ✅ Create WidgetSection wrapper component
6. ✅ Redesign explore page - remove coming soon cards, add elegant "more coming" message
7. ✅ Refactor `BrowseFilterAndSort.tsx` - capped search width, toolbar layout, icon buttons
8. ✅ Redesign `PokemonSetHeader.tsx` - 3-column triad layout, responsive breakpoints
9. ✅ Complete `SetOwnershipSummary` - circle/bar variants, showTitle prop, skeleton states
10. ✅ Refactor `SetStatistics.tsx` - mobile pills, tablet bullets, desktop key/value grid
11. ✅ Refactor `SortDropdown.tsx` - icon button with dropdown menu + mobile bottom sheet
12. ✅ Refactor `ViewToggle.tsx` - single toggle icon button
13. ❌ Investigate variant count discrepancy in `CardListItem.tsx` / `CardQuickViewContent.tsx`
14. ❌ Update variant display logic to clarify priced vs total variants
15. ❌ Add owned card visual indicator to `CardListItem.tsx` and card grid
16. ❌ Add ownership filter dropdown to `BrowseFilterAndSort.tsx` (members only)
17. ❌ Wire ownership filter to card list filtering logic

**Files Created:**
- ✅ `/src/components/explore/PokemonHeroSection.tsx` - Dark gradient hero with fanned cards
- ✅ `/src/components/widgets/HorizontalScroll.tsx` - Client component with arrow navigation
- ✅ `/src/components/widgets/NewestSetsWidget.tsx` - Self-contained sets carousel
- ✅ `/src/components/widgets/NewlyReleasedTopCardsWidget.tsx` - Top cards carousel
- ✅ `/src/components/widgets/WidgetSection.tsx` - Reusable section wrapper
- ✅ `/src/components/collection/QuickAddButton.tsx` - Quick add button overlay
- ✅ `/src/components/collection/QuickAddForm.tsx` - Quick add form with variant/quantity/condition
- ✅ `/src/components/collection/QuickAddModal.tsx` - Responsive modal (popover/modal/bottomsheet)
- ✅ `/src/components/ui/Toast.tsx` - Reusable toast notification component

**Files Modified:**
- ✅ `/src/lib/pokemon-db-server.ts` - Added `getNewestSetsServer()` and `getTopCardsFromNewestSetsServer()`
- ✅ `/src/app/explore/page.tsx` - Integrated new widgets
- ✅ `/src/app/browse/pokemon/[setId]/SetDetailClient.tsx` - Quick Add integration
- ✅ `/src/components/browse/CardQuickViewContent.tsx` - Responsive layouts (modal/sidesheet/bottomsheet)
- ✅ `/src/components/cards/TCGCard.tsx` - Hover-reveal Quick Add button
- ✅ `/src/components/collection/AddToCollectionForm.tsx` - Compact 2-column grid layout
- ✅ `/src/components/pokemon/CardListItem.tsx` - Quick Add column
- ✅ `/src/components/ui/QuickView.tsx` - Layout context + mobile bottom sheet improvements
- ✅ `/src/app/globals.css` - Custom touch/hover-capable Tailwind variants + slide-up animation
- ✅ `/src/components/browse/BrowseFilterAndSort.tsx` - Capped search width, toolbar layout
- ✅ `/src/components/browse/pokemon/PokemonSetHeader.tsx` - 3-column triad, responsive layouts
- ✅ `/src/components/sets/SetOwnershipSummary.tsx` - Circle/bar variants, showTitle prop
- ✅ `/src/components/sets/SetStatistics.tsx` - Mobile pills, tablet bullets, desktop key/value grid
- ✅ `/src/components/sets/ShopTheSet.tsx` - Flex-wrap buttons, showTitle prop
- ✅ `/src/components/ui/SortDropdown.tsx` - Icon button with dropdown + mobile bottom sheet
- ✅ `/src/components/ui/ViewToggle.tsx` - Single toggle icon button

**Files Still To Modify:**
- `/src/components/explore/GameGrid.tsx`
- `/src/components/explore/ComingSoonBanner.tsx` (remove or repurpose)
- `/src/constants/tcg-games.ts`

**Dependencies:**
- None (UI polish work)

---

### Tier 4: Critical Pre-Launch Infrastructure

These features MUST be implemented before beta launch. They enable monetization, protect against abuse, and ensure quality.

#### 12. Observability Stack (PostHog + Sentry) ✅ COMPLETED
**Status:** ✅ 100% Complete
**Priority:** 🔴 Critical
**Completed:** February 8, 2026

**What's Done:**

**PostHog Analytics:**
- ✅ PostHog account setup and project creation
- ✅ PostHog SDK integration via `instrumentation-client.ts`
- ✅ GDPR-compliant consent with `cookieless_mode: 'on_reject'`
- ✅ User identification on login/logout (AuthProvider)
- ✅ Session recording with privacy masking
- ✅ Custom event tracking across 12+ components

**PostHog Events Implemented:**
- ✅ `user_signed_up` / `user_signed_in` / `user_signed_out`
- ✅ `card_added` / `card_removed`
- ✅ `card_graded` with grade, credits, duration
- ✅ `card_details_viewed`
- ✅ `collection_viewed` with view mode, card count
- ✅ `search_performed` with query, results count
- ✅ `credits_used`
- ✅ `error_occurred` (ErrorBoundary)

**Sentry Error Tracking:**
- ✅ Client/Server/Edge initialization
- ✅ Exception catching in all 17 API routes
- ✅ User context on login/logout
- ✅ Source maps for readable stack traces

**Sentry Performance Tracing:**
- ✅ Spans for Ximilar API calls (identify, grade)
- ✅ Spans for Resend email API
- ✅ Spans for database operations

**Sentry Logs:**
- ✅ `consoleLoggingIntegration` capturing warn/error

**Sentry Metrics:**
- ✅ `cards_graded`, `cards_identified` counts
- ✅ `credits_consumed` count
- ✅ `collection_cards_added` count
- ✅ Latency distributions for grading, identification, search

**Files Created:**
- `/src/lib/posthog/events.ts` - Typed event tracking helpers
- `/src/lib/posthog/utils.ts` - Consent and identity helpers
- `/src/components/consent/CookieConsent.tsx` - GDPR banner

**Files Modified:**
- `/src/instrumentation-client.ts` - PostHog + Sentry client init
- `/sentry.server.config.ts` - Server-side Sentry
- `/sentry.edge.config.ts` - Edge runtime Sentry
- `/src/components/providers/AuthProvider.tsx` - User identification
- 17 API routes - Exception catching + metrics
- 12+ components - Event tracking

**Documentation:** See `implementationObservabilityStackPlan.md` for full details

---

#### 13. Payment System (Stripe) ❌ NOT STARTED
**Status:** ❌ 0% Complete
**Priority:** 🔴 Critical
**Estimated Effort:** 1-2 weeks

**What's Missing:**

**Subscriptions:**
- ❌ Stripe account setup and configuration
- ❌ Subscription product/price creation in Stripe
- ❌ Stripe Customer Portal integration
- ❌ Subscription checkout flow
- ❌ Webhook handling for subscription events
- ❌ `subscriptions` database table
- ❌ Subscription status checking middleware
- ❌ Free tier limits enforcement

**Credit Packs:**
- ❌ Credit pack products in Stripe
- ❌ One-time purchase checkout flow
- ❌ Credit delivery on successful payment
- ❌ Purchase history tracking

**Subscription Tiers:**
| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 5 AI gradings/month, basic collection |
| Premium | $9.99/mo | Unlimited gradings, priority support, advanced analytics |
| Pro | $19.99/mo | Everything + API access, bulk operations |

**Credit Packs:**
| Pack | Price | Credits |
|------|-------|---------|
| Starter | $4.99 | 10 credits |
| Value | $9.99 | 25 credits |
| Pro | $19.99 | 60 credits |

**Database Schema:**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing'
  tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'premium', 'pro'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_payment_intent_id TEXT NOT NULL,
  credits_purchased INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL, -- in cents
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Implementation Tasks:**
1. Set up Stripe account and API keys
2. Create products and prices in Stripe Dashboard
3. Install `@stripe/stripe-js` and `stripe` packages
4. Create subscription checkout API endpoint
5. Create credit pack checkout API endpoint
6. Implement Stripe webhook handler
7. Create Customer Portal redirect endpoint
8. Build subscription management UI
9. Build credit pack purchase UI
10. Add subscription status to user context

**Files to Create:**
- `/src/lib/stripe.ts` - Stripe client configuration
- `/src/app/api/stripe/checkout/route.ts` - Checkout session creation
- `/src/app/api/stripe/webhook/route.ts` - Webhook handler
- `/src/app/api/stripe/portal/route.ts` - Customer portal redirect
- `/src/app/(authenticated)/settings/subscription/page.tsx` - Subscription management
- `/src/app/(authenticated)/settings/credits/page.tsx` - Credit purchase page
- `/src/components/billing/SubscriptionCard.tsx`
- `/src/components/billing/CreditPackCard.tsx`
- `/src/components/billing/PricingTable.tsx`

---

#### 14. Basic Store System ❌ NOT STARTED
**Status:** ❌ 0% Complete
**Priority:** 🔴 Critical
**Estimated Effort:** 1.5-2 weeks

**What's Missing:**
- ❌ Store page with product listings
- ❌ Product detail pages
- ❌ Shopping cart (client-side state)
- ❌ Checkout flow with Stripe
- ❌ Inventory management
- ❌ Order creation and tracking
- ❌ Order confirmation emails
- ❌ Admin order management

**Database Schema:**
```sql
CREATE TABLE store_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pokemon_product_id INTEGER REFERENCES pokemon_products(id),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- in cents
  compare_at_price INTEGER, -- for showing discounts
  inventory_count INTEGER NOT NULL DEFAULT 0,
  max_per_customer INTEGER DEFAULT 1, -- anti-scalper
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'delivered', 'canceled'
  subtotal INTEGER NOT NULL,
  shipping INTEGER NOT NULL DEFAULT 0,
  tax INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  shipping_address JSONB,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  store_product_id UUID REFERENCES store_products(id),
  quantity INTEGER NOT NULL,
  price_at_purchase INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_purchase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  store_product_id UUID REFERENCES store_products(id) NOT NULL,
  quantity_purchased INTEGER NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, store_product_id) -- for tracking limits
);
```

**Implementation Tasks:**
1. Create database tables and RLS policies
2. Build store listing page with filters
3. Create product detail page
4. Implement shopping cart with React context
5. Build checkout flow
6. Create order confirmation page
7. Build order history page for users
8. Create admin order management (basic)
9. Implement inventory decrement on purchase
10. Add purchase limit enforcement

**Files to Create:**
- `/src/app/(authenticated)/store/page.tsx` - Store listing
- `/src/app/(authenticated)/store/[productId]/page.tsx` - Product detail
- `/src/app/(authenticated)/store/cart/page.tsx` - Shopping cart
- `/src/app/(authenticated)/store/checkout/page.tsx` - Checkout
- `/src/app/(authenticated)/store/orders/page.tsx` - Order history
- `/src/app/api/store/checkout/route.ts` - Store checkout API
- `/src/contexts/CartContext.tsx` - Shopping cart state
- `/src/components/store/ProductCard.tsx`
- `/src/components/store/CartItem.tsx`
- `/src/components/store/CheckoutForm.tsx`
- `/src/lib/store-server.ts` - Store data fetching

---

#### 15. Anti-Scalper Systems ❌ NOT STARTED
**Status:** ❌ 0% Complete
**Priority:** 🔴 Critical
**Estimated Effort:** 1 week

**What's Missing:**

**Easter Egg Hunt System:**
- ❌ Hidden product placement logic
- ❌ Random page selection for hiding products
- ❌ "Found it!" interaction and claim flow
- ❌ Limited quantity per hunt
- ❌ Hunt scheduling system
- ❌ Hunt history tracking

**Lucky User System (Random Offer on Login):**
- ❌ Random selection algorithm (weighted by activity?)
- ❌ Offer modal on dashboard load
- ❌ Time-limited offers (e.g., 15 minutes to claim)
- ❌ Offer tracking and redemption
- ❌ One offer per user per day/week

**Database Schema:**
```sql
CREATE TABLE easter_egg_hunts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_product_id UUID REFERENCES store_products(id),
  page_path TEXT NOT NULL, -- e.g., '/browse/pokemon/sv08'
  position_hint TEXT, -- CSS selector or description
  quantity_available INTEGER NOT NULL,
  quantity_claimed INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE easter_egg_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_id UUID REFERENCES easter_egg_hunts(id),
  user_id UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hunt_id, user_id) -- one claim per user per hunt
);

CREATE TABLE lucky_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  store_product_id UUID REFERENCES store_products(id),
  discount_percent INTEGER, -- e.g., 20 for 20% off
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Implementation Tasks:**
1. Create database tables and RLS policies
2. Build Easter Egg component (hidden, revealable)
3. Create hunt management admin UI
4. Implement lucky offer selection algorithm
5. Build offer modal component
6. Create offer redemption flow
7. Add bot detection (honeypot fields, timing analysis)
8. Implement CAPTCHA for purchases (hCaptcha or Turnstile)

**Files to Create:**
- `/src/components/store/EasterEgg.tsx` - Hidden product component
- `/src/components/store/LuckyOfferModal.tsx` - Random offer modal
- `/src/app/api/store/easter-egg/claim/route.ts` - Claim API
- `/src/app/api/store/lucky-offer/route.ts` - Get/redeem offer API
- `/src/lib/anti-scalper-service.ts` - Selection algorithms

---

#### 16. Testing Infrastructure ❌ NOT STARTED
**Status:** ❌ 0% Complete
**Priority:** 🔴 Critical
**Estimated Effort:** 1 week

**What's Missing:**

**Unit Tests:**
- ❌ Price calculation utilities
- ❌ Variant parsing utilities
- ❌ Credit system functions
- ❌ ROI calculations
- ❌ Data transformation functions

**Integration Tests:**
- ❌ API route tests (collection CRUD)
- ❌ API route tests (grading endpoints)
- ❌ API route tests (payment webhooks)
- ❌ Database query tests

**E2E Tests:**
- ❌ User signup/login flow
- ❌ Add card to collection flow
- ❌ AI grading flow
- ❌ Store purchase flow
- ❌ Subscription flow

**Pipeline Tests:**
- ❌ Data sync script validation
- ❌ Price update verification
- ❌ Snapshot function testing

**Testing Stack:**
- Vitest (already configured)
- React Testing Library
- Playwright for E2E
- MSW for API mocking

**Implementation Tasks:**
1. Set up test database/mocking strategy
2. Write unit tests for utility functions
3. Write integration tests for API routes
4. Set up Playwright for E2E tests
5. Write E2E tests for critical flows
6. Create pipeline test scripts
7. Add test commands to CI/CD
8. Set up coverage reporting

**Files to Create:**
- `/src/utils/__tests__/*.test.ts` - Utility tests
- `/src/app/api/**/__tests__/*.test.ts` - API tests
- `/e2e/*.spec.ts` - Playwright E2E tests
- `/scripts/__tests__/*.test.py` - Pipeline tests
- `/playwright.config.ts` - Playwright configuration

---

#### 17. Legal & Business Requirements ❌ NOT STARTED
**Status:** ❌ 0% Complete
**Priority:** 🔴 Critical
**Estimated Effort:** Varies (external dependencies)

**Business Licenses:**
- ❌ Business license (LLC or similar)
- ❌ Reseller license for Pokemon products
- ❌ Sales tax registration (if applicable)

**Legal Documents:**
- ❌ Terms of Service
- ❌ Privacy Policy
- ❌ Cookie Policy
- ❌ Refund Policy
- ❌ Shipping Policy

**Implementation Tasks:**
1. Register business entity
2. Apply for reseller license
3. Draft Terms of Service (use template + lawyer review)
4. Draft Privacy Policy (GDPR/CCPA compliant)
5. Create legal pages in app
6. Add consent checkboxes where required
7. Implement cookie consent banner

**Files to Create:**
- `/src/app/legal/terms/page.tsx`
- `/src/app/legal/privacy/page.tsx`
- `/src/app/legal/cookies/page.tsx`
- `/src/app/legal/refunds/page.tsx`
- `/src/components/legal/CookieConsent.tsx`

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

### ✅ Recently Implemented Tables

#### portfolio_snapshots ✅ IMPLEMENTED (January 14, 2026)
**Purpose:** Track user portfolio value over time for historical charts
**Schema:**
```sql
CREATE TABLE portfolio_snapshots (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  total_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  card_count INTEGER NOT NULL DEFAULT 0,
  product_value NUMERIC(12, 2) NOT NULL DEFAULT 0,  -- Future: sealed products
  product_count INTEGER NOT NULL DEFAULT 0,          -- Future: sealed products
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_date UNIQUE (user_id, recorded_at)
);

CREATE INDEX idx_portfolio_snapshots_user_date ON portfolio_snapshots(user_id, recorded_at DESC);
-- RLS: Users can only view their own snapshots
```

**Associated Functions:**
- `snapshot_all_portfolios()` - Efficient bulk INSERT run by pg_cron daily at midnight UTC

---

### ❌ Missing Tables

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

🟡 **Phase 3: Core Navigation & Dashboard** (70%)
- ✅ Sidebar navigation (Dashboard, Collection, Add Card)
- ✅ Mobile hamburger menu
- ✅ Credits display in navigation
- ⚠️ Dashboard shows placeholders ("Coming Soon")
- ✅ Explore page implemented (was "Discover") - needs polish (see Tier 3, Item 11)
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
- Create portfolio_snapshots database table
- Build portfolio-service.ts for portfolio calculations
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

### Week 12: Gamma/Preprod Pipeline ✅ COMPLETED
**Goal:** Safe production deployment
**Completed:** January 31, 2026
- ✅ Set up gamma Supabase project (cloned from production)
- ✅ Configured Vercel Preview deployments with gamma env vars
- ✅ Established migration workflow (gamma → test → production)
- ✅ Documented workflow in CLAUDE.md and MIGRATION_LOG.md

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
| Historical Pricing | ✅ 100% | 🔴 Critical | ~~2-3 days~~ Done | ~~DB/cron~~ ✅ |
| Grading (Ximilar) | ✅ 100% | 🔴 Critical | ~~2 weeks~~ Done | ~~Ximilar API~~ ✅ |
| Card Identification | ✅ 100% | 🔴 Critical | ~~1.5 weeks~~ Done | ~~Ximilar API~~ ✅ |
| Pre-grading Recs | ✅ 100% | 🟠 High | ~~3-5 days~~ Done | ~~Price data~~ ✅ |
| AI Collection Advisor | ❌ 0% | 🟠 High (Premium) | 2-3 weeks | ~~Grading~~✅, ~~Historical Pricing~~✅, Claude API |
| Username/Sharing | ❌ 0% | 🟠 High | 1.5 weeks | None |
| Dashboard Completion | ✅ 90% | 🟠 High | ~~1-2 days~~ Done | ~~Collection data~~ ✅ |
| Card Detail Polish | 🟡 95% | 🟡 Medium | 1-2 days | ~~Historical pricing~~ ✅ |
| Gamma Pipeline | ✅ 100% | 🔴 Critical* | ~~3-5 days~~ Done | None |
| App Polish | 🔄 Ongoing | 🟡 Medium | Ongoing | None |
| **Explore/Browse Polish** | 🟡 90% | 🟡 Medium | 2-3 days | None |
| **Product Collection** | ✅ 100% | 🟠 High | ~~1 week~~ Done | ~~Product prices~~ ✅ |
| **Price Migration** | ✅ 100% | 🔴 Critical | ~~1 week~~ Done | None |
| **Observability (PostHog + Sentry)** | ✅ 100% | 🔴 Critical* | ~~2-3 days~~ Done | None |
| **Payment System (Stripe)** | ❌ 0% | 🔴 Critical* | 1-2 weeks | None |
| **Basic Store** | ❌ 0% | 🔴 Critical* | 1.5-2 weeks | Stripe |
| **Anti-Scalper Systems** | ❌ 0% | 🔴 Critical* | 1 week | Store |
| **Testing Infrastructure** | ❌ 0% | 🔴 Critical* | 1 week | None |
| **Legal & Business** | ❌ 0% | 🔴 Critical* | Varies | External |

*Critical before production launch, not for development

---

## 🏁 Launch Readiness Checklist

### Before Beta Launch

#### ✅ Completed Features
- [x] Historical pricing database (Tier 1, Item 1) ✅ January 14, 2026 (pg_cron + snapshots)
- [x] Historical pricing frontend (Tier 1, Item 1) ✅ January 17, 2026 (Portfolio chart + KPIs)
- [x] Grading implemented (Tier 1, Item 2) ✅ January 10, 2026
- [x] Card identification implemented (Tier 1, Item 3) ✅ December 21, 2025
- [x] Pre-grading recommendations (Tier 1, Item 4) ✅ January 10, 2026
- [x] Dashboard with real data (Tier 2, Item 6) ✅ January 17, 2026 - 90% complete
- [x] Price migration to pokemon_card_prices table ✅ January 16, 2026
- [x] Product collection feature ✅ January 18, 2026
- [x] Sealed product pricing ✅ January 15, 2026

#### 🔴 Critical Pre-Launch (Must Have)

**Analytics & Monitoring:** ✅ COMPLETE
- [x] PostHog integration for analytics and A/B testing ✅ February 8, 2026
- [x] Error tracking and monitoring setup (Sentry) ✅ February 8, 2026
- [x] User behavior analytics (PostHog events + Sentry metrics) ✅ February 8, 2026
- [ ] Revenue/conversion tracking dashboards (pending Stripe)

**Payment Systems:**
- [ ] Stripe integration for subscriptions
- [ ] Credit pack purchase system (for grading credits)
- [ ] Subscription tiers implementation (Free, Premium, etc.)
- [ ] Payment webhook handling
- [ ] Receipt/invoice generation

**Store System:**
- [ ] Basic product store page
- [ ] Product inventory management
- [ ] Shopping cart functionality
- [ ] Checkout flow with Stripe
- [ ] Order management system
- [ ] Shipping address collection and validation
- [ ] Order confirmation emails
- [ ] Inventory low-stock alerts

**Anti-Scalper Measures:**
- [ ] Easter Egg Hunt system (hidden products on pages)
- [ ] Random product offer on login (lucky user system)
- [ ] Purchase limits per user
- [ ] Bot detection/CAPTCHA for purchases

**Testing & Quality:**
- [ ] Unit tests for critical functions
- [ ] Integration tests for API routes
- [ ] E2E tests for critical user flows
- [ ] Pipeline/data sync tests
- [ ] Comprehensive QA pass

**Infrastructure:**
- [x] Preprod/Gamma pipeline (Tier 3, Item 9) ✅
- [ ] CI/CD pipeline with test gates

**Legal & Business:**
- [ ] Business license obtained
- [ ] Reseller license for Pokemon products
- [ ] Terms of service
- [ ] Privacy policy

**Security & Code Quality:**
- [ ] Manual code review (security-focused) - Owner review
- [ ] Dependency audit (`npm audit`, check for vulnerabilities)
- [ ] Environment variables audit (no secrets in code/repo)
- [ ] RLS policy review (all tables protected)
- [ ] API rate limiting on all public endpoints
- [ ] Input validation/sanitization audit
- [ ] OWASP Top 10 vulnerability check
- [ ] Supabase security advisors - resolve all warnings
- [ ] Supabase performance advisors - resolve all warnings

**Infrastructure & Operations:**
- [ ] Production database backups configured (Supabase PITR)
- [ ] Database connection pooling verified
- [ ] CDN/image optimization configured
- [ ] Uptime monitoring setup (BetterStack, Pingdom, or similar)
- [ ] Error alerting configured (Sentry or PostHog)
- [ ] Log retention strategy defined
- [ ] Cron job monitoring (ensure daily pipeline runs successfully)
- [ ] Disk space monitoring on droplet (for pipeline scripts)
- [ ] Database size monitoring (approaching limits?)

**User Experience & Support:**
- [ ] Loading states on all async operations
- [ ] Error messages are user-friendly (no raw errors exposed)
- [ ] Empty states for all lists/collections
- [ ] 404 and error pages styled
- [ ] Support email configured and tested
- [ ] Feedback mechanism in-app
- [ ] Onboarding flow for new users (tooltips, welcome modal, etc.)
- [ ] Help/FAQ page
- [ ] Contact form or support ticket system

**SEO & Marketing:**
- [x] Meta tags on all public pages ✅
- [x] Open Graph images for social sharing ✅
- [ ] Sitemap.xml generated
- [ ] robots.txt configured
- [x] Landing page ready (waitlist mode with email capture) ✅

**Launch Operations:**
- [x] Waitlist email collection system ✅ (Resend integration)
- [ ] Beta user invite list prepared
- [ ] Launch announcement draft ready
- [ ] Social media accounts created (Twitter/X, Instagram, TikTok)
- [x] Domain DNS configured and verified ✅ (slabadvisor.com)
- [x] SSL certificate active and verified ✅ (Vercel auto-provision)
- [x] Transactional emails tested (waitlist welcome email) ✅
- [ ] Rollback plan documented (if launch goes wrong)
- [ ] On-call schedule for launch week
- [ ] Customer support response templates ready
- [ ] Known issues/limitations documented

**Data & Content:**
- [ ] All Pokemon sets synced and verified
- [ ] Price data is current (pipeline running successfully)
- [ ] Product images loading correctly
- [ ] No broken links or missing assets
- [ ] Test accounts cleaned up from production

**Compliance & Trust:**
- [ ] GDPR compliance (EU users) - data deletion capability
- [ ] CCPA compliance (CA users) - data export capability
- [ ] Age verification or terms acceptance (if selling products)
- [ ] PCI compliance handled by Stripe (no card data stored)
- [ ] Trust badges/security seals on checkout

**Account & Authentication:**
- [ ] Password reset flow tested end-to-end
- [ ] Email verification flow working
- [ ] Account deletion flow (GDPR "right to be forgotten")
- [ ] Session timeout/refresh handling
- [ ] OAuth providers tested (Google, Apple, etc. if enabled)
- [ ] Login rate limiting (prevent brute force)

**Mobile & Cross-Browser:**
- [ ] Tested on iOS Safari
- [x] Tested on Android Chrome ✅ (waitlist page mobile fix)
- [ ] Tested on desktop Chrome, Firefox, Safari, Edge
- [ ] Camera functionality works on all target devices
- [ ] Touch interactions work properly (no hover-only features)

**Performance & Scalability:**
- [ ] Lighthouse score acceptable (Performance, A11y, Best Practices, SEO)
- [ ] Core Web Vitals passing (LCP, FID, CLS)
- [ ] Large collection performance tested (100+ cards)
- [ ] Image lazy loading working
- [ ] API response times acceptable (<500ms for critical paths)

**Ximilar & External APIs:**
- [ ] Ximilar API key rotated/secured for production
- [ ] Ximilar rate limits understood and handled
- [ ] Ximilar error handling graceful (API down scenarios)
- [ ] Fallback behavior when external APIs fail
- [ ] TCGPlayer/price API fallback handling

**Credit System:**
- [ ] Credit deduction working correctly
- [ ] Credit refund on failed operations working
- [ ] Free credits granted on signup
- [ ] Credit balance displayed correctly everywhere
- [ ] Negative credit balance prevented

**Notifications & Communication:**
- [ ] Email provider configured (Resend, SendGrid, etc.)
- [ ] Email templates branded and tested
- [ ] Unsubscribe links in marketing emails (if applicable)
- [ ] In-app toast notifications working

**Edge Cases & Error Recovery:**
- [ ] Graceful handling if user loses internet mid-operation
- [ ] Payment failure mid-checkout handled
- [ ] Image upload failure handled gracefully
- [ ] Duplicate submission prevention (double-click protection)
- [ ] Concurrent edit handling (two tabs same user)
- [ ] Browser back button doesn't break app state

**Financial & Tax:**
- [ ] Tax calculation for store purchases (if applicable)
- [ ] Stripe tax reporting configured
- [ ] Refund process documented and tested
- [ ] Accounting/bookkeeping system ready

**Business & Legal (Investigate):**
- [ ] Business liability insurance (selling physical products)
- [ ] Trademark "Slab Advisor" name (if not already)
- [ ] Pokemon Company IP compliance (no official logos, fan content guidelines)
- [ ] TCGPlayer affiliate/partnership terms (if displaying their data)
- [ ] Ximilar terms of service compliance (usage restrictions)
- [ ] Copyright for original content (site design, images, copy)

#### 🟡 Important Pre-Launch (Should Have)
- [ ] Username system (Tier 2, Item 5)
- [ ] Mobile responsive polish (Tier 3, Item 9)
- [ ] Error handling comprehensive (Tier 3, Item 9)
- [ ] Performance optimized (Tier 3, Item 9)

### Before Public Launch
- [ ] Shareable collections (Tier 2, Item 5)
- [ ] Social features (profiles, follows)
- [ ] Search and filtering (Tier 3, Item 9)
- [ ] Bulk operations (Tier 3, Item 9)
- [ ] Accessibility audit complete (Tier 3, Item 9)
- [ ] PWA features (Tier 3, Item 9)
- [ ] User documentation
- [ ] Support system

---

## 🚀 Post-Launch Features

Features to implement after initial launch to drive engagement and retention.

#### 12. Gamification System with Badges ❌ NOT STARTED
**Status:** ❌ 0% Complete
**Priority:** 🟢 Low (Post-Launch)
**Estimated Effort:** 1-2 weeks

**What's Done:**
- Nothing yet

**What's Missing:**
- ❌ Badge system database schema (`badges`, `user_badges` tables)
- ❌ Badge definitions and artwork
- ❌ Achievement tracking service
- ❌ Badge unlock notifications/toasts
- ❌ User profile badge display
- ❌ Badge progress indicators

**Badge Categories:**
1. **Collection Milestones**
   - First Card Added
   - 10 Cards Collected
   - 50 Cards Collected
   - 100 Cards Collected
   - Complete a Set

2. **Set Completion**
   - Set Starter (own 10% of a set)
   - Set Enthusiast (own 50% of a set)
   - Set Master (own 100% of a set)

3. **Value Milestones**
   - $100 Portfolio Value
   - $500 Portfolio Value
   - $1,000 Portfolio Value

4. **Activity Badges**
   - Weekly Collector (add cards 7 days in a row)
   - Card Analyzer (use AI identification 10 times)
   - Grade Hunter (grade 5 cards)

**Implementation Tasks:**
1. Create database migrations for badges tables
2. Define badge criteria and artwork requirements
3. Create `src/lib/badge-service.ts` for achievement tracking
4. Build badge unlock logic triggered on collection updates
5. Create badge notification component
6. Add badge display to user profile/dashboard
7. Implement badge progress tracking UI

**Files to Create:**
- `/src/lib/badge-service.ts`
- `/src/types/badges.ts`
- `/src/components/badges/BadgeDisplay.tsx`
- `/src/components/badges/BadgeUnlockToast.tsx`
- `/src/components/badges/BadgeProgress.tsx`
- `/src/app/api/badges/route.ts`

**Dependencies:**
- Collection system (already implemented)
- User authentication (already implemented)

---

## 🚀 Future Feature Roadmap & Dashboard Expansion

This section outlines the next wave of features to transform the dashboard into a comprehensive collector's command center.

### Phase 1: The "Fintech" Layer (Money & Value)

#### Portfolio Value Graph (Hero Component) ✅ COMPLETED
**Status:** ✅ 100% Complete
**Priority:** 🔴 Critical
**Completed:** January 17, 2026

**Description:**
A beautiful, interactive portfolio value chart that shows the user's collection value over time. This is the "hero" component that makes users feel like they're managing real investments.

**Location:** Dashboard Top (Main Hero Section)

**What Was Implemented:**
- ✅ `Recharts` AreaChart with gradient fill
- ✅ Time-series data with selectable ranges (7D, 30D, 90D, 1Y)
- ✅ Hover-to-reveal exact value at point with custom tooltip
- ✅ Percentage growth indicator
- ✅ Smooth animations on load
- ✅ `portfolio_snapshots` table with RLS policies
- ✅ `snapshot_all_portfolios()` function with efficient bulk UPSERT
- ✅ pg_cron job scheduled (midnight UTC daily)
- ✅ Sealed products now included in portfolio calculations
- ✅ UTC to local timezone conversion for chart display
- ✅ Live KPIs showing card count, product count, total value

**Files Created:**
- ✅ `/src/components/dashboard/PortfolioHistoryChart.tsx`
- ✅ `/src/lib/portfolio-server.ts`

**Files Modified:**
- ✅ `/src/app/(authenticated)/dashboard/page.tsx` - Added chart component
- ✅ `/src/lib/collection-server.ts` - Updated getDashboardStats

---

#### "Top 3 Gems" Leaderboard ✅ COMPLETE
**Status:** ✅ 100% Complete
**Priority:** 🟠 High
**Completed:** 2026-02-14

**Description:**
Displays the user's 3 most valuable cards with a trophy-case style layout in a bento-box dashboard grid, making them feel special about their collection highlights.

**Location:** Dashboard Main Grid — left side (2/3 width), paired side-by-side with Top Opportunities widget (1/3 width)

**Design (Implemented):**
- Gold/Silver/Bronze gradient backgrounds and border accents for 1st/2nd/3rd rank
- Rank badge (numbered circle) on each card
- Card thumbnail (aspect-[2.5/3.5]) + name + set + current value
- Compact currency formatting ($1.2K for large values)
- Responsive: 3-column grid on desktop, stacks on mobile
- Placeholder slots with "Add Card" CTA when user has fewer than 3 cards
- Widget hidden entirely when user has no cards with price data
- Click navigates to card details page

**Technical Implementation:**
- Server-side data fetching with `getAuthenticatedSupabaseClient()` and RLS protection
- Joins collection_cards → pokemon_cards → pokemon_sets → pokemon_card_prices
- Price calculation priority: exact variant/condition price → current_market_price → market average
- All database access server-side only; client components are display-only
- Uses WidgetSection wrapper for consistent bento-box styling

**Files Created:**
- `/src/types/top-gem.ts` — TypeScript interfaces (TopGem, TopGemsResponse)
- `/src/lib/top-gems-server.ts` — Server-side data fetching and price calculation
- `/src/components/dashboard/top-gems/styles.ts` — Gold/silver/bronze rank styling constants
- `/src/components/dashboard/top-gems/TopGemCard.tsx` — Individual gem card (client, display-only)
- `/src/components/dashboard/top-gems/TopGemsList.tsx` — Grid wrapper with placeholders (client)
- `/src/components/dashboard/top-gems/TopGemsWidget.tsx` — Main widget (server component)
- `/src/components/dashboard/top-gems/TopGemsWidgetSkeleton.tsx` — Loading skeleton
- `/src/components/dashboard/top-gems/index.ts` — Re-exports

**Files Modified:**
- `/src/app/(authenticated)/dashboard/page.tsx` — Added bento-box grid layout with TopGemsWidget + GradingOpportunitiesWidget side-by-side

**Decisions Made:**
- No grade badges shown (AI pre-grades in collection_card_gradings are predictions, not actual grades)
- Raw/market pricing only (no PSA pricing until "mark as graded" feature is built)
- No price change indicators — widget focuses purely on current value

---

#### Market Movers (Price Alerts) ❌ NOT STARTED
**Status:** ❌ 0% Complete
**Priority:** 🟡 Medium
**Estimated Effort:** 3-4 days

**Description:**
A "stock ticker" style widget that highlights cards in the user's collection with the biggest price swings in the last 24 hours.

**Location:** Small Ticker or "Stock" Widget

**Features:**
- Show cards with >5% price change
- Green for gains, red for losses
- Percentage and absolute change display
- Tap to view card details

**Technical Requirements:**
- Price comparison: current vs 24h ago
- Requires historical price data per card
- Sorting by absolute % change

**Files to Create:**
- `/src/components/dashboard/MarketMoversWidget.tsx`
- `/src/lib/price-alerts-server.ts`

---

### Phase 2: The "Collector" Layer (Completionism)

#### Interactive Set Completion Widget ❌ NOT STARTED
**Status:** ❌ 0% Complete
**Priority:** 🟠 High
**Estimated Effort:** 1 week

**Description:**
A horizontal carousel showing the user's progress toward completing various card sets, driving engagement and purchases.

**Location:** Dashboard Main Grid

**Design:**
- Horizontal scroll carousel of "Set Cards"
- Circular progress bar (e.g., "134/165 Owned")
- Set logo/art as background
- Gradient overlay for readability

**Interaction:**
- Clicking a set filters the "Explore" view to show *missing* cards from that set

**Technical Requirements:**
- Group collection cards by set
- Count owned vs total cards per set
- Set metadata (logo, total count)

**Files to Create:**
- `/src/components/dashboard/SetCompletionWidget.tsx`
- `/src/components/dashboard/SetCompletionCard.tsx`
- `/src/lib/set-completion-server.ts`

---

#### Digital Binders List ❌ NOT STARTED
**Status:** ❌ 0% Complete
**Priority:** 🟡 Medium
**Estimated Effort:** 1 week

**Description:**
Allow users to organize cards into custom folders/binders (e.g., "My Charizards", "Trade Binder", "PSA Submission Queue").

**Location:** Dashboard Sidebar or Bottom Grid

**Design:**
- "Bookshelf" aesthetic or clean scrollable list
- Binder cover image (first card or custom)
- Card count per binder

**Technical Requirements:**
- New `binders` table (id, user_id, name, cover_image_url, created_at)
- New `binder_cards` junction table (binder_id, collection_card_id)
- CRUD operations for binders

**Database Schema:**
```sql
CREATE TABLE binders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE binder_cards (
  binder_id UUID REFERENCES binders(id) ON DELETE CASCADE,
  collection_card_id UUID REFERENCES collection_cards(id) ON DELETE CASCADE,
  position INTEGER,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (binder_id, collection_card_id)
);
```

**Files to Create:**
- `/src/components/dashboard/BindersWidget.tsx`
- `/src/components/binders/BinderCard.tsx`
- `/src/components/binders/CreateBinderModal.tsx`
- `/src/lib/binders-service.ts`
- `/src/app/api/binders/route.ts`
- `/src/app/(authenticated)/binders/[id]/page.tsx`

---

### Phase 3: The "Gamification" Layer (Engagement)

#### User Badging System ("The Trophy Case") ❌ NOT STARTED
**Status:** ❌ 0% Complete
**Priority:** 🟡 Medium
**Estimated Effort:** 1-2 weeks

**Description:**
A comprehensive achievement system that rewards users for various milestones and activities.

**Location:** Dashboard Header or dedicated Profile Widget

**Badge Examples:**
- "First Scan" - Scanned first card
- "Gem Mint Hunter" - Got a PSA 10 prediction
- "Set Finisher" - Completed a full set
- "Century Club" - 100 cards in collection
- "Early Adopter" - Joined during beta
- "Grading Guru" - Graded 50 cards

**Technical Requirements:**
- `user_badges` table (user_id, badge_id, unlocked_at)
- `badge_definitions` table (id, name, description, icon, criteria_json)
- Background job to check badge eligibility
- Toast notification on unlock

**Progression System:**
- XP points for actions (scan = 10 XP, grade = 25 XP, complete set = 100 XP)
- User levels (Level 1-50+)
- Level-up rewards (future: credits, discounts)

**Files to Create:**
- `/src/components/dashboard/TrophyCaseWidget.tsx`
- `/src/components/badges/BadgeGrid.tsx`
- `/src/components/badges/LevelProgress.tsx`
- `/src/lib/gamification-service.ts`
- `/src/app/api/badges/check/route.ts`

---

#### Daily Streak Counter ❌ NOT STARTED
**Status:** ❌ 0% Complete
**Priority:** 🟢 Low
**Estimated Effort:** 2-3 days

**Description:**
Tracks consecutive days of logging in or performing actions, encouraging daily engagement.

**Location:** Near User Avatar in Header

**Features:**
- Flame icon with streak count
- Animation on streak continuation
- "Streak at risk" warning
- Streak milestones (7 days, 30 days, 100 days)

**Technical Requirements:**
- `user_streaks` table (user_id, current_streak, longest_streak, last_activity_date)
- Middleware to update on login/action
- Reset logic at midnight UTC

**Files to Create:**
- `/src/components/ui/StreakBadge.tsx`
- `/src/lib/streak-service.ts`
- `/src/middleware/streak-tracker.ts`

---

### Phase 4: The "Social" Layer (Community)

#### Social Stats Widget ❌ NOT STARTED
**Status:** ❌ 0% Complete
**Priority:** 🟡 Medium
**Estimated Effort:** 2 weeks

**Description:**
Display social metrics and enable community features.

**Location:** Profile / Dashboard Sidebar

**Metrics:**
- Followers count
- Following count
- Collection visibility toggle (public/private)

**Interaction:**
- Click to view follower/following lists
- Activity feed of what friends are grading/adding

**Technical Requirements:**
- `follows` table already designed (user_id, following_id)
- `activity_feed` table for social actions
- Privacy settings per user

**Database Schema:**
```sql
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  activity_type TEXT NOT NULL, -- 'graded', 'added_card', 'completed_set', 'badge_earned'
  target_id UUID, -- Reference to the object (card, set, badge)
  target_type TEXT, -- 'collection_card', 'set', 'badge'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  visibility TEXT DEFAULT 'followers' -- 'public', 'followers', 'private'
);
```

**Files to Create:**
- `/src/components/dashboard/SocialStatsWidget.tsx`
- `/src/components/social/FollowersList.tsx`
- `/src/components/social/ActivityFeed.tsx`
- `/src/lib/social-service.ts`
- `/src/app/api/social/follow/route.ts`
- `/src/app/api/social/feed/route.ts`
- `/src/app/(authenticated)/profile/[username]/page.tsx`

---

### Dashboard Widget Priority Order

| Priority | Widget | Effort | Dependencies |
|----------|--------|--------|--------------|
| 1 | Portfolio Value Graph | ~~2-3 days~~ ✅ Done | ~~Snapshots~~ ✅ |
| 2 | Top 3 Gems | ~~2-3 days~~ ✅ Done | ~~Price data~~ ✅ |
| 3 | Set Completion | 1 week | Set metadata |
| 4 | Market Movers | 3-4 days | ~~24h price history~~ ✅ |
| 5 | Digital Binders | 1 week | New DB tables |
| 6 | Trophy Case | 1-2 weeks | Badge system |
| 7 | Social Stats | 2 weeks | Follow system |
| 8 | Daily Streak | 2-3 days | Streak tracking |

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
      ├── Supabase (Auth & DB & Price Cache)
      ├── Ximilar (Grading & Recognition)
      ├── TCGCSV (Price Data)
      ├── PokemonPriceTracker (Historical Prices)
      └── Stripe (Payments - future)
```

---

**Last Updated:** January 31, 2026
**Document Version:** 5.0 (Added Critical Pre-Launch: PostHog, Stripe, Store, Anti-Scalper, Testing, Legal)