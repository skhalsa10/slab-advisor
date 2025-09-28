#!/usr/bin/env python3
"""
Supplemental Pokemon Sets Data Sync Script

This script syncs supplemental data for Pokemon sets from multiple APIs:
- PokemonTCG.io API for logos/symbols
- TCGCSV API for TCGPlayer group IDs (generates URLs from group IDs)

Usage:
    python sync_supplemental_sets_data.py

Features:
- Smart ID mapping using fuzzy name matching
- Tracks unmapped sets from both sources
- Updates secondary_logo, secondary_symbol, tcgplayer_group_id, tcgplayer_url fields
- Skips sets marked as "n/a" or null (confirmed not in source)
- Idempotent - safe to run multiple times
"""

import os
import sys
import json
import requests
from datetime import datetime
from typing import List, Dict, Optional, Set
from difflib import SequenceMatcher
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv('../.env.local')

# API configuration
POKEMONTCG_IO_API_BASE = "https://api.pokemontcg.io/v2"
TCGCSV_API_BASE = "https://tcgcsv.com"
TCGPLAYER_URL_BASE = "https://www.tcgplayer.com/product/organizedplay/pokemon/{group_id}"

# File paths
MAPPING_FILE = "pokemon_sets_ids.json"
UNMAPPED_PTCGIO_FILE = "unmapped_ptcgio_sets.json"
UNMAPPED_TCGCSV_FILE = "unmapped_tcgcsv_groups.json"
LOG_FILE = "supplemental_sync_log.txt"

class SupplementalDataSync:
    def __init__(self, force_update: bool = False):
        """Initialize the sync with Supabase client and API key"""
        self.force_update = force_update
        # Set up logging
        self.log_file = open(LOG_FILE, 'w')
        self.log(f"Supplemental Data Sync Started at {datetime.now().isoformat()}")
        if self.force_update:
            self.log("🔄 FORCE UPDATE MODE - Will update all records regardless of existing data")
        self.log("=" * 60)

        # Initialize Supabase
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

        if not supabase_url or not supabase_key:
            self.log("ERROR: Missing Supabase credentials in .env.local")
            sys.exit(1)

        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.log("✓ Connected to Supabase")

        # Get PokemonTCG.io API key
        self.api_key = os.getenv('POKEMONTCG_IO_API_KEY')
        if not self.api_key:
            self.log("ERROR: Missing POKEMONTCG_IO_API_KEY in .env.local")
            sys.exit(1)

        self.log("✓ PokemonTCG.io API key loaded")

        # Initialize counters
        self.stats = {
            'ptcgio_sets_updated': 0,
            'ptcgio_sets_mapped': 0,
            'ptcgio_sets_unmapped': 0,
            'ptcgio_sets_skipped': 0,
            'tcgcsv_groups_mapped': 0,
            'tcgcsv_groups_updated': 0,
            'tcgcsv_groups_unmapped': 0,
            'tcgcsv_groups_skipped': 0,
            'errors': 0
        }

        # Load existing mappings
        self.mappings = self.load_mappings()
        self.log(f"✓ Loaded {len(self.mappings)} existing set mappings")

        # Sync mappings with database (add any new sets)
        self.sync_mappings_with_database()

    def log(self, message: str):
        """Write to log file and print to console"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_message = f"[{timestamp}] {message}"
        print(log_message)
        self.log_file.write(log_message + "\n")
        self.log_file.flush()

    def load_mappings(self) -> Dict:
        """Load existing set mappings from JSON file"""
        try:
            with open(MAPPING_FILE, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            self.log(f"ERROR: Mapping file {MAPPING_FILE} not found")
            sys.exit(1)
        except Exception as e:
            self.log(f"ERROR loading mappings: {e}")
            sys.exit(1)

    def save_mappings(self):
        """Save updated mappings to JSON file"""
        try:
            with open(MAPPING_FILE, 'w') as f:
                json.dump(self.mappings, f, indent=2)
            self.log(f"✓ Saved updated mappings to {MAPPING_FILE}")
        except Exception as e:
            self.log(f"ERROR saving mappings: {e}")
            self.stats['errors'] += 1

    def sync_mappings_with_database(self):
        """Sync mapping file with database - add any new sets from database"""
        try:
            # Fetch all sets from database
            result = self.supabase.table('pokemon_sets')\
                .select('id, name, tcgplayer_group_id, ptcgio_id')\
                .execute()

            if not result.data:
                self.log("No sets found in database")
                return

            # Track if we need to save changes
            mapping_updated = False
            new_sets_added = 0

            for db_set in result.data:
                set_id = db_set['id']
                set_name = db_set['name']
                db_group_id = db_set.get('tcgplayer_group_id')
                db_ptcgio_id = db_set.get('ptcgio_id')

                if set_id not in self.mappings:
                    # New set found in database - add to mappings with existing data or empty fields
                    self.mappings[set_id] = {
                        'name': set_name,
                        'tcgplayer_group_id': db_group_id,
                        'ptcgio_id': db_ptcgio_id
                    }
                    new_sets_added += 1
                    mapping_updated = True
                    self.log(f"  + Added new set to mappings: {set_id} ({set_name})")

                else:
                    # Existing set - preserve manual mappings but update name if changed
                    if self.mappings[set_id].get('name') != set_name:
                        self.mappings[set_id]['name'] = set_name
                        mapping_updated = True
                        self.log(f"  ~ Updated name for {set_id}: {set_name}")

            # Save updated mappings if changes were made
            if mapping_updated:
                self.save_mappings()
                self.log(f"✓ Added {new_sets_added} new sets to mapping file")
            else:
                self.log("✓ Mapping file is up to date with database")

        except Exception as e:
            self.log(f"ERROR syncing mappings with database: {e}")
            self.stats['errors'] += 1

    def fetch_pokemontcg_io_sets(self) -> List[Dict]:
        """Fetch all sets from PokemonTCG.io API"""
        try:
            headers = {'X-Api-Key': self.api_key}
            response = requests.get(f"{POKEMONTCG_IO_API_BASE}/sets", headers=headers)
            response.raise_for_status()

            data = response.json()
            sets = data.get('data', [])

            self.log(f"✓ Fetched {len(sets)} sets from PokemonTCG.io")
            return sets
        except Exception as e:
            self.log(f"ERROR fetching sets from PokemonTCG.io: {e}")
            self.stats['errors'] += 1
            return []

    def fetch_tcgcsv_groups(self) -> List[Dict]:
        """Fetch all Pokemon groups from TCGCSV API"""
        try:
            url = f"{TCGCSV_API_BASE}/tcgplayer/3/groups"
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            data = response.json()

            # The API returns an object with 'results' array
            if isinstance(data, dict) and 'results' in data:
                groups = data['results']
            elif isinstance(data, list):
                groups = data
            else:
                self.log("ERROR: Unexpected TCGCSV API response format")
                self.stats['errors'] += 1
                return []

            self.log(f"✓ Fetched {len(groups)} groups from TCGCSV")
            return groups
        except Exception as e:
            self.log(f"ERROR fetching groups from TCGCSV: {e}")
            self.stats['errors'] += 1
            return []

    def calculate_similarity(self, name1: str, name2: str) -> float:
        """Calculate similarity between two set names"""
        # Normalize names for comparison
        norm1 = name1.lower().replace("&", "and").replace("-", " ").strip()
        norm2 = name2.lower().replace("&", "and").replace("-", " ").strip()

        # Use sequence matcher for similarity
        return SequenceMatcher(None, norm1, norm2).ratio()

    def find_matching_set(self, ptcgio_set: Dict) -> Optional[str]:
        """
        Find matching set in our database using fuzzy name matching
        Returns: set_id if single match found, None if no match or ambiguous
        """
        ptcgio_name = ptcgio_set.get('name', '')
        if not ptcgio_name:
            return None

        matches = []

        # Check all our sets for name similarity
        for set_id, mapping in self.mappings.items():
            our_name = mapping.get('name', '')
            if not our_name:
                continue

            similarity = self.calculate_similarity(ptcgio_name, our_name)

            # Consider it a match if similarity is high enough
            if similarity >= 0.8:  # 80% similarity threshold
                matches.append((set_id, similarity, our_name))

        # Sort by similarity (highest first)
        matches.sort(key=lambda x: x[1], reverse=True)

        if len(matches) == 1:
            # Single confident match
            return matches[0][0]
        elif len(matches) > 1:
            # Multiple matches - check if top match is significantly better
            top_similarity = matches[0][1]
            second_similarity = matches[1][1]

            # If top match is significantly better (>10% difference), use it
            if top_similarity - second_similarity > 0.1:
                return matches[0][0]
            else:
                # Too ambiguous
                self.log(f"  Ambiguous matches for '{ptcgio_name}':")
                for set_id, sim, name in matches[:3]:
                    self.log(f"    {set_id}: {name} ({sim:.2f})")
                return None
        else:
            # No matches
            return None

    def check_if_already_mapped(self, ptcgio_id: str) -> bool:
        """Check if this PokemonTCG.io ID is already mapped"""
        # Check in database
        try:
            result = self.supabase.table('pokemon_sets')\
                .select('id')\
                .eq('ptcgio_id', ptcgio_id)\
                .execute()

            if result.data:
                return True
        except Exception as e:
            self.log(f"ERROR checking database for ptcgio_id {ptcgio_id}: {e}")

        # Check in local mappings
        for mapping in self.mappings.values():
            if mapping.get('ptcgio_id') == ptcgio_id:
                return True

        return False

    def map_pokemontcg_io_sets(self, ptcgio_sets: List[Dict]):
        """Map PokemonTCG.io sets to our database sets"""
        self.log("\n--- Mapping PokemonTCG.io Sets ---")

        unmapped_sets = []
        mapping_updated = False

        for ptcgio_set in ptcgio_sets:
            ptcgio_id = ptcgio_set.get('id')
            ptcgio_name = ptcgio_set.get('name', 'Unknown')

            if not ptcgio_id:
                continue

            # Skip if already mapped
            if self.check_if_already_mapped(ptcgio_id):
                continue

            # Try to find matching set
            matching_set_id = self.find_matching_set(ptcgio_set)

            if matching_set_id:
                # Found a match
                self.mappings[matching_set_id]['ptcgio_id'] = ptcgio_id
                self.stats['ptcgio_sets_mapped'] += 1
                mapping_updated = True
                self.log(f"  ✓ Mapped: {ptcgio_name} → {matching_set_id}")

            else:
                # No match found - add to unmapped list
                unmapped_sets.append({
                    'ptcgio_id': ptcgio_id,
                    'name': ptcgio_name,
                    'series': ptcgio_set.get('series', 'Unknown'),
                    'release_date': ptcgio_set.get('releaseDate', 'Unknown'),
                    'total_cards': ptcgio_set.get('total', 0)
                })
                self.stats['ptcgio_sets_unmapped'] += 1

        # Save updated mappings if changed
        if mapping_updated:
            self.save_mappings()

        # Save unmapped sets
        if unmapped_sets:
            self.save_unmapped_sets(unmapped_sets)

        self.log(f"✓ Mapped {self.stats['ptcgio_sets_mapped']} new sets")
        self.log(f"Found {self.stats['ptcgio_sets_unmapped']} unmapped sets")

    def save_unmapped_sets(self, unmapped_sets: List[Dict]):
        """Save unmapped sets to JSON file"""
        try:
            unmapped_data = {
                'unmapped_sets': unmapped_sets,
                'last_updated': datetime.now().isoformat(),
                'total_count': len(unmapped_sets)
            }

            with open(UNMAPPED_PTCGIO_FILE, 'w') as f:
                json.dump(unmapped_data, f, indent=2)

            self.log(f"✓ Saved {len(unmapped_sets)} unmapped sets to {UNMAPPED_PTCGIO_FILE}")
        except Exception as e:
            self.log(f"ERROR saving unmapped sets: {e}")
            self.stats['errors'] += 1

    def update_database_with_supplemental_data(self, ptcgio_sets: List[Dict]):
        """Update database with supplemental data from PokemonTCG.io"""
        self.log("\n--- Updating Database with Supplemental Data ---")

        # Create a lookup dict for ptcgio sets
        ptcgio_lookup = {s['id']: s for s in ptcgio_sets if s.get('id')}

        for set_id, mapping in self.mappings.items():
            ptcgio_id = mapping.get('ptcgio_id')

            # Skip if no mapping or marked as n/a or ambiguous
            if not ptcgio_id or ptcgio_id == 'n/a' or ptcgio_id == '?':
                continue

            # Get PokemonTCG.io data
            ptcgio_data = ptcgio_lookup.get(ptcgio_id)
            if not ptcgio_data:
                continue

            # Extract image URLs
            images = ptcgio_data.get('images', {})
            logo_url = images.get('logo')
            symbol_url = images.get('symbol')

            # Check if database already has this data (unless force update)
            if not self.force_update:
                try:
                    result = self.supabase.table('pokemon_sets')\
                        .select('secondary_logo, secondary_symbol')\
                        .eq('id', set_id)\
                        .execute()

                    if result.data:
                        existing = result.data[0]
                        existing_logo = existing.get('secondary_logo')
                        existing_symbol = existing.get('secondary_symbol')

                        # Skip if both fields already have data
                        if existing_logo and existing_symbol:
                            self.stats['ptcgio_sets_skipped'] += 1
                            continue

                        # Only update missing fields
                        if existing_logo and logo_url:
                            logo_url = None  # Don't update if already exists
                        if existing_symbol and symbol_url:
                            symbol_url = None  # Don't update if already exists

                        # Skip entirely if no updates needed
                        if not logo_url and not symbol_url:
                            self.stats['ptcgio_sets_skipped'] += 1
                            continue

                except Exception as e:
                    self.log(f"  ERROR checking existing data for {set_id}: {e}")
                    # Continue with update on error

            # Update database
            try:
                update_data = {
                    'ptcgio_id': ptcgio_id,
                    'updated_at': datetime.now().isoformat()
                }

                # Update secondary fields
                if logo_url:
                    update_data['secondary_logo'] = logo_url
                if symbol_url:
                    update_data['secondary_symbol'] = symbol_url

                result = self.supabase.table('pokemon_sets')\
                    .update(update_data)\
                    .eq('id', set_id)\
                    .execute()

                if result.data:
                    self.stats['ptcgio_sets_updated'] += 1
                    self.log(f"  ✓ Updated {set_id} with PokemonTCG.io data")
                else:
                    self.log(f"  Warning: No rows updated for {set_id}")

            except Exception as e:
                self.log(f"  ERROR updating {set_id}: {e}")
                self.stats['errors'] += 1

        self.log(f"✓ Updated {self.stats['ptcgio_sets_updated']} sets in database")

    def extract_set_id_from_tcgcsv_name(self, name: str) -> Optional[str]:
        """Extract set ID from TCGCSV name (e.g., 'SV10: Destined Rivals' -> 'sv10')"""
        import re

        # Try to extract pattern like "SV10:" or "SM11.5:"
        pattern = r'^([A-Z]+[\d]+(?:\.\d+)?[a-z]?):'
        match = re.match(pattern, name)
        if match:
            return match.group(1).lower()

        return None

    def find_matching_set_tcgcsv(self, tcgcsv_group: Dict) -> Optional[str]:
        """
        Find matching set for TCGCSV group using fuzzy name matching
        Returns: set_id if single match found, None if no match or ambiguous
        """
        group_name = tcgcsv_group.get('name', '')
        if not group_name:
            return None

        # First try to extract set ID from name
        extracted_id = self.extract_set_id_from_tcgcsv_name(group_name)
        if extracted_id and extracted_id in self.mappings:
            return extracted_id

        # If not found, use fuzzy matching with lower threshold for TCGCSV
        matches = []

        for set_id, mapping in self.mappings.items():
            our_name = mapping.get('name', '')
            if not our_name:
                continue

            # Enhanced similarity calculation for TCGCSV
            similarity = self.calculate_tcgcsv_similarity(group_name, our_name)

            # Consider it a match if similarity is high enough
            if similarity >= 0.75:  # 75% similarity threshold
                matches.append((set_id, similarity, our_name))

        # Sort by similarity (highest first)
        matches.sort(key=lambda x: x[1], reverse=True)

        if len(matches) == 1:
            # Single confident match
            return matches[0][0]
        elif len(matches) > 1:
            # Multiple matches - check if top match is significantly better
            top_similarity = matches[0][1]
            second_similarity = matches[1][1]

            # If top match is significantly better (>15% difference), use it
            if top_similarity - second_similarity > 0.15:
                return matches[0][0]
            else:
                # Too ambiguous
                self.log(f"  Ambiguous TCGCSV matches for '{group_name}':")
                for set_id, sim, name in matches[:3]:
                    self.log(f"    {set_id}: {name} ({sim:.2f})")
                return None
        else:
            # No matches
            return None

    def calculate_tcgcsv_similarity(self, name1: str, name2: str) -> float:
        """Calculate similarity between TCGCSV name and our set name"""
        # Normalize names for comparison
        norm1 = name1.lower().replace("&", "and").replace("-", " ").replace(":", "").strip()
        norm2 = name2.lower().replace("&", "and").replace("-", " ").replace(":", "").strip()

        # Remove common prefixes for better matching
        for prefix in ['sv', 'swsh', 'sm', 'xy', 'bw', 'dp', 'ex']:
            norm1 = norm1.replace(prefix + " ", "").replace(prefix, "")
            norm2 = norm2.replace(prefix + " ", "").replace(prefix, "")

        # Use sequence matcher for similarity
        return SequenceMatcher(None, norm1, norm2).ratio()

    def check_if_tcgcsv_already_mapped(self, group_id: int) -> bool:
        """Check if this TCGPlayer group ID is already mapped"""
        # Check in local mappings
        for mapping in self.mappings.values():
            if mapping.get('tcgplayer_group_id') == group_id:
                return True

        # Check in database
        try:
            result = self.supabase.table('pokemon_sets')\
                .select('id')\
                .eq('tcgplayer_group_id', group_id)\
                .execute()

            if result.data:
                return True
        except Exception as e:
            self.log(f"ERROR checking database for group_id {group_id}: {e}")

        return False

    def map_tcgcsv_groups(self, tcgcsv_groups: List[Dict]):
        """Map TCGCSV groups to our database sets"""
        self.log("\n--- Mapping TCGCSV Groups ---")

        unmapped_groups = []
        mapping_updated = False

        for group in tcgcsv_groups:
            group_id = group.get('groupId')
            group_name = group.get('name', 'Unknown')

            if not group_id:
                continue

            # Skip if already mapped
            if self.check_if_tcgcsv_already_mapped(group_id):
                self.stats['tcgcsv_groups_skipped'] += 1
                continue

            # Try to find matching set
            matching_set_id = self.find_matching_set_tcgcsv(group)

            if matching_set_id:
                # Check if this set already has a tcgplayer_group_id that's not null
                existing_group_id = self.mappings[matching_set_id].get('tcgplayer_group_id')

                if existing_group_id is None:
                    # Found a match and no existing mapping
                    self.mappings[matching_set_id]['tcgplayer_group_id'] = group_id
                    self.stats['tcgcsv_groups_mapped'] += 1
                    mapping_updated = True
                    self.log(f"  ✓ Mapped: {group_name} → {matching_set_id} (Group ID: {group_id})")
                else:
                    # Already has a group ID, skip
                    self.stats['tcgcsv_groups_skipped'] += 1
            else:
                # No match found - add to unmapped list
                unmapped_groups.append({
                    'group_id': group_id,
                    'name': group_name,
                    'category_id': group.get('categoryId'),
                    'published': group.get('published')
                })
                self.stats['tcgcsv_groups_unmapped'] += 1

        # Save updated mappings if changed
        if mapping_updated:
            self.save_mappings()

        # Save unmapped groups
        if unmapped_groups:
            self.save_unmapped_tcgcsv_groups(unmapped_groups)

        self.log(f"✓ Mapped {self.stats['tcgcsv_groups_mapped']} new TCGCSV groups")
        self.log(f"Skipped {self.stats['tcgcsv_groups_skipped']} already-mapped groups")
        self.log(f"Found {self.stats['tcgcsv_groups_unmapped']} unmapped groups")

    def save_unmapped_tcgcsv_groups(self, unmapped_groups: List[Dict]):
        """Save unmapped TCGCSV groups to JSON file"""
        try:
            unmapped_data = {
                'unmapped_groups': unmapped_groups,
                'last_updated': datetime.now().isoformat(),
                'total_count': len(unmapped_groups)
            }

            with open(UNMAPPED_TCGCSV_FILE, 'w') as f:
                json.dump(unmapped_data, f, indent=2)

            self.log(f"✓ Saved {len(unmapped_groups)} unmapped TCGCSV groups to {UNMAPPED_TCGCSV_FILE}")
        except Exception as e:
            self.log(f"ERROR saving unmapped TCGCSV groups: {e}")
            self.stats['errors'] += 1

    def update_database_with_tcgplayer_data(self):
        """Update database with TCGPlayer group IDs and URLs"""
        self.log("\n--- Updating Database with TCGPlayer Data ---")

        for set_id, mapping in self.mappings.items():
            group_id = mapping.get('tcgplayer_group_id')

            # Skip if no mapping or null
            if not group_id or group_id == 'null':
                continue

            # Check if database already has this group_id
            try:
                result = self.supabase.table('pokemon_sets')\
                    .select('tcgplayer_group_id')\
                    .eq('id', set_id)\
                    .execute()

                if result.data and result.data[0].get('tcgplayer_group_id') == group_id:
                    # Already up to date
                    continue

                # Update database
                update_data = {
                    'tcgplayer_group_id': group_id,
                    'tcgplayer_url': TCGPLAYER_URL_BASE.format(group_id=group_id),
                    'updated_at': datetime.now().isoformat()
                }

                result = self.supabase.table('pokemon_sets')\
                    .update(update_data)\
                    .eq('id', set_id)\
                    .execute()

                if result.data:
                    self.stats['tcgcsv_groups_updated'] += 1
                    self.log(f"  ✓ Updated {set_id} with TCGPlayer group ID: {group_id}")
                else:
                    self.log(f"  Warning: No rows updated for {set_id}")

            except Exception as e:
                self.log(f"  ERROR updating {set_id}: {e}")
                self.stats['errors'] += 1

        self.log(f"✓ Updated {self.stats['tcgcsv_groups_updated']} sets with TCGPlayer data")

    def run(self):
        """Main sync process"""
        try:
            # 1. Fetch all sets from PokemonTCG.io
            ptcgio_sets = self.fetch_pokemontcg_io_sets()
            if not ptcgio_sets:
                self.log("No sets retrieved from PokemonTCG.io - aborting")
                return

            # 2. Map PokemonTCG.io sets to our database sets
            self.map_pokemontcg_io_sets(ptcgio_sets)

            # 3. Update database with PokemonTCG.io supplemental data
            self.update_database_with_supplemental_data(ptcgio_sets)

            # 4. Fetch all groups from TCGCSV
            tcgcsv_groups = self.fetch_tcgcsv_groups()
            if not tcgcsv_groups:
                self.log("No groups retrieved from TCGCSV - continuing with PokemonTCG.io only")
            else:
                # 5. Map TCGCSV groups to our database sets
                self.map_tcgcsv_groups(tcgcsv_groups)

                # 6. Update database with TCGPlayer data
                self.update_database_with_tcgplayer_data()

            # Print summary
            self.log("\n" + "=" * 60)
            self.log("SUPPLEMENTAL SYNC COMPLETED")
            self.log(f"PokemonTCG.io sets mapped: {self.stats['ptcgio_sets_mapped']}")
            self.log(f"PokemonTCG.io sets updated: {self.stats['ptcgio_sets_updated']}")
            self.log(f"PokemonTCG.io sets skipped: {self.stats['ptcgio_sets_skipped']}")
            self.log(f"PokemonTCG.io sets unmapped: {self.stats['ptcgio_sets_unmapped']}")
            self.log(f"TCGCSV groups mapped: {self.stats['tcgcsv_groups_mapped']}")
            self.log(f"TCGCSV groups updated: {self.stats['tcgcsv_groups_updated']}")
            self.log(f"TCGCSV groups skipped: {self.stats['tcgcsv_groups_skipped']}")
            self.log(f"TCGCSV groups unmapped: {self.stats['tcgcsv_groups_unmapped']}")
            self.log(f"Errors: {self.stats['errors']}")
            self.log(f"Completed at {datetime.now().isoformat()}")

            if self.stats['ptcgio_sets_unmapped'] > 0:
                self.log(f"\nCheck {UNMAPPED_PTCGIO_FILE} for PokemonTCG.io sets that couldn't be mapped")

            if self.stats['tcgcsv_groups_unmapped'] > 0:
                self.log(f"Check {UNMAPPED_TCGCSV_FILE} for TCGCSV groups that couldn't be mapped")

            if self.stats['ptcgio_sets_mapped'] > 0 or self.stats['tcgcsv_groups_mapped'] > 0:
                self.log(f"Check {MAPPING_FILE} for new mappings")

        except Exception as e:
            self.log(f"\nFATAL ERROR: {e}")
            self.stats['errors'] += 1
        finally:
            # Close log file
            self.log_file.close()


def main():
    """Entry point for the script"""
    import argparse

    parser = argparse.ArgumentParser(description='Sync supplemental Pokemon sets data')
    parser.add_argument('--force', action='store_true',
                       help='Force update all records even if data already exists')

    args = parser.parse_args()

    syncer = SupplementalDataSync(force_update=args.force)
    syncer.run()


if __name__ == "__main__":
    main()