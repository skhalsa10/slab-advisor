# Pokemon TCG Data Scripts Documentation

This document describes the automated scripts used to maintain Pokemon TCG data in the Supabase database.

## Table of Contents
- [update_pokemon_prices.py](#update_pokemon_pricespy)
- [Other Scripts](#other-scripts) *(to be documented)*

---

## update_pokemon_prices.py

### Purpose
Updates Pokemon card and sealed product prices from the TCGCSV API into the database. This script assumes product IDs have already been mapped to cards/products by other sync scripts.

### How It Works

#### 1. Fetch Price Data
- Gets prices from TCGCSV API for a TCGPlayer group (set)
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
- These might be new products not yet synced to the database

### Key Features

- **Deduplication**: Uses sets to avoid duplicate product IDs
- **Multi-variant support**: Handles cards with multiple TCGPlayer products
- **Smart updates**: Skips items updated within 24 hours (unless --force)
- **Batch processing**: Processes entire sets efficiently
- **Error tracking**: Logs unknown products for review

### Usage

```bash
# Update single set
python update_pokemon_prices.py --set sv10

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
Handles complex variant mappings where multiple TCGPlayer products correspond to the same Pokemon card but represent different patterns/treatments (Poke Ball Pattern, Master Ball Pattern, etc.). **Requires sets to have `tcgplayer_group_id` set first.**

#### How It Works

1. **Input Processing**: Processes manual actions from `unmapped_cards_input.json` if available
2. **Fetch Products**: Gets all TCGPlayer products for a set using its `tcgplayer_group_id`
3. **Group by Card Number**: Groups products by card number to detect 1:many mappings
4. **Variant Classification**: Auto-classifies products as base, poke_ball, master_ball, or special
5. **Smart Card Matching**: Tries multiple card ID formats to handle API inconsistencies
6. **Update Database**: Appends new products to existing `tcgplayer_products` arrays

#### Key Features

- **Complex Variant Support**: Handles cards with multiple TCGPlayer product variants
- **Smart ID Matching**: Tries multiple formats (`sv08.5-057`, `sv08.5-57`, `bwp-BW004`, etc.)
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
```

#### What It Handles
✅ Multiple TCGPlayer products per card (Poke Ball/Master Ball variants)
✅ Card ID format inconsistencies between APIs
✅ Special card patterns and classifications
✅ Manual correction workflows
❌ Basic card data (handled by auto_sync_tcg_data.py)
❌ TCGPlayer group ID mapping (handled by sync_supplemental_sets_data.py)

#### Dependencies
- Requires `tcgplayer_group_id` to be set on Pokemon sets
- Should run **after** `sync_supplemental_sets_data.py`

### sync_supplemental_sets_data.py

#### Purpose
Enhances Pokemon sets with supplemental metadata from external APIs and provides the critical `tcgplayer_group_id` that downstream scripts depend on. This is **Step 2** in the pipeline.

#### How It Works

1. **Auto-Sync Mapping File**: Automatically adds new sets from database to `pokemon_sets_ids.json`
2. **PokemonTCG.io Integration**: Fetches logos/symbols using fuzzy name matching (80% similarity)
3. **TCGCSV Integration**: Maps TCGPlayer group IDs using smart pattern extraction and fuzzy matching (75% similarity)
4. **Database Updates**: Sets `tcgplayer_group_id`, `tcgplayer_url`, and supplemental metadata fields

#### Key Features

- **Self-Maintaining**: Keeps mapping file current with database automatically
- **Preserves Manual Work**: Maintains existing human mappings while adding new sets
- **Dual API Support**: Handles both PokemonTCG.io and TCGCSV APIs
- **Smart ID Extraction**: Auto-detects patterns like "SV10: Destined Rivals" → "sv10"
- **Graceful Degradation**: Handles missing mappings without errors
- **Incremental Updates**: Only updates missing fields unless --force flag used

#### Usage

```bash
# Normal run (recommended for automation)
python sync_supplemental_sets_data.py

# Force update all existing data
python sync_supplemental_sets_data.py --force
```

#### What It Handles
✅ Auto-maintains `pokemon_sets_ids.json` mapping file
✅ PokemonTCG.io metadata (secondary logos, symbols)
✅ **TCGPlayer group ID mapping (CRITICAL for downstream scripts)**
✅ Shopping URL generation
✅ Fuzzy name matching between APIs
✅ Unmapped data tracking for manual review

#### Dependencies
- Requires `pokemon_sets_ids.json` mapping file (auto-maintained now)
- Requires `POKEMONTCG_IO_API_KEY` environment variable
- Depends on sets existing in database (from auto_sync_tcg_data.py)

#### Critical Output
- **Sets `tcgplayer_group_id`** - Required by sync_card_variants_v2.py and update_pokemon_prices.py
- **Maintains mapping file** - Stays current automatically, supports manual intervention
- **Enhanced metadata** - Secondary logos, symbols, shopping URLs

#### Error Handling
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