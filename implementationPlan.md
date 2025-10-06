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

---

# UI Variant Support Implementation Plan

## Overview
With the completion of variant data synchronization, the UI now needs updates to support variant selection and display across all user-facing components.

## Phase 1: Database Schema Readiness ✅
- `tcgplayer_products` JSON array field added to pokemon_cards table
- `variant_poke_ball` and `variant_master_ball` columns added
- Variant sync script completed and tested
- Price update script enhanced for variant support

## Phase 2: Add Card to Collection Flow Updates

### 2.1 Variant Selection Component
**File**: `/src/components/cards/VariantSelector.tsx`
- Radio button or dropdown for variant selection (base, poke_ball, master_ball)
- Preview card image based on selected variant
- Price display per variant (if available)
- Clear indication of which variants are available for the card

### 2.2 Enhanced Add Card Modal
**File**: `/src/components/cards/AddCardModal.tsx`
- Integrate VariantSelector component
- Update card search to show variant options
- Modify form submission to include selected variant
- Handle variant-specific pricing display

### 2.3 Card Analysis Integration
**File**: `/src/components/cards/CardAnalysis.tsx`
- Detect variant from card image analysis (if possible)
- Pre-select detected variant in selector
- Allow manual variant override

## Phase 3: Collection Display Enhancements

### 3.1 Collection Grid View
**File**: `/src/components/collection/CollectionGrid.tsx`
- Add variant badges/indicators (Base, ⚪ Poke Ball, ⚫ Master Ball)
- Show variant-specific card images
- Filter by variant type in collection view
- Sort by variant options

### 3.2 Collection List View
**File**: `/src/components/collection/CollectionList.tsx`
- Variant column in table view
- Variant-specific pricing display
- Quick variant change dropdown per row
- Batch variant update functionality

### 3.3 Collection Statistics
**File**: `/src/components/collection/CollectionStats.tsx`
- Break down collection by variant types
- Show most valuable variants
- Variant completion tracking per set

## Phase 4: Card Detail Page Updates

### 4.1 Variant Tabs/Selector
**File**: `/src/components/cards/CardDetail.tsx`
- Tabbed interface for different variants
- Large card image per variant
- Variant availability indicators
- Switch between variants seamlessly

### 4.2 Pricing Display per Variant
**File**: `/src/components/cards/PriceDisplay.tsx`
- Price comparison table across variants
- Market trends per variant
- Historical pricing charts per variant
- TCGPlayer product links per variant

### 4.3 Variant-Specific Information
**File**: `/src/components/cards/VariantInfo.tsx`
- Explain variant differences
- Rarity implications
- Collectibility information
- Visual differences between variants

## Phase 5: Browse and Set Page Indicators

### 5.1 Card Browse Grid
**File**: `/src/components/browse/CardGrid.tsx`
- Multi-variant indicator badges
- Hover preview of available variants
- Quick variant selection from grid
- Variant count per card

### 5.2 Set Overview
**File**: `/src/components/sets/SetOverview.tsx`
- Variant completion tracking
- Missing variants highlighting
- Set variant statistics
- Progress bars per variant type

## Phase 6: Search and Filter Enhancements

### 6.1 Search Filters
**File**: `/src/components/search/SearchFilters.tsx`
- Filter by variant type
- "Has variants" checkbox
- Variant-specific price ranges
- Exclude certain variants from results

### 6.2 Search Results
**File**: `/src/components/search/SearchResults.tsx`
- Show all variants in results
- Variant-specific result cards
- Quick add to collection per variant

## Phase 7: User Preferences

### 7.1 Variant Preferences
**File**: `/src/components/user/VariantPreferences.tsx`
- Default variant selection preference
- Hide/show certain variants
- Preferred variant for pricing display
- Notification preferences for variant availability

## Implementation Priority

### High Priority (MVP)
1. **VariantSelector component** - Core functionality for variant selection
2. **Collection display updates** - Show variant information in user collections
3. **Add card flow** - Enable variant selection when adding cards
4. **Card detail variant tabs** - Full variant information display

### Medium Priority
1. **Browse page indicators** - Show variant availability in browse views
2. **Search and filter enhancements** - Filter by variant types
3. **Variant-specific pricing** - Price display per variant

### Low Priority (Future Enhancement)
1. **User preferences** - Customizable variant display options
2. **Advanced analytics** - Variant completion tracking and statistics
3. **Variant comparison tools** - Side-by-side variant comparison

## Technical Considerations

### Data Fetching
- Update all card queries to include `tcgplayer_products`, `variant_poke_ball`, `variant_master_ball`
- Modify collection queries to handle variant filtering
- Update price queries to extract from `tcgplayer_products` array

### State Management
- Add variant selection to card forms state
- Collection state should track variants per card
- User preference state for default variant selections

### Performance
- Lazy load variant-specific images
- Cache variant data to minimize API calls
- Optimize database queries for variant filtering

### Accessibility
- Clear variant labels and descriptions
- Keyboard navigation for variant selectors
- Screen reader support for variant information

## Testing Strategy

### Unit Tests
- Variant selector component behavior
- Price calculation per variant
- Variant filter logic

### Integration Tests
- Add card flow with variant selection
- Collection display with variants
- Search and filter with variant options

### User Testing
- Variant selection user experience
- Collection management with variants
- Understanding of variant differences

## Migration Plan

### Phase 1: Backend Ready ✅
- Database schema updated
- Sync scripts operational
- Price update scripts enhanced

### Phase 2: Core Components (Week 1-2)
- Implement VariantSelector component
- Update AddCardModal for variant support
- Basic collection display enhancements

### Phase 3: Enhanced Features (Week 3-4)
- Card detail variant tabs
- Browse page variant indicators
- Search and filter enhancements

### Phase 4: Polish and Optimization (Week 5)
- Performance optimizations
- User preference settings
- Analytics and reporting

---

## Future Enhancement: Edit Collection Form Variant Support

### Context
The EditCollectionForm currently does not support changing the variant of a card in the collection. This is intentionally left out of the initial pattern variant implementation due to complexity.

### Challenge
When a user wants to change a card's variant, we need to handle the following scenarios:
1. **Simple case**: No other collection entry exists with the target variant
   - Can safely update the variant and variant_pattern fields
2. **Merge case**: Another entry exists with the same card + target variant
   - Need to warn the user they're about to merge quantities
   - Ask if they want to combine the quantities or keep them separate
   - Update quantities and delete the original entry if merging

### Implementation Requirements

#### 1. Fetch Available Variants
- EditCollectionForm needs pokemon_card data to determine available variants
- Type signature would change from `CollectionCard` to `CollectionCardWithPokemon`
- Use `buildAvailableVariants()` to get variant options

#### 2. Add Variant Selector
```tsx
{/* Variant Selection */}
<div>
  <label htmlFor="variant" className="block text-sm font-medium text-grey-700 mb-1">
    Variant
  </label>
  <select
    id="variant"
    value={formData.variant}
    onChange={(e) => handleVariantChange(e.target.value)}
    className="w-full px-3 py-2 border border-grey-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
    disabled={isSubmitting}
  >
    {availableVariants.map((variant) => (
      <option key={variant} value={variant}>
        {getVariantLabel(variant)}
      </option>
    ))}
  </select>
</div>
```

#### 3. Check for Existing Entry
```tsx
const handleVariantChange = async (newVariant: string) => {
  const { variant, variant_pattern } = parseVariantSelection(newVariant)

  // Check if another collection entry exists with this variant
  const response = await fetch(`/api/collection/check-duplicate?` + new URLSearchParams({
    pokemon_card_id: card.pokemon_card_id,
    variant,
    variant_pattern: variant_pattern || ''
  }))

  const { exists, existingCard } = await response.json()

  if (exists) {
    // Show warning modal
    setShowMergeWarning({
      existingCard,
      newVariant: variant,
      newPattern: variant_pattern
    })
  } else {
    // Safe to update
    setFormData(prev => ({ ...prev, variant: newVariant }))
  }
}
```

#### 4. Create API Endpoint for Duplicate Check
**New File**: `/src/app/api/collection/check-duplicate/route.ts`
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pokemon_card_id = searchParams.get('pokemon_card_id')
  const variant = searchParams.get('variant')
  const variant_pattern = searchParams.get('variant_pattern')

  // Query collection_cards for existing entry
  // Return exists: boolean and existingCard data if found
}
```

#### 5. Merge Warning Modal
```tsx
if (showMergeWarning) {
  return (
    <MergeWarningModal
      currentCard={card}
      existingCard={showMergeWarning.existingCard}
      newVariant={showMergeWarning.newVariant}
      onConfirmMerge={handleConfirmMerge}
      onCancel={() => setShowMergeWarning(null)}
    />
  )
}
```

#### 6. Handle Merge Logic
```tsx
const handleConfirmMerge = async () => {
  const { variant, variant_pattern } = parseVariantSelection(showMergeWarning.newVariant)

  // Add quantities from current card to existing card
  await fetch(`/api/collection/cards/${showMergeWarning.existingCard.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      quantity: showMergeWarning.existingCard.quantity + card.quantity
    })
  })

  // Delete current card
  await fetch(`/api/collection/cards/${card.id}`, {
    method: 'DELETE'
  })

  onUpdate(showMergeWarning.existingCard)
  setShowMergeWarning(null)
}
```

### Testing Considerations
1. Test variant change when no duplicate exists (simple path)
2. Test variant change when duplicate exists (merge warning)
3. Test merge confirmation (quantities add correctly)
4. Test merge cancellation (no changes made)
5. Test changing back to original variant (should work)
6. Test pattern variant changes (poke_ball ↔ master_ball ↔ base)

### Priority
**Low Priority** - This is a nice-to-have feature. Users can work around it by:
1. Deleting the incorrect variant card
2. Re-adding the card with the correct variant

### Estimated Effort
- 4-6 hours of development
- 2 hours of testing
- API endpoint creation
- Modal component creation
- State management complexity