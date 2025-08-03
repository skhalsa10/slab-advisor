# Pokemon Data Backfill Scripts

This directory contains utility scripts for managing Pokemon TCG data in the Supabase database.

## Setup

1. **Install Python dependencies:**
   ```bash
   cd scripts
   pip install -r requirements.txt
   ```

2. **Ensure environment variables are set:**
   The script reads from `../.env.local` which should contain:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Usage

### Check for missing cards in a specific set

```bash
# Check what cards are missing in the base1 set
python backfill_pokemon_data.py --check-set base1
```

### Check all sets for missing cards

```bash
# Get a comprehensive summary of missing series, sets, and cards
python backfill_pokemon_data.py --check-all
```

### Backfill missing cards for a specific set

```bash
# Actually insert missing cards for a set
python backfill_pokemon_data.py --backfill-set base1

# Preview what would be inserted (dry run)
python backfill_pokemon_data.py --backfill-set base1 --dry-run
```

### Backfill missing series and sets

```bash
# If entire series or sets are missing (without cards)
python backfill_pokemon_data.py --backfill-series-sets
```

### Comprehensive backfill (series, sets, and cards)

```bash
# Backfill everything: missing series, sets, and all cards
python backfill_pokemon_data.py --backfill-all

# Preview what would be backfilled
python backfill_pokemon_data.py --backfill-all --dry-run
```

## Features

- **Safe operation**: Always shows what will be changed before making changes
- **Dry run mode**: Preview changes without actually inserting data
- **Progress tracking**: Shows progress for long operations
- **Error handling**: Continues processing even if individual cards fail
- **Batch processing**: Inserts data in efficient batches
- **Rich output**: Color-coded terminal output for better readability

## How it works

1. **Fetches data from TCGdex API**: Gets the authoritative list of series, sets, and cards
2. **Compares with database**: Identifies what's missing at each level
3. **Fetches detailed data**: Gets full information for missing items
4. **Inserts in batches**: Efficiently adds missing data to Supabase

The `--check-all` command now shows:
- Missing series
- Missing sets
- Missing cards in existing sets
- A comprehensive summary

The `--backfill-all` command will:
1. First backfill any missing series
2. Then backfill any missing sets
3. Finally backfill all missing cards across all sets

## Common issues

### "Set not found in database"
Run `--backfill-series-sets` first to ensure all sets are in the database.

### API rate limiting
The script includes delays and error handling, but if you hit rate limits, wait a few minutes and try again.

### Missing cards after backfill
Some cards might fail to fetch. Run the check command again to see what's still missing.

## Example workflow

```bash
# 1. First, check what's missing
python backfill_pokemon_data.py --check-all

# 2. Pick a set with missing cards
python backfill_pokemon_data.py --check-set sv1

# 3. Do a dry run to see what would be added
python backfill_pokemon_data.py --backfill-set sv1 --dry-run

# 4. Actually backfill the data
python backfill_pokemon_data.py --backfill-set sv1

# 5. Verify it worked
python backfill_pokemon_data.py --check-set sv1
```