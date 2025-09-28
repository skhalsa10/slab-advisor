# Raspberry Pi Cron Job Setup

This document explains how to set up automated cron jobs on a Raspberry Pi to keep your Pokemon TCG database up-to-date.

## Scripts Execution Order

The scripts should be run in this specific order to ensure proper data flow:

### 1. **auto_sync_tcg_data.py** (FIRST - Foundation)
- **Purpose**: Sync all basic Pokemon TCG data from TCGdx API
- **What it does**: Adds new series, sets, and cards to the database
- **Run frequency**: Daily
- **Why first**: All other scripts depend on having current card/set data

**Cron Setup:**
```bash
# Run daily at 2:00 AM
0 2 * * * cd /home/pi/projects/slab-advisor/scripts && ./run_auto_sync.sh >> /var/log/auto_sync_cron.log 2>&1
```

---

## Additional Scripts (To be added)

### 2. **sync_supplemental_sets_data.py** (SECOND - Metadata Enhancement)
- **Purpose**: Enhance sets with supplemental metadata and critical TCGPlayer group IDs
- **What it does**: Maps external APIs, sets tcgplayer_group_id, adds logos/symbols
- **Run frequency**: Daily (after auto_sync_tcg_data.py)
- **Why second**: Provides tcgplayer_group_id needed by subsequent scripts

**Cron Setup:**
```bash
# Run daily at 2:30 AM (30 minutes after auto sync)
30 2 * * * cd /home/pi/projects/slab-advisor/scripts && python3 sync_supplemental_sets_data.py >> /var/log/supplemental_sync_cron.log 2>&1
```

### 3. **sync_card_variants_v2.py** (THIRD - Variant Mapping)
- **Purpose**: Map complex card variants with multiple TCGPlayer products per card
- **What it does**: Handles Poke Ball/Master Ball patterns, special variants, card ID matching
- **Run frequency**: Daily (after supplemental data sync)
- **Why third**: Needs tcgplayer_group_id from Step 2 to fetch products and map variants

**Cron Setup:**
```bash
# Run daily at 3:00 AM (after supplemental sync completes)
0 3 * * * cd /home/pi/projects/slab-advisor/scripts && python3 sync_card_variants_v2.py --all-sets >> /var/log/variants_sync_cron.log 2>&1
```

### 4. **update_pokemon_prices.py** (FOURTH - Price Updates)
- **Purpose**: Update Pokemon card and product prices from TCGCSV API
- **What it does**: Fetches current market prices for all card variants and sealed products
- **Run frequency**: Daily (after all variant mapping is complete)
- **Why fourth**: Needs tcgplayer_group_id and variant mappings from previous steps

**Cron Setup:**
```bash
# Run daily at 4:00 AM (after variant mapping completes)
0 4 * * * cd /home/pi/projects/slab-advisor/scripts && ./update_all_prices.sh >> /var/log/price_update_cron.log 2>&1
```

**Note**: Uses the shell wrapper `update_all_prices.sh` which handles timing and system optimization for the Pi.

---

## Complete Daily Automation Schedule

```bash
# Complete cron schedule for automated Pokemon TCG data pipeline
# Add these lines to crontab with: crontab -e

# 1. Foundation data sync (2:00 AM)
0 2 * * * cd /home/pi/projects/slab-advisor/scripts && ./run_auto_sync.sh >> /var/log/auto_sync_cron.log 2>&1

# 2. Metadata and TCGPlayer group mapping (2:30 AM)
30 2 * * * cd /home/pi/projects/slab-advisor/scripts && python3 sync_supplemental_sets_data.py >> /var/log/supplemental_sync_cron.log 2>&1

# 3. Complex variant mapping (3:00 AM)
0 3 * * * cd /home/pi/projects/slab-advisor/scripts && python3 sync_card_variants_v2.py --all-sets >> /var/log/variants_sync_cron.log 2>&1

# 4. Price updates (4:00 AM)
0 4 * * * cd /home/pi/projects/slab-advisor/scripts && ./update_all_prices.sh >> /var/log/price_update_cron.log 2>&1
```

**Total Runtime**: Approximately 2 hours (2:00 AM - 4:00 AM + price update time)

---

## RECOMMENDED: Sequential Pipeline Automation

For reliability and easier management, use the updated `run_auto_sync.sh` script that runs all steps sequentially:

### **Single Cron Job Approach (RECOMMENDED)**
```bash
# Single cron job runs entire pipeline daily at 2:00 AM
0 2 * * * cd /home/pi/projects/slab-advisor/scripts && ./run_auto_sync.sh >> /var/log/tcg_pipeline.log 2>&1
```

### Script Execution Order in Pipeline

The `run_auto_sync.sh` script automatically runs these scripts in sequence:

1. **STEP 1: Foundation Data Sync**
   - Runs: `python3 auto_sync_tcg_data.py`
   - Purpose: Sync all basic Pokemon TCG data from TCGdx API
   - Output: New series, sets, and cards in database

2. **STEP 2: Supplemental Metadata Sync**
   - Runs: `python3 sync_supplemental_sets_data.py`
   - Purpose: Enhance sets with metadata and critical TCGPlayer group IDs
   - Output: secondary_logo, secondary_symbol, tcgplayer_group_id, tcgplayer_url

3. **STEP 3: Card Variant Mapping**
   - Runs: `python3 sync_card_variants_v2.py --all-sets`
   - Purpose: Map complex card variants with multiple TCGPlayer products
   - Output: tcgplayer_products arrays, variant flags, special pattern mappings

4. **STEP 4: Price Updates**
   - Runs: `python3 update_pokemon_prices.py --all`
   - Purpose: Update market prices for all card variants and products
   - Output: price_data for cards and products, current market values

**Pipeline Benefits:**
- ✅ Each step waits for the previous to complete
- ✅ Proper dependency management
- ✅ Error tracking and reporting
- ✅ Comprehensive timing for each step
- ✅ Single log file to monitor
- ✅ Continues with remaining steps if one fails

---

## Prerequisites

### 1. Raspberry Pi Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3 and pip
sudo apt install python3 python3-pip python3-venv -y

# Install git
sudo apt install git -y
```

### 2. Project Setup
```bash
# Clone the project
cd /home/pi/projects
git clone <your-repo-url> slab-advisor
cd slab-advisor/scripts

# Install Python dependencies
pip3 install -r requirements.txt
```

### 3. Environment Variables
Create `/home/pi/projects/slab-advisor/.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# or
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Required for sync_supplemental_sets_data.py
POKEMONTCG_IO_API_KEY=your_pokemontcg_io_api_key
```

### 4. Make Scripts Executable
```bash
cd /home/pi/projects/slab-advisor/scripts
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

### Monitor Cron Job Logs
```bash
# View auto sync logs
tail -f /var/log/auto_sync_cron.log

# View system cron logs
sudo tail -f /var/log/syslog | grep CRON
```

---

## Important Notes

1. **Script Order Matters**: Always run auto_sync_tcg_data.py first as other scripts depend on current data
2. **Log Management**: Logs are written to `/var/log/` directory with rotation
3. **Error Handling**: Each script returns proper exit codes for cron monitoring
4. **Resource Usage**: Scripts are optimized for Pi's limited resources with batch processing
5. **Network Dependency**: Ensure stable internet connection for API calls

---

## Troubleshooting

### Check Script Permissions
```bash
ls -la /home/pi/projects/slab-advisor/scripts/*.sh
```

### Test Script Manually
```bash
cd /home/pi/projects/slab-advisor/scripts
./run_auto_sync.sh
```

### Check Environment Variables
```bash
cd /home/pi/projects/slab-advisor
python3 -c "from dotenv import load_dotenv; import os; load_dotenv('.env.local'); print('URL:', os.getenv('NEXT_PUBLIC_SUPABASE_URL')[:50] if os.getenv('NEXT_PUBLIC_SUPABASE_URL') else 'MISSING')"
```