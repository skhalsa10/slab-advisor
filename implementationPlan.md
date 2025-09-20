# Pokémon Card Pricing & Portfolio Tracking Implementation Plan

## Architecture Overview
Implementing "Progressive Hydration" strategy with 3 core components:
1. **Daily bulk price ingestion** from free sources (tcgcsv.com)
2. **On-demand cached API calls** for detailed/graded prices
3. **Background portfolio calculations** with historical tracking

## Phase 1: Database Schema Setup
**Create new tables for pricing data:**
- `daily_raw_prices` - Store bulk raw card prices (updated daily)
- `portfolio_snapshots` - Track user portfolio value history
- `price_cache` - Redis-like cache table for API responses (since we don't have Redis yet)

**Update pokemon_cards table:**
- Add `raw_price` column for current market price
- Add `price_last_updated` timestamp column
- These will be updated by daily cron job

## Phase 2: Infrastructure Components

### 2.1 Environment Configuration
- Add API keys for PokemonPriceTracker API
- Add CRON_SECRET for Vercel cron authentication
- Configure tcgcsv.com access (if needed)

### 2.2 Create Pricing Service Module
**`/src/lib/pricing-service.ts`**
- Fetch bulk prices from tcgcsv.com
- Cache management for API calls
- Price lookup functions with fallbacks

### 2.3 Portfolio Calculation Service
**`/src/lib/portfolio-service.ts`**
- Calculate total portfolio value
- Handle graded vs raw card pricing
- Create daily snapshots
- Historical data aggregation

## Phase 3: API Routes Implementation

### 3.1 Cron Job for Daily Price Updates
**`/src/app/api/cron/update-prices/route.ts`**
- Vercel cron endpoint (runs daily at 2 AM)
- Fetches bulk prices from tcgcsv.com
- Updates `daily_raw_prices` table

### 3.2 Portfolio Calculation Endpoint
**`/src/app/api/portfolio/calculate/route.ts`**
- Triggers portfolio recalculation
- Creates snapshot in `portfolio_snapshots`
- Returns current portfolio value

### 3.3 Card Pricing Endpoint
**`/src/app/api/cards/[cardId]/price/route.ts`**
- Returns detailed pricing (raw + graded)
- Implements caching strategy
- Falls back to daily prices if API unavailable

## Phase 4: Frontend Components

### 4.1 Portfolio Dashboard Widget
**`/src/components/portfolio/PortfolioValue.tsx`**
- Display total portfolio value
- Show last update timestamp
- Trigger background refresh on mount

### 4.2 Historical Chart Component
**`/src/components/portfolio/PortfolioChart.tsx`**
- Line chart for 7d/30d/1y views
- Uses portfolio_snapshots data
- Responsive design with loading states

### 4.3 Card Price Display Updates
- Update `CardDetailClient.tsx` to show prices
- Update collection grid/list items to display values
- Add price badges to browse views

## Phase 5: Integration Points

### 5.1 Collection Page Updates
- Show individual card values
- Display portfolio total at top
- Add "Last valued" timestamp

### 5.2 Browse/Set Pages
- Display raw market prices from daily_raw_prices
- No API calls needed (fast & free)

### 5.3 Card Detail Pages
- Show current raw price
- Display graded prices (PSA 10, 9, etc.)
- Historical price chart

## Phase 6: Testing & Optimization

### 6.1 Create Test Suite
- Unit tests for pricing calculations
- Integration tests for API endpoints
- Mock external API responses

### 6.2 Performance Optimizations
- Implement request batching
- Add proper error boundaries
- Set up monitoring for API usage

## Implementation Order & Dependencies

1. **Database migrations** (daily_raw_prices, portfolio_snapshots, price_cache)
2. **Environment setup** (API keys, secrets)
3. **Core services** (pricing-service.ts, portfolio-service.ts)
4. **Cron job** for daily updates
5. **API endpoints** for real-time data
6. **Frontend components** (value display, charts)
7. **Integration** into existing pages
8. **Testing** and optimization

## Configuration Files Needed

### vercel.json (for cron jobs)
```json
{
  "crons": [{
    "path": "/api/cron/update-prices",
    "schedule": "0 2 * * *"
  }]
}
```

## Security Considerations
- API keys stored in environment variables only
- Service role key for database writes
- Row-level security for user data
- Rate limiting on expensive endpoints
- Input validation for all API calls

## Cost Management
- 24-hour cache TTL to minimize API calls
- Bulk operations for daily prices (free)
- Progressive loading (show cached first, update in background)
- Monitor API usage through logging

## Current Focus: Phase 1 - Pokemon Cards Price Updates

### Immediate Tasks:
1. ✅ Save implementation plan to implementationPlan.md
2. Audit pokemon_cards table schema
3. Add `raw_price` and `price_last_updated` columns to pokemon_cards table
4. Create Python script for fetching bulk prices from tcgcsv.com
5. Test script locally with subset of cards
6. Deploy as Vercel cron job for daily updates

### Database Migration for pokemon_cards:
```sql
ALTER TABLE pokemon_cards
ADD COLUMN raw_price NUMERIC(10, 2),
ADD COLUMN price_last_updated TIMESTAMPTZ;
```

This implementation provides accurate card valuations while keeping costs low through intelligent caching and a hybrid data strategy.

---

# Pokemon Card Variant Correction Implementation Plan

## Problem Statement

TCGDex API incorrectly reports variant data for special rarity Pokemon cards, specifically:
- Illustration Rare cards showing `normal: true`, `reverse: true`, `holo: true`
- Special Illustration Rare cards showing `normal: true`, `reverse: true`, `holo: true`

**Reality**: These cards only exist as holofoil variants and cannot have reverse holo or normal variants.

## Root Cause Analysis

### Pokemon TCG Variant Rules
- **Reverse Holo**: Only applies to cards with traditional illustration box layouts
- **Full-Art Cards**: Already have holographic effects across entire card
- **Illustration Rare & Special Illustration Rare**: Are full-art cards, therefore no reverse holo exists

### Current Impact
Database incorrectly stores special rarity cards with `variant_reverse: true` and `variant_normal: true`.

## Solution: Future-Proof Whitelist Approach

### Logic
Instead of blacklisting specific rarities, whitelist rarities that CAN have reverse holo variants:

**Rarities that CAN have reverse holo:**
- `Common`
- `Uncommon`
- `Rare`
- `Rare Holo`

**All other rarities (current and future):**
- Only `variant_holo: true`
- `variant_reverse: false`
- `variant_normal: false`

## Implementation Changes Required

### 1. Supabase Function: `backfill-pokemon-data/index.ts`

**Current code (lines 236-240):**
```typescript
variant_normal: fullCard.variants?.normal || false,
variant_reverse: fullCard.variants?.reverse || false,
variant_holo: fullCard.variants?.holo || false,
variant_first_edition: fullCard.variants?.firstEdition || false,
```

**Proposed fix:**
```typescript
// Add variant correction function
function correctVariants(rarity: string, originalVariants: any) {
  const canHaveReverseHolo = [
    'Common',
    'Uncommon',
    'Rare',
    'Rare Holo'
  ].includes(rarity || '');

  if (!canHaveReverseHolo) {
    // Special rarities: only holo, no normal or reverse
    return {
      normal: false,
      reverse: false,
      holo: true,
      firstEdition: originalVariants?.firstEdition || false
    };
  }

  // Standard rarities: keep original variants
  return {
    normal: originalVariants?.normal || false,
    reverse: originalVariants?.reverse || false,
    holo: originalVariants?.holo || false,
    firstEdition: originalVariants?.firstEdition || false
  };
}

// Apply correction in card mapping
const correctedVariants = correctVariants(fullCard.rarity, fullCard.variants);

const mappedCard = {
  // ... other fields
  variant_normal: correctedVariants.normal,
  variant_reverse: correctedVariants.reverse,
  variant_holo: correctedVariants.holo,
  variant_first_edition: correctedVariants.firstEdition,
  // ... rest of mapping
}
```

### 2. Python Script: `scripts/backfill_pokemon_data.py`

**Current code (lines 313-316):**
```python
'variant_normal': card_details.get('variants', {}).get('normal', False),
'variant_reverse': card_details.get('variants', {}).get('reverse', False),
'variant_holo': card_details.get('variants', {}).get('holo', False),
'variant_first_edition': card_details.get('variants', {}).get('firstEdition', False),
```

**Proposed fix:**
```python
def correct_variants(rarity, original_variants):
    """Correct variant data based on rarity whitelist approach"""
    can_have_reverse_holo = rarity in ['Common', 'Uncommon', 'Rare', 'Rare Holo']

    if not can_have_reverse_holo:
        # Special rarities: only holo, no normal or reverse
        return {
            'normal': False,
            'reverse': False,
            'holo': True,
            'firstEdition': original_variants.get('firstEdition', False)
        }

    # Standard rarities: keep original variants
    return {
        'normal': original_variants.get('normal', False),
        'reverse': original_variants.get('reverse', False),
        'holo': original_variants.get('holo', False),
        'firstEdition': original_variants.get('firstEdition', False)
    }

# Apply correction in card data preparation
corrected_variants = correct_variants(
    card_details.get('rarity'),
    card_details.get('variants', {})
)

card_data = {
    # ... other fields
    'variant_normal': corrected_variants['normal'],
    'variant_reverse': corrected_variants['reverse'],
    'variant_holo': corrected_variants['holo'],
    'variant_first_edition': corrected_variants['firstEdition'],
    # ... rest of card data
}
```

## Benefits of This Approach

1. **Future-Proof**: Automatically handles new special rarities
2. **Simple Maintenance**: Only need to update whitelist if Pokemon introduces new standard rarities
3. **Safe Default**: Unknown rarities default to special treatment (holo only)
4. **Backward Compatible**: Doesn't affect existing correct data for Common/Uncommon/Rare cards

## Testing Strategy

1. **Verify whitelist logic** with known card examples
2. **Test edge cases** with unusual rarity names
3. **Ensure no regression** on standard rarity cards
4. **Validate database consistency** after backfill

## Rollout Plan

1. **Phase 1**: Fix existing database data (backfill)
2. **Phase 2**: Update ingestion scripts with new logic
3. **Phase 3**: Monitor new card ingestion for correctness

## Monitoring

- **Log variant corrections** during ingestion
- **Track counts** of cards affected by correction logic
- **Alert on new rarities** not in whitelist for review