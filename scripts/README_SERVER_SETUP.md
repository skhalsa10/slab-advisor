# Server Cron Job Setup

This document explains how to set up automated cron jobs on a server (DigitalOcean Droplet or Raspberry Pi) to keep your Pokemon TCG database up-to-date.

## Scripts Execution Order

The scripts should be run in this specific order to ensure proper data flow:

### 1. **step1_sync_tcg_data.py** (FIRST - Foundation)
- **Purpose**: Sync all basic Pokemon TCG data from TCGdex API
- **What it does**: Adds new series, sets, and cards to the database
- **Run frequency**: Daily
- **Why first**: All other scripts depend on having current card/set data

---

### 2. **step2_sync_supplemental_sets_data.py** (SECOND - Metadata Enhancement)
- **Purpose**: Enhance sets with supplemental metadata and critical TCGPlayer group IDs
- **What it does**: Maps external APIs, sets tcgplayer_group_id, tcgplayer_set_id, adds logos/symbols
- **Run frequency**: Daily (after step1_sync_tcg_data.py)
- **Why second**: Provides tcgplayer_group_id and tcgplayer_set_id needed by subsequent scripts

---

### 3. **step3_sync_card_variants.py** (THIRD - Variant Mapping)
- **Purpose**: Map complex card variants with multiple TCGPlayer products per card
- **What it does**: Handles Poke Ball/Master Ball patterns, special variants, card ID matching
- **Run frequency**: Daily (after supplemental data sync)
- **Why third**: Needs tcgplayer_group_id from Step 2 to fetch products and map variants
- **Human Review**: Check `unmapped_cards.json` for cards that couldn't be auto-matched

---

### 4. **step4_sync_pokemon_price_tracker.py** (FOURTH - Price Updates)
- **Purpose**: Update Pokemon card and sealed product prices from PokemonPriceTracker API
- **What it does**: Fetches current market prices, PSA graded prices, price history, and calculates grading ROI
- **Run frequency**: Daily (after all variant mapping is complete)
- **Why fourth**: Needs tcgplayer_products mappings from Step 3 to match prices to cards

**Usage:**
```bash
# Sync all cards and products
python3 step4_sync_pokemon_price_tracker.py --both

# Sync specific set
python3 step4_sync_pokemon_price_tracker.py --both-set sv10

# Show statistics
python3 step4_sync_pokemon_price_tracker.py --stats
python3 step4_sync_pokemon_price_tracker.py --products-stats
```

---

### 5. **step5_backfill_product_price_history.py --daily** (FIFTH - Historical Prices)
- **Purpose**: Download daily price snapshots from TCGCSV and store in pokemon_product_price_history
- **What it does**: Downloads yesterday's and today's price archives, extracts Pokemon prices, inserts into history table
- **Run frequency**: Daily (after step 4)
- **Why fifth**: Builds reliable price history from TCGCSV archives (better data quality than PokemonPriceTracker)

**Usage:**
```bash
# Daily update - downloads yesterday + today, processes, cleans up
python3 step5_backfill_product_price_history.py --daily

# Preview without downloading or inserting
python3 step5_backfill_product_price_history.py --daily --dry-run

# Process a specific date only
python3 step5_backfill_product_price_history.py --daily --date 2026-01-18

# Full historical backfill from local tcgCsvPrices/ folder (one-time setup)
python3 step5_backfill_product_price_history.py --backfill
```

**Prerequisites:** Requires 7zip (`brew install p7zip` on macOS, `apt install p7zip-full` on Ubuntu)

---

## RECOMMENDED: Sequential Pipeline Automation

For reliability and easier management, use the `run_auto_sync.sh` script that runs all steps sequentially:

### **Single Cron Job Approach (RECOMMENDED)**
```bash
# Single cron job runs entire pipeline daily at 2:00 AM
0 2 * * * cd /path/to/slab-advisor/scripts && ./run_auto_sync.sh >> /var/log/tcg_pipeline.log 2>&1
```

### Script Execution Order in Pipeline

The `run_auto_sync.sh` script automatically runs these scripts in sequence:

1. **STEP 1: Foundation Data Sync**
   - Runs: `python3 step1_sync_tcg_data.py`
   - Purpose: Sync all basic Pokemon TCG data from TCGdex API
   - Output: New series, sets, and cards in database

2. **STEP 2: Supplemental Metadata Sync**
   - Runs: `python3 step2_sync_supplemental_sets_data.py`
   - Purpose: Enhance sets with metadata and critical TCGPlayer IDs
   - Output: tcgplayer_group_id, tcgplayer_set_id, secondary logos/symbols

3. **STEP 3: Card Variant Mapping**
   - Runs: `python3 step3_sync_card_variants.py --all-sets`
   - Purpose: Map complex card variants with multiple TCGPlayer products
   - Output: tcgplayer_products arrays, variant flags, special pattern mappings

4. **STEP 4: Price Updates**
   - Runs: `python3 step4_sync_pokemon_price_tracker.py --both`
   - Purpose: Update market prices, PSA grades, and price history
   - Output: pokemon_card_prices and pokemon_product_prices tables

5. **STEP 5: Historical Price Snapshots**
   - Runs: `python3 step5_backfill_product_price_history.py --daily`
   - Purpose: Download daily TCGCSV price archives for reliable historical data
   - Output: pokemon_product_price_history table with yesterday + today's prices

**Pipeline Benefits:**
- Each step waits for the previous to complete
- Proper dependency management
- Error tracking and reporting
- Comprehensive timing for each step
- Single log file to monitor
- Continues with remaining steps if one fails

---

## Manual/Ad-hoc Scripts

### **download_tcgcsv_archive.py** (Historical Price Data)
- **Purpose**: Download historical price archives from TCGCSV (2024-02-08 onwards)
- **Run frequency**: Manual/ad-hoc for backfill operations
- **NOT part of daily pipeline**

**Usage:**
```bash
# Check download status
python3 download_tcgcsv_archive.py --status

# Preview what would be downloaded
python3 download_tcgcsv_archive.py --dry-run

# Download all missing dates (can take hours for full backfill)
python3 download_tcgcsv_archive.py
```

**Prerequisites:** Requires 7zip (`brew install p7zip` on macOS, `apt install p7zip-full` on Ubuntu)

---

## Prerequisites

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3 and pip
sudo apt install python3 python3-pip python3-venv -y

# Install git
sudo apt install git -y

# Install 7zip (for download_tcgcsv_archive.py)
sudo apt install p7zip-full -y
```

### 2. Project Setup
```bash
# Clone the project
cd /home/user/projects
git clone <your-repo-url> slab-advisor
cd slab-advisor/scripts

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip3 install -r requirements.txt
```

### 3. Environment Variables
Create `/path/to/slab-advisor/.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Required for sync_supplemental_sets_data.py
POKEMONTCG_IO_API_KEY=your_pokemontcg_io_api_key

# Required for step4_sync_pokemon_price_tracker.py
POKEMON_PRICE_TRACKER_API_KEY=your_ppt_api_key
```

### 4. Make Scripts Executable
```bash
cd /path/to/slab-advisor/scripts
chmod +x *.sh
```

---

## Cron Job Management

### View Current Cron Jobs
```bash
crontab -l
```

### Edit Cron Jobs
```bash
crontab -e
```

### Monitor Logs
```bash
# View pipeline logs
tail -f /var/log/tcg_pipeline.log

# View system cron logs
sudo tail -f /var/log/syslog | grep CRON
```

---

## Important Notes

1. **Script Order Matters**: Always run step1_sync_tcg_data.py first as other scripts depend on current data
2. **Log Management**: Logs are written to `/var/log/` directory
3. **Error Handling**: Each script returns proper exit codes for cron monitoring
4. **Resource Usage**: Scripts are optimized with batch processing
5. **Network Dependency**: Ensure stable internet connection for API calls
6. **Human Review**: After running step3_sync_card_variants.py, check `unmapped_cards.json` for manual review

---

## Troubleshooting

### Check Script Permissions
```bash
ls -la /path/to/slab-advisor/scripts/*.sh
```

### Test Script Manually
```bash
cd /path/to/slab-advisor/scripts
source venv/bin/activate
./run_auto_sync.sh
```

### Check Environment Variables
```bash
cd /path/to/slab-advisor
python3 -c "from dotenv import load_dotenv; import os; load_dotenv('.env.local'); print('URL:', os.getenv('NEXT_PUBLIC_SUPABASE_URL')[:50] if os.getenv('NEXT_PUBLIC_SUPABASE_URL') else 'MISSING')"
```

---

## Deprecated Scripts

The following scripts are **no longer used** and can be ignored:

- ~~`update_pokemon_prices.py`~~ - Replaced by `step4_sync_pokemon_price_tracker.py`
- ~~`update_all_prices.sh`~~ - No longer needed
