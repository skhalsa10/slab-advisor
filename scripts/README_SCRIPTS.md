# Pokemon TCG Data Scripts Documentation

This document describes the automated scripts used to maintain Pokemon TCG data in the Supabase database.

## Table of Contents
- [update_pokemon_prices.py](#update_pokemon_pricespy)
- [Other Scripts](#other-scripts) *(to be documented)*

---

## update_pokemon_prices.py

### Purpose
Updates Pokemon card and sealed product prices from the TCGCSV API into the database. **Now supports multi-group sets (main set + trainer galleries) using `tcgplayer_groups` JSONB column.** This script assumes product IDs have already been mapped to cards/products by other sync scripts.

### How It Works

#### 1. Fetch Price Data
- Gets prices from TCGCSV API for ALL TCGPlayer groups in a set (supports trainer galleries)
- Combines price data from multiple groups (e.g., group 3118 + 3172 for SWSH11)
- Each price entry contains: product ID, variant type (Normal/Holo/Reverse), and prices (market/low/high)

#### 2. Organize Prices
- Groups all price entries by product ID into a dictionary
- Example: Product 12345 → [Normal price, Holofoil price, Reverse price]

#### 3. Process Cards
For each card in the set:
- Extracts ALL product IDs from the card (both legacy single ID and new array)
- Looks up each product ID in the price dictionary
- Collects ALL price variants for ALL products
- Adds variant pattern (base/poke_ball/master_ball) to each price
- Saves combined prices to card's `price_data` field
- **Removes the processed product IDs from the price dictionary** (frees memory and marks as handled)

#### 4. Process Sealed Products
For each sealed product already in the database:
- Looks up its product ID in the price dictionary
- Updates the product's `price_data` field
- **Removes the processed product ID from the price dictionary**

#### 5. Handle Unknown Products
- Any remaining product IDs that weren't matched to cards or products
- Saves to `unknown_product_ids.json` for investigation
- These might be products without available prices or new products not yet synced

### Key Features

- **Multi-Group Support**: Fetches prices from all TCGPlayer groups (main set + trainer galleries)
- **Trainer Gallery Support**: Now updates TG card prices that were previously missed
- **Deduplication**: Uses sets to avoid duplicate product IDs
- **Multi-variant support**: Handles cards with multiple TCGPlayer products
- **Smart updates**: Skips items updated within 24 hours (unless --force)
- **Batch processing**: Processes entire sets efficiently
- **Error tracking**: Logs unknown products for review

### Usage

```bash
# Update single set
python update_pokemon_prices.py --set sv10

# Update multi-group set (main set + trainer gallery)
python update_pokemon_prices.py --set swsh11 --force

# Update all sets
python update_pokemon_prices.py --all

# Dry run (preview without updating)
python update_pokemon_prices.py --all --dry-run

# Force update (ignore 24-hour skip)
python update_pokemon_prices.py --all --force

# Show statistics
python update_pokemon_prices.py --stats
```

### Important Notes

1. **Product Mapping**: This script does NOT map new products. It only updates prices for products already mapped to cards/products in the database.

2. **Price Structure**: Preserves TCGCSV price data as-is, only adding a `variant_pattern` field for frontend display.

3. **Memory Optimization**: Removes processed products from the price dictionary to free memory during processing.

---

## Other Scripts

### auto_sync_tcg_data.py

#### Purpose
Automated daily sync script that keeps the database current with the latest Pokemon TCG data from TCGdx API. This is the **first script** in the pipeline and handles all basic data synchronization.

#### How It Works

1. **Sync Series**: Adds any new Pokemon series from TCGdx
2. **Sync Sets**: Adds new sets and immediately populates them with all cards
3. **Update Existing Sets**: Checks all existing sets for newly released cards
4. **Variant Correction**: Applies business logic for card variants based on rarity

#### Key Features

- **Fully Automated**: No user input required, perfect for cron jobs
- **Incremental Updates**: Only adds missing data, safe to run repeatedly
- **Batch Processing**: Efficient database operations with batch inserts
- **Error Recovery**: Continues processing even if individual items fail
- **Pi-Optimized**: Minimal output, overwrites log file to save space

#### Usage

```bash
# Manual run
python auto_sync_tcg_data.py

# Via shell wrapper (recommended)
./run_auto_sync.sh
```

#### What It Handles
✅ New Pokemon series
✅ New Pokemon sets
✅ New cards in existing sets
✅ Card variant logic
❌ TCGPlayer product mapping (handled by other scripts)
❌ Price data (handled by price update scripts)

### backfill_pokemon_data.py
*(To be documented)*

### sync_card_variants_v2.py

#### Purpose
Handles complex variant mappings where multiple TCGPlayer products correspond to the same Pokemon card but represent different patterns/treatments (Poke Ball Pattern, Master Ball Pattern, etc.). Also maps sealed products to the `pokemon_products` table. **Now supports multi-group sets using `tcgplayer_groups` JSONB column.**

#### How It Works

1. **Input Processing**: Processes manual actions from `unmapped_cards_input.json` if available
2. **Fetch Products**: Gets all TCGPlayer products from ALL groups in `tcgplayer_groups` (supports trainer galleries)
3. **Separate Products**: Separates card products from sealed products
4. **Sealed Product Handling**: Inserts sealed products into `pokemon_products` table
5. **Group by Card Number**: Groups card products by card number to detect 1:many mappings
6. **Variant Classification**: Auto-classifies products as base, poke_ball, master_ball, or special
7. **Smart Card Matching**: Tries multiple card ID formats to handle API inconsistencies
8. **Name Validation**: Uses fuzzy matching to validate product names against card names
9. **Update Database**: Appends new products to existing `tcgplayer_products` arrays

#### Key Features

- **Multi-Group Support**: Fetches products from all TCGPlayer groups (main set + trainer galleries)
- **Sealed Product Mapping**: Automatically inserts booster boxes, ETBs, etc. into `pokemon_products`
- **Complex Variant Support**: Handles cards with multiple TCGPlayer product variants
- **Smart ID Matching**: Tries multiple formats (`sv08.5-057`, `sv08.5-57`, `bwp-BW004`, etc.)
- **Name Validation**: Prevents incorrect mappings using fuzzy string matching (70% threshold)
- **Product Cleanup**: `--clear-products` flag to fix corrupted mappings
- **Incremental Updates**: Appends to existing products without overwriting
- **Manual Correction Workflow**: Processes actions from input JSON files
- **Unmapped Card Tracking**: Saves unmatched cards for human review

#### Usage

```bash
# Single set with variant cards
python sync_card_variants_v2.py --set sv08.5

# All sets (recommended for automation)
python sync_card_variants_v2.py --all-sets

# Preview changes
python sync_card_variants_v2.py --set sv08.5 --dry-run

# Clear existing products and remap (for fixing corrupted data)
python sync_card_variants_v2.py --set me01 --clear-products

# Test cleanup with dry run
python sync_card_variants_v2.py --set me01 --clear-products --dry-run
```

#### What It Handles
✅ Multiple TCGPlayer products per card (Poke Ball/Master Ball variants)
✅ Multi-group sets (main set + trainer galleries)
✅ Sealed product mapping to `pokemon_products` table
✅ Card ID format inconsistencies between APIs
✅ Special card patterns and classifications
✅ Product name validation to prevent incorrect mappings
✅ Manual correction workflows
✅ Corrupted product cleanup
❌ Basic card data (handled by auto_sync_tcg_data.py)
❌ TCGPlayer group ID mapping (handled by sync_supplemental_sets_data.py)

#### Dependencies
- Uses `tcgplayer_groups` JSONB column (falls back to `tcgplayer_group_id` if needed)
- Should run **after** `sync_supplemental_sets_data.py`

### sync_supplemental_sets_data.py

#### Purpose
Enhances Pokemon sets with supplemental metadata from external APIs and provides critical TCGPlayer group mapping with rich metadata objects for frontend use. This is **Step 2** in the pipeline and enables sophisticated shop buttons and multi-group support.

#### How It Works

1. **Auto-Sync Mapping File**: Automatically adds new sets from database to `pokemon_sets_ids.json`
2. **PokemonTCG.io Integration**: Fetches logos/symbols using fuzzy name matching (80% similarity)
3. **TCGCSV Integration**: Maps TCGPlayer group IDs using smart pattern extraction and fuzzy matching (75% similarity)
4. **Rich Group Objects**: Creates comprehensive metadata objects with full TCGPlayer context
5. **Multi-Group Support**: Handles sets with multiple TCGPlayer groups (main set + trainer galleries)
6. **Database Updates**: Populates both legacy `tcgplayer_group_id` and new `tcgplayer_groups` JSONB columns

#### Multi-Group Support
Handles complex sets like SWSH series that have both main sets and trainer galleries:
- **swsh10**: Astral Radiance + Astral Radiance Trainer Gallery
- **swsh11**: Lost Origin + Lost Origin Trainer Gallery
- **swsh12**: Silver Tempest + Silver Tempest Trainer Gallery
- **swsh9**: Brilliant Stars + Brilliant Stars Trainer Gallery

Each group includes full metadata for frontend shop buttons:
```json
{
  "groupId": 3118,
  "name": "SWSH11: Lost Origin",
  "abbreviation": "SWSH11",
  "isSupplemental": false,
  "publishedOn": "2022-09-09T00:00:00",
  "categoryId": 3
}
```

#### Key Features

- **Self-Maintaining**: Keeps mapping file current with database automatically
- **Rich Metadata Objects**: Full TCGPlayer context for frontend shop buttons
- **Multi-Group Mapping**: Supports sets with multiple product categories
- **Backward Compatibility**: Maintains legacy `tcgplayer_group_id` column
- **Preserves Manual Work**: Maintains existing human mappings while adding new sets
- **Dual API Support**: Handles both PokemonTCG.io and TCGCSV APIs
- **Smart ID Extraction**: Auto-detects patterns like "SV10: Destined Rivals" → "sv10"
- **Graceful Degradation**: Handles missing mappings without errors
- **Incremental Updates**: Only updates missing fields unless --force flag used

#### Usage

```bash
# Normal run (recommended for automation)
python sync_supplemental_sets_data.py

# Preview changes without updating database
python sync_supplemental_sets_data.py --dry-run

# Force update all existing data
python sync_supplemental_sets_data.py --force
```

#### What It Handles
✅ Auto-maintains `pokemon_sets_ids.json` mapping file
✅ PokemonTCG.io metadata (secondary logos, symbols)
✅ **TCGPlayer group ID mapping (CRITICAL for downstream scripts)**
✅ **Rich metadata objects for frontend shop buttons**
✅ **Multi-group support for trainer galleries and supplemental sets**
✅ Shopping URL generation
✅ Fuzzy name matching between APIs
✅ Unmapped data tracking for manual review
✅ Backward compatibility with legacy single group format

#### Dependencies
- Requires `pokemon_sets_ids.json` mapping file (auto-maintained now)
- Requires `POKEMONTCG_IO_API_KEY` environment variable
- Depends on sets existing in database (from auto_sync_tcg_data.py)

#### Critical Output
- **Sets `tcgplayer_group_id`** - Required by sync_card_variants_v2.py and update_pokemon_prices.py (backward compatibility)
- **Populates `tcgplayer_groups`** - Rich JSONB array with full metadata for frontend
- **Maintains mapping file** - Stays current automatically, supports manual intervention
- **Enhanced metadata** - Secondary logos, symbols, shopping URLs

#### Database Schema
Updates two columns for maximum compatibility:
- `tcgplayer_group_id` (integer): First/primary group ID for legacy compatibility
- `tcgplayer_groups` (JSONB): Array of rich group objects with full metadata

#### Error Handling
- Database query errors handled gracefully with proper error logging
- Sets without `ptcgio_id` are skipped for PokemonTCG.io updates (graceful)
- Unmapped sets saved to JSON files for manual review
- Missing API keys cause script to exit with clear error

### update_all_prices.sh
*(To be documented)*

---

## Dependencies

All Python scripts require:
```bash
pip install -r requirements.txt
```

### requirements.txt
This file contains all Python package dependencies needed to run the scripts. It uses flexible version constraints (>=) to ensure compatibility while allowing for faster installations and avoiding version conflicts.

Main dependencies:
- `supabase>=2.0.0` - Database client for connecting to Supabase
- `requests>=2.20.0` - HTTP library for API calls to TCGCSV and other services
- `python-dotenv>=0.19.0` - Loads environment variables from .env.local file
- `rich>=10.0.0` - Rich terminal output formatting (progress bars, colored text, tables)

### Installation
```bash
cd scripts/
pip install -r requirements.txt
```

Note: The flexible version constraints (>=) help avoid dependency conflicts and speed up installation, especially important for Raspberry Pi deployments.