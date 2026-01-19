#!/usr/bin/env python3
"""
Step 1: TCGdex Data Sync Script

This script automatically syncs all Pokemon TCG data from TCGdex API to Supabase.
Designed to run daily on a server without user interaction.
Overwrites log file each run to save storage space.

This is the FOUNDATION script - must run before all other sync scripts.

Usage:
    python step1_sync_tcg_data.py

Tables affected:
    - pokemon_series (adds new series)
    - pokemon_sets (adds new sets)
    - pokemon_cards (adds new cards with basic info)
"""

import os
import sys
import requests
import json
from datetime import datetime
from typing import List, Dict, Optional, Set
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv('../.env.local')

# API base URLs
TCGDEX_API_BASE = "https://api.tcgdex.net/v2/en"

# Log file (overwrites each run)
LOG_FILE = "sync_log.txt"

class TCGdexAutoSync:
    def __init__(self):
        """Initialize the sync with Supabase client and logging"""
        # Set up logging
        self.log_file = open(LOG_FILE, 'w')
        self.log(f"TCGdex Auto Sync Started at {datetime.now().isoformat()}")
        self.log("=" * 60)

        # Initialize Supabase
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

        if not supabase_url or not supabase_key:
            self.log("ERROR: Missing Supabase credentials in .env.local")
            sys.exit(1)

        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.log("✓ Connected to Supabase")

        # Initialize counters
        self.stats = {
            'series_added': 0,
            'sets_added': 0,
            'cards_added': 0,
            'cards_checked': 0,
            'errors': 0
        }

    def log(self, message: str):
        """Write to log file and print to console"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_message = f"[{timestamp}] {message}"
        print(log_message)
        self.log_file.write(log_message + "\n")
        self.log_file.flush()

    def correct_variants(self, rarity: str, original_variants: Dict) -> Dict:
        """
        Apply variant correction based on rarity whitelist approach.
        Only Common, Uncommon, Rare, and Rare Holo can have reverse variants.
        All special rarities are holo-only.
        """
        can_have_reverse_holo = rarity in ['Common', 'Uncommon', 'Rare', 'Rare Holo']

        if not can_have_reverse_holo:
            # Special rarities: only holo, no normal or reverse
            return {
                'normal': False,
                'reverse': False,
                'holo': True,
                'firstEdition': original_variants.get('firstEdition', False) if original_variants else False
            }

        # Standard rarities: keep original variants from TCGdex
        if not original_variants:
            return {'normal': False, 'reverse': False, 'holo': False, 'firstEdition': False}

        return {
            'normal': original_variants.get('normal', False),
            'reverse': original_variants.get('reverse', False),
            'holo': original_variants.get('holo', False),
            'firstEdition': original_variants.get('firstEdition', False)
        }

    def fetch_tcgdex_series(self) -> List[Dict]:
        """Fetch all series from TCGdex API"""
        try:
            response = requests.get(f"{TCGDEX_API_BASE}/series")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            self.log(f"ERROR fetching series from TCGdex: {e}")
            self.stats['errors'] += 1
            return []

    def fetch_tcgdex_sets(self) -> List[Dict]:
        """Fetch all sets from TCGdex API"""
        try:
            response = requests.get(f"{TCGDEX_API_BASE}/sets")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            self.log(f"ERROR fetching sets from TCGdex: {e}")
            self.stats['errors'] += 1
            return []

    def fetch_tcgdex_set_details(self, set_id: str) -> Optional[Dict]:
        """Fetch detailed set information including cards"""
        try:
            response = requests.get(f"{TCGDEX_API_BASE}/sets/{set_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            self.log(f"ERROR fetching set {set_id} from TCGdex: {e}")
            self.stats['errors'] += 1
            return None

    def fetch_tcgdex_card_details(self, card_id: str) -> Optional[Dict]:
        """Fetch detailed card information"""
        try:
            response = requests.get(f"{TCGDEX_API_BASE}/cards/{card_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            self.log(f"ERROR fetching card {card_id} from TCGdex: {e}")
            self.stats['errors'] += 1
            return None

    def get_db_series(self) -> Set[str]:
        """Get all series IDs from database"""
        try:
            result = self.supabase.table('pokemon_series').select('id').execute()
            return {row['id'] for row in result.data}
        except Exception as e:
            self.log(f"ERROR fetching series from database: {e}")
            self.stats['errors'] += 1
            return set()

    def get_db_sets(self) -> Set[str]:
        """Get all set IDs from database"""
        try:
            result = self.supabase.table('pokemon_sets').select('id').execute()
            return {row['id'] for row in result.data}
        except Exception as e:
            self.log(f"ERROR fetching sets from database: {e}")
            self.stats['errors'] += 1
            return set()

    def get_db_cards_for_set(self, set_id: str) -> Set[str]:
        """Get all card IDs for a specific set from database"""
        try:
            result = self.supabase.table('pokemon_cards').select('id').eq('set_id', set_id).execute()
            return {row['id'] for row in result.data}
        except Exception as e:
            self.log(f"ERROR fetching cards for set {set_id} from database: {e}")
            self.stats['errors'] += 1
            return set()

    def sync_series(self):
        """Sync all series from TCGdex to database"""
        self.log("\n--- Syncing Series ---")

        # Fetch from TCGdex
        tcgdex_series = self.fetch_tcgdex_series()
        if not tcgdex_series:
            self.log("No series data received from TCGdex")
            return

        self.log(f"Found {len(tcgdex_series)} series in TCGdex")

        # Get existing from database
        db_series = self.get_db_series()
        self.log(f"Found {len(db_series)} series in database")

        # Find missing series
        series_to_add = []
        for serie in tcgdex_series:
            if serie['id'] not in db_series:
                series_to_add.append({
                    'id': serie['id'],
                    'name': serie['name'],
                    'logo': serie.get('logo'),
                    'updated_at': datetime.now().isoformat()
                })

        # Insert missing series
        if series_to_add:
            self.log(f"Adding {len(series_to_add)} new series...")
            try:
                # Insert in batches of 50
                batch_size = 50
                for i in range(0, len(series_to_add), batch_size):
                    batch = series_to_add[i:i + batch_size]
                    result = self.supabase.table('pokemon_series').upsert(batch).execute()
                    self.stats['series_added'] += len(batch)
                self.log(f"✓ Added {self.stats['series_added']} series")
            except Exception as e:
                self.log(f"ERROR inserting series: {e}")
                self.stats['errors'] += 1
        else:
            self.log("No new series to add")

    def add_cards_for_new_set(self, set_id: str, cards: List[Dict]):
        """Add all cards for a newly added set"""
        if not cards:
            return

        cards_to_insert = []

        for card_brief in cards:
            # Fetch full card details
            card_details = self.fetch_tcgdex_card_details(card_brief['id'])
            if not card_details:
                continue

            # Apply variant correction
            corrected_variants = self.correct_variants(
                card_details.get('rarity'),
                card_details.get('variants', {})
            )

            # Prepare card data
            card_data = {
                'id': card_details['id'],
                'set_id': set_id,
                'local_id': str(card_details.get('localId', '')),
                'name': card_details['name'],
                'image': card_details.get('image'),
                'category': card_details.get('category'),
                'illustrator': card_details.get('illustrator'),
                'rarity': card_details.get('rarity'),
                'variant_normal': corrected_variants['normal'],
                'variant_reverse': corrected_variants['reverse'],
                'variant_holo': corrected_variants['holo'],
                'variant_first_edition': corrected_variants['firstEdition'],
                'updated_at': datetime.now().isoformat()
            }
            cards_to_insert.append(card_data)
            self.stats['cards_checked'] += 1

        # Insert cards in batches
        if cards_to_insert:
            try:
                batch_size = 50
                for i in range(0, len(cards_to_insert), batch_size):
                    batch = cards_to_insert[i:i + batch_size]
                    result = self.supabase.table('pokemon_cards').upsert(batch).execute()
                    self.stats['cards_added'] += len(batch)
                self.log(f"  ✓ Added {len(cards_to_insert)} cards for set {set_id}")
            except Exception as e:
                self.log(f"  ERROR inserting cards for set {set_id}: {e}")
                self.stats['errors'] += 1

    def sync_sets(self):
        """Sync all sets from TCGdex to database"""
        self.log("\n--- Syncing Sets ---")

        # Fetch from TCGdex
        tcgdex_sets = self.fetch_tcgdex_sets()
        if not tcgdex_sets:
            self.log("No sets data received from TCGdex")
            return

        self.log(f"Found {len(tcgdex_sets)} sets in TCGdex")

        # Get existing from database
        db_sets = self.get_db_sets()
        self.log(f"Found {len(db_sets)} sets in database")

        # Process missing sets
        new_sets_count = 0
        for set_brief in tcgdex_sets:
            if set_brief['id'] not in db_sets:
                # Fetch full set details
                set_details = self.fetch_tcgdex_set_details(set_brief['id'])
                if not set_details:
                    continue

                # Prepare set data
                set_data = {
                    'id': set_details['id'],
                    'series_id': set_details.get('serie', {}).get('id'),
                    'name': set_details['name'],
                    'logo': set_details.get('logo'),
                    'symbol': set_details.get('symbol'),
                    'card_count_total': set_details.get('cardCount', {}).get('total', 0),
                    'card_count_official': set_details.get('cardCount', {}).get('official', 0),
                    'card_count_holo': set_details.get('cardCount', {}).get('holo', 0),
                    'card_count_reverse': set_details.get('cardCount', {}).get('reverse', 0),
                    'card_count_first_ed': set_details.get('cardCount', {}).get('firstEd', 0),
                    'release_date': set_details.get('releaseDate'),
                    'updated_at': datetime.now().isoformat()
                }

                # Insert set
                try:
                    result = self.supabase.table('pokemon_sets').upsert([set_data]).execute()
                    self.stats['sets_added'] += 1
                    new_sets_count += 1
                    self.log(f"Added set: {set_details['name']} ({set_details['id']})")

                    # Immediately add all cards for this new set
                    self.add_cards_for_new_set(set_details['id'], set_details.get('cards', []))

                except Exception as e:
                    self.log(f"ERROR inserting set {set_details['id']}: {e}")
                    self.stats['errors'] += 1

        if new_sets_count > 0:
            self.log(f"✓ Added {new_sets_count} new sets")
        else:
            self.log("No new sets to add")

    def check_existing_sets_for_missing_cards(self):
        """Check all existing sets for missing cards"""
        self.log("\n--- Checking Existing Sets for Missing Cards ---")

        # Get all sets from database
        db_sets = self.get_db_sets()
        if not db_sets:
            self.log("No sets in database to check")
            return

        self.log(f"Checking {len(db_sets)} sets for missing cards...")

        sets_with_new_cards = 0
        total_new_cards = 0

        for set_id in db_sets:
            # Get set details from TCGdex
            set_details = self.fetch_tcgdex_set_details(set_id)
            if not set_details:
                continue

            # Get existing cards from database
            db_cards = self.get_db_cards_for_set(set_id)

            # Find missing cards
            tcgdex_card_ids = {card['id'] for card in set_details.get('cards', [])}
            missing_card_ids = tcgdex_card_ids - db_cards

            if missing_card_ids:
                sets_with_new_cards += 1
                self.log(f"Set {set_id}: found {len(missing_card_ids)} missing cards")

                cards_to_insert = []
                for card_id in missing_card_ids:
                    # Fetch full card details
                    card_details = self.fetch_tcgdex_card_details(card_id)
                    if not card_details:
                        continue

                    # Apply variant correction
                    corrected_variants = self.correct_variants(
                        card_details.get('rarity'),
                        card_details.get('variants', {})
                    )

                    # Prepare card data
                    card_data = {
                        'id': card_details['id'],
                        'set_id': set_id,
                        'local_id': str(card_details.get('localId', '')),
                        'name': card_details['name'],
                        'image': card_details.get('image'),
                        'category': card_details.get('category'),
                        'illustrator': card_details.get('illustrator'),
                        'rarity': card_details.get('rarity'),
                        'variant_normal': corrected_variants['normal'],
                        'variant_reverse': corrected_variants['reverse'],
                        'variant_holo': corrected_variants['holo'],
                        'variant_first_edition': corrected_variants['firstEdition'],
                        'updated_at': datetime.now().isoformat()
                    }
                    cards_to_insert.append(card_data)
                    self.stats['cards_checked'] += 1

                # Insert missing cards in batches
                if cards_to_insert:
                    try:
                        batch_size = 50
                        for i in range(0, len(cards_to_insert), batch_size):
                            batch = cards_to_insert[i:i + batch_size]
                            result = self.supabase.table('pokemon_cards').upsert(batch).execute()
                            self.stats['cards_added'] += len(batch)
                            total_new_cards += len(batch)
                    except Exception as e:
                        self.log(f"ERROR inserting cards for set {set_id}: {e}")
                        self.stats['errors'] += 1

        if sets_with_new_cards > 0:
            self.log(f"✓ Added {total_new_cards} new cards across {sets_with_new_cards} sets")
        else:
            self.log("No missing cards found in existing sets")

    def run(self):
        """Main sync process"""
        try:
            # 1. Sync series
            self.sync_series()

            # 2. Sync sets (and their cards for new sets)
            self.sync_sets()

            # 3. Check existing sets for missing cards
            self.check_existing_sets_for_missing_cards()

            # Print summary
            self.log("\n" + "=" * 60)
            self.log("SYNC COMPLETED")
            self.log(f"Series added: {self.stats['series_added']}")
            self.log(f"Sets added: {self.stats['sets_added']}")
            self.log(f"Cards added: {self.stats['cards_added']}")
            self.log(f"Cards checked: {self.stats['cards_checked']}")
            self.log(f"Errors: {self.stats['errors']}")
            self.log(f"Completed at {datetime.now().isoformat()}")

        except Exception as e:
            self.log(f"\nFATAL ERROR: {e}")
            self.stats['errors'] += 1
        finally:
            # Close log file
            self.log_file.close()


def main():
    """Entry point for the script"""
    syncer = TCGdexAutoSync()
    syncer.run()


if __name__ == "__main__":
    main()