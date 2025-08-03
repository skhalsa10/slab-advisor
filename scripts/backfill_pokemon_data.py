#!/usr/bin/env python3
"""
Pokemon TCG Data Backfill Script

This script helps identify and backfill missing Pokemon card data from TCGdex API
into your Supabase database. It can check for missing cards, preview changes,
and perform selective or full backfills.

Usage:
    python backfill_pokemon_data.py --check-set <set_id>
    python backfill_pokemon_data.py --backfill-set <set_id>
    python backfill_pokemon_data.py --check-all
"""

import os
import sys
import argparse
import requests
import json
import re
from datetime import datetime
from typing import List, Dict, Optional, Set
from dotenv import load_dotenv
from supabase import create_client, Client
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn

# Load environment variables
load_dotenv('../.env.local')

# Initialize console for pretty output
console = Console()

# TCGdex API base URL
TCGDEX_API_BASE = "https://api.tcgdex.net/v2/en"

# TCGCSV API base URL
TCGCSV_API_BASE = "https://tcgcsv.com"
TCGPLAYER_URL_BASE = "https://www.tcgplayer.com/categories/trading-and-collectible-card-games/pokemon"


class PokemonBackfiller:
    def __init__(self):
        """Initialize the backfiller with Supabase client"""
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            console.print("[red]Error: Missing Supabase credentials in .env.local[/red]")
            sys.exit(1)
            
        self.supabase: Client = create_client(supabase_url, supabase_key)
        console.print("[green]✓ Connected to Supabase[/green]")
    
    def fetch_tcgdex_series(self) -> List[Dict]:
        """Fetch all series from TCGdex API"""
        try:
            response = requests.get(f"{TCGDEX_API_BASE}/series")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            console.print(f"[red]Error fetching series from TCGdex: {e}[/red]")
            return []
    
    def fetch_tcgdex_sets(self) -> List[Dict]:
        """Fetch all sets from TCGdex API"""
        try:
            response = requests.get(f"{TCGDEX_API_BASE}/sets")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            console.print(f"[red]Error fetching sets from TCGdex: {e}[/red]")
            return []
    
    def fetch_tcgdex_set_details(self, set_id: str) -> Optional[Dict]:
        """Fetch detailed set information including cards"""
        try:
            response = requests.get(f"{TCGDEX_API_BASE}/sets/{set_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            console.print(f"[red]Error fetching set {set_id} from TCGdex: {e}[/red]")
            return None
    
    def fetch_tcgdex_card_details(self, card_id: str) -> Optional[Dict]:
        """Fetch detailed card information"""
        try:
            response = requests.get(f"{TCGDEX_API_BASE}/cards/{card_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            console.print(f"[red]Error fetching card {card_id} from TCGdex: {e}[/red]")
            return None
    
    def get_db_series(self) -> Set[str]:
        """Get all series IDs from database"""
        try:
            result = self.supabase.table('pokemon_series').select('id').execute()
            return {row['id'] for row in result.data}
        except Exception as e:
            console.print(f"[red]Error fetching series from database: {e}[/red]")
            return set()
    
    def get_db_sets(self) -> Set[str]:
        """Get all set IDs from database"""
        try:
            result = self.supabase.table('pokemon_sets').select('id').execute()
            return {row['id'] for row in result.data}
        except Exception as e:
            console.print(f"[red]Error fetching sets from database: {e}[/red]")
            return set()
    
    def get_db_cards_for_set(self, set_id: str) -> Set[str]:
        """Get all card IDs for a specific set from database"""
        try:
            result = self.supabase.table('pokemon_cards').select('id').eq('set_id', set_id).execute()
            return {row['id'] for row in result.data}
        except Exception as e:
            console.print(f"[red]Error fetching cards for set {set_id} from database: {e}[/red]")
            return set()
    
    def check_missing_cards_in_set(self, set_id: str) -> List[Dict]:
        """Check for missing cards in a specific set"""
        console.print(f"\n[blue]Checking set: {set_id}[/blue]")
        
        # Get set details from TCGdex
        set_data = self.fetch_tcgdex_set_details(set_id)
        if not set_data:
            return []
        
        # Get existing cards from database
        db_cards = self.get_db_cards_for_set(set_id)
        
        # Get all cards from TCGdex
        tcgdex_cards = {card['id'] for card in set_data.get('cards', [])}
        
        # Find missing cards
        missing_card_ids = tcgdex_cards - db_cards
        
        console.print(f"Set: [yellow]{set_data['name']}[/yellow]")
        console.print(f"Total cards in TCGdex: [green]{len(tcgdex_cards)}[/green]")
        console.print(f"Cards in database: [blue]{len(db_cards)}[/blue]")
        console.print(f"Missing cards: [red]{len(missing_card_ids)}[/red]")
        
        missing_cards = []
        if missing_card_ids:
            # Get details for missing cards
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console
            ) as progress:
                task = progress.add_task("Fetching missing card details...", total=len(missing_card_ids))
                
                for card_id in missing_card_ids:
                    card_brief = next((c for c in set_data['cards'] if c['id'] == card_id), None)
                    if card_brief:
                        missing_cards.append({
                            'id': card_id,
                            'name': card_brief.get('name', 'Unknown'),
                            'localId': card_brief.get('localId', 'Unknown')
                        })
                    progress.advance(task)
        
        return missing_cards
    
    def check_all_sets(self):
        """Check all sets for missing cards, and also check for missing series and sets"""
        # First check for missing series
        tcgdex_series = self.fetch_tcgdex_series()
        db_series = self.get_db_series()
        missing_series = [s for s in tcgdex_series if s['id'] not in db_series]
        
        if missing_series:
            console.print(f"\n[red]Missing {len(missing_series)} series in database:[/red]")
            for serie in missing_series[:10]:
                console.print(f"  - {serie['id']}: {serie['name']}")
            if len(missing_series) > 10:
                console.print(f"  ... and {len(missing_series) - 10} more")
        
        # Check for missing sets
        tcgdex_sets = self.fetch_tcgdex_sets()
        db_sets = self.get_db_sets()
        missing_sets = [s for s in tcgdex_sets if s['id'] not in db_sets]
        
        if missing_sets:
            console.print(f"\n[red]Missing {len(missing_sets)} sets in database:[/red]")
            for set_brief in missing_sets[:10]:
                console.print(f"  - {set_brief['id']}: {set_brief['name']}")
            if len(missing_sets) > 10:
                console.print(f"  ... and {len(missing_sets) - 10} more")
        
        # Check for missing cards in existing sets
        table = Table(title="\nMissing Cards in Existing Sets")
        table.add_column("Set ID", style="cyan")
        table.add_column("Set Name", style="green")
        table.add_column("Total Cards", justify="right")
        table.add_column("In Database", justify="right")
        table.add_column("Missing", justify="right", style="red")
        
        total_missing_cards = 0
        sets_checked = 0
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Checking sets for missing cards...", total=len(tcgdex_sets))
            
            for set_brief in tcgdex_sets:
                set_id = set_brief['id']
                
                if set_id in db_sets:
                    sets_checked += 1
                    set_data = self.fetch_tcgdex_set_details(set_id)
                    if set_data:
                        db_cards = self.get_db_cards_for_set(set_id)
                        tcgdex_cards = {card['id'] for card in set_data.get('cards', [])}
                        missing = len(tcgdex_cards - db_cards)
                        
                        if missing > 0:
                            total_missing_cards += missing
                            table.add_row(
                                set_id,
                                set_data['name'],
                                str(len(tcgdex_cards)),
                                str(len(db_cards)),
                                str(missing)
                            )
                
                progress.advance(task)
        
        console.print("\n")
        if total_missing_cards > 0:
            console.print(table)
        else:
            console.print("[green]✓ All existing sets have complete card data![/green]")
        
        # Summary
        console.print("\n[bold]Summary:[/bold]")
        console.print(f"Missing series: [red]{len(missing_series)}[/red]")
        console.print(f"Missing sets: [red]{len(missing_sets)}[/red]")
        console.print(f"Sets checked for cards: [blue]{sets_checked}[/blue]")
        console.print(f"Total missing cards: [red]{total_missing_cards}[/red]")
    
    def backfill_set(self, set_id: str, dry_run: bool = False):
        """Backfill missing cards for a specific set"""
        # Check if set exists in database
        db_sets = self.get_db_sets()
        if set_id not in db_sets:
            console.print(f"[red]Set {set_id} not found in database. Run series/set backfill first.[/red]")
            return
        
        # Get missing cards
        missing_cards = self.check_missing_cards_in_set(set_id)
        
        if not missing_cards:
            console.print("[green]No missing cards to backfill![/green]")
            return
        
        if dry_run:
            console.print("\n[yellow]DRY RUN - No data will be inserted[/yellow]")
            table = Table(title="Cards that would be inserted")
            table.add_column("ID", style="cyan")
            table.add_column("Local ID")
            table.add_column("Name", style="green")
            
            for card in missing_cards[:10]:  # Show first 10
                table.add_row(card['id'], str(card['localId']), card['name'])
            
            if len(missing_cards) > 10:
                table.add_row("...", "...", f"... and {len(missing_cards) - 10} more")
            
            console.print(table)
            return
        
        # Confirm before proceeding
        console.print(f"\n[yellow]About to backfill {len(missing_cards)} cards[/yellow]")
        if input("Continue? (y/N): ").lower() != 'y':
            console.print("[red]Backfill cancelled[/red]")
            return
        
        # Fetch full card details and insert
        cards_to_insert = []
        errors = []
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Fetching and preparing cards...", total=len(missing_cards))
            
            for card in missing_cards:
                card_details = self.fetch_tcgdex_card_details(card['id'])
                if card_details:
                    card_data = {
                        'id': card_details['id'],
                        'set_id': set_id,
                        'local_id': str(card_details.get('localId', '')),
                        'name': card_details['name'],
                        'image': card_details.get('image'),
                        'category': card_details.get('category'),
                        'illustrator': card_details.get('illustrator'),
                        'rarity': card_details.get('rarity'),
                        'variant_normal': card_details.get('variants', {}).get('normal', False),
                        'variant_reverse': card_details.get('variants', {}).get('reverse', False),
                        'variant_holo': card_details.get('variants', {}).get('holo', False),
                        'variant_first_edition': card_details.get('variants', {}).get('firstEdition', False),
                        'updated_at': datetime.now().isoformat()
                    }
                    cards_to_insert.append(card_data)
                else:
                    errors.append(card['id'])
                
                progress.advance(task)
        
        # Insert in batches
        if cards_to_insert:
            console.print(f"\n[blue]Inserting {len(cards_to_insert)} cards...[/blue]")
            
            batch_size = 50
            for i in range(0, len(cards_to_insert), batch_size):
                batch = cards_to_insert[i:i + batch_size]
                try:
                    result = self.supabase.table('pokemon_cards').upsert(batch).execute()
                    console.print(f"[green]✓ Inserted batch {i//batch_size + 1}/{(len(cards_to_insert) + batch_size - 1)//batch_size}[/green]")
                except Exception as e:
                    console.print(f"[red]Error inserting batch: {e}[/red]")
        
        # Report results
        console.print(f"\n[green]Successfully inserted {len(cards_to_insert)} cards[/green]")
        if errors:
            console.print(f"[red]Failed to fetch {len(errors)} cards: {errors[:5]}{'...' if len(errors) > 5 else ''}[/red]")
    
    def backfill_series_and_sets(self):
        """Backfill missing series and sets"""
        # Fetch from TCGdex
        tcgdex_series = self.fetch_tcgdex_series()
        tcgdex_sets = self.fetch_tcgdex_sets()
        
        # Get existing from database
        db_series = self.get_db_series()
        db_sets = self.get_db_sets()
        
        # Find missing
        missing_series = [s for s in tcgdex_series if s['id'] not in db_series]
        missing_sets = [s for s in tcgdex_sets if s['id'] not in db_sets]
        
        console.print(f"\nMissing series: [red]{len(missing_series)}[/red]")
        console.print(f"Missing sets: [red]{len(missing_sets)}[/red]")
        
        if missing_series or missing_sets:
            if input("\nBackfill missing series and sets? (y/N): ").lower() != 'y':
                return
            
            # Backfill series
            if missing_series:
                console.print("\n[blue]Backfilling series...[/blue]")
                series_data = []
                
                for serie in missing_series:
                    # Fetch full series data
                    response = requests.get(f"{TCGDEX_API_BASE}/series/{serie['id']}")
                    if response.ok:
                        full_serie = response.json()
                        series_data.append({
                            'id': full_serie['id'],
                            'name': full_serie['name'],
                            'logo': full_serie.get('logo'),
                            'updated_at': datetime.now().isoformat()
                        })
                
                if series_data:
                    result = self.supabase.table('pokemon_series').upsert(series_data).execute()
                    console.print(f"[green]✓ Inserted {len(series_data)} series[/green]")
            
            # Backfill sets
            if missing_sets:
                console.print("\n[blue]Backfilling sets...[/blue]")
                sets_data = []
                
                for set_brief in missing_sets:
                    set_details = self.fetch_tcgdex_set_details(set_brief['id'])
                    if set_details:
                        sets_data.append({
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
                        })
                
                if sets_data:
                    # Insert in batches
                    batch_size = 50
                    for i in range(0, len(sets_data), batch_size):
                        batch = sets_data[i:i + batch_size]
                        result = self.supabase.table('pokemon_sets').upsert(batch).execute()
                    console.print(f"[green]✓ Inserted {len(sets_data)} sets[/green]")


    def backfill_all_data(self, dry_run: bool = False):
        """Comprehensive backfill: series -> sets -> cards"""
        console.print("\n[bold]Starting comprehensive backfill...[/bold]")
        
        # Step 1: Check and backfill series
        tcgdex_series = self.fetch_tcgdex_series()
        db_series = self.get_db_series()
        missing_series = [s for s in tcgdex_series if s['id'] not in db_series]
        
        if missing_series:
            console.print(f"\n[yellow]Found {len(missing_series)} missing series[/yellow]")
            if not dry_run:
                if input("Backfill missing series? (y/N): ").lower() == 'y':
                    series_data = []
                    for serie in missing_series:
                        response = requests.get(f"{TCGDEX_API_BASE}/series/{serie['id']}")
                        if response.ok:
                            full_serie = response.json()
                            series_data.append({
                                'id': full_serie['id'],
                                'name': full_serie['name'],
                                'logo': full_serie.get('logo'),
                                'updated_at': datetime.now().isoformat()
                            })
                    
                    if series_data:
                        result = self.supabase.table('pokemon_series').upsert(series_data).execute()
                        console.print(f"[green]✓ Inserted {len(series_data)} series[/green]")
            else:
                console.print(f"[yellow]DRY RUN: Would insert {len(missing_series)} series[/yellow]")
        
        # Step 2: Check and backfill sets
        tcgdex_sets = self.fetch_tcgdex_sets()
        db_sets = self.get_db_sets()
        missing_sets = [s for s in tcgdex_sets if s['id'] not in db_sets]
        
        if missing_sets:
            console.print(f"\n[yellow]Found {len(missing_sets)} missing sets[/yellow]")
            if not dry_run:
                if input("Backfill missing sets? (y/N): ").lower() == 'y':
                    sets_data = []
                    with Progress(
                        SpinnerColumn(),
                        TextColumn("[progress.description]{task.description}"),
                        console=console
                    ) as progress:
                        task = progress.add_task("Fetching set details...", total=len(missing_sets))
                        
                        for set_brief in missing_sets:
                            set_details = self.fetch_tcgdex_set_details(set_brief['id'])
                            if set_details:
                                sets_data.append({
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
                                })
                            progress.advance(task)
                    
                    if sets_data:
                        # Insert in batches
                        batch_size = 50
                        for i in range(0, len(sets_data), batch_size):
                            batch = sets_data[i:i + batch_size]
                            result = self.supabase.table('pokemon_sets').upsert(batch).execute()
                        console.print(f"[green]✓ Inserted {len(sets_data)} sets[/green]")
            else:
                console.print(f"[yellow]DRY RUN: Would insert {len(missing_sets)} sets[/yellow]")
        
        # Step 3: Backfill cards for all sets (including newly added ones)
        all_sets = self.fetch_tcgdex_sets()
        db_sets_updated = self.get_db_sets()
        
        console.print(f"\n[blue]Checking {len(db_sets_updated)} sets for missing cards...[/blue]")
        
        sets_with_missing_cards = []
        total_missing_cards = 0
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Checking sets...", total=len(db_sets_updated))
            
            for set_id in db_sets_updated:
                set_data = self.fetch_tcgdex_set_details(set_id)
                if set_data:
                    db_cards = self.get_db_cards_for_set(set_id)
                    tcgdex_cards = {card['id'] for card in set_data.get('cards', [])}
                    missing = len(tcgdex_cards - db_cards)
                    
                    if missing > 0:
                        sets_with_missing_cards.append({
                            'id': set_id,
                            'name': set_data['name'],
                            'missing_count': missing,
                            'total_cards': len(tcgdex_cards)
                        })
                        total_missing_cards += missing
                
                progress.advance(task)
        
        if sets_with_missing_cards:
            console.print(f"\n[yellow]Found {total_missing_cards} missing cards across {len(sets_with_missing_cards)} sets[/yellow]")
            
            if not dry_run:
                if input("Backfill all missing cards? (y/N): ").lower() == 'y':
                    for set_info in sets_with_missing_cards:
                        console.print(f"\n[blue]Backfilling {set_info['name']} ({set_info['missing_count']} cards)...[/blue]")
                        self.backfill_set(set_info['id'], dry_run=False)
            else:
                console.print(f"[yellow]DRY RUN: Would backfill {total_missing_cards} cards[/yellow]")
                table = Table(title="Sets that would be updated")
                table.add_column("Set ID", style="cyan")
                table.add_column("Set Name", style="green")
                table.add_column("Missing Cards", justify="right", style="red")
                
                for set_info in sets_with_missing_cards[:10]:
                    table.add_row(
                        set_info['id'],
                        set_info['name'],
                        str(set_info['missing_count'])
                    )
                
                if len(sets_with_missing_cards) > 10:
                    table.add_row("...", f"... and {len(sets_with_missing_cards) - 10} more sets", "...")
                
                console.print(table)
        else:
            console.print("[green]✓ All sets have complete card data![/green]")
        
        console.print("\n[green]Comprehensive backfill complete![/green]")
    
    def fetch_tcgcsv_groups(self) -> List[Dict]:
        """Fetch all Pokemon groups from TCGCSV API"""
        try:
            url = f"{TCGCSV_API_BASE}/tcgplayer/3/groups"
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            
            # The API returns an object with 'results' array
            if isinstance(data, dict) and 'results' in data:
                return data['results']
            elif isinstance(data, list):
                return data
            else:
                console.print(f"[red]Unexpected API response format[/red]")
                return []
                
        except Exception as e:
            console.print(f"[red]Error fetching TCGCSV groups: {e}[/red]")
            return []
    
    def extract_set_id_from_name(self, name: str) -> Optional[str]:
        """Extract set ID from TCGCSV name (e.g., 'SV10: Destined Rivals' -> 'sv10')"""
        # Try to match patterns like "SV10:", "SM12:", "SWSH07:", etc.
        match = re.match(r'^([A-Z]+)(\d+(?:\.\d+)?[a-z]?):', name)
        if match:
            prefix = match.group(1).lower()
            number = match.group(2)
            
            # Remove leading zeros from the number part
            # e.g., "07" -> "7", "012" -> "12"
            number = re.sub(r'^0+(\d)', r'\1', number)
            
            return f"{prefix}{number}"
        return None
    
    def generate_tcgplayer_url(self, name: str) -> str:
        """Generate TCGPlayer URL from set name"""
        # Convert "SV10: Destined Rivals" -> "sv10-destined-rivals"
        slug = name.lower()
        slug = re.sub(r'[^a-z0-9\s-]', '', slug)  # Remove special chars except spaces and hyphens
        slug = re.sub(r'\s+', '-', slug.strip())  # Replace spaces with hyphens
        slug = re.sub(r'-+', '-', slug)  # Replace multiple hyphens with single
        return f"{TCGPLAYER_URL_BASE}/{slug}"
    
    def check_tcgplayer_mappings(self):
        """Check and generate TCGPlayer mappings file"""
        console.print("\n[bold]Checking TCGPlayer mappings...[/bold]")
        
        # Fetch TCGCSV groups
        groups = self.fetch_tcgcsv_groups()
        if not groups:
            console.print("[red]Failed to fetch TCGCSV groups[/red]")
            return
        
        # Get existing sets from database
        try:
            result = self.supabase.table('pokemon_sets').select('id, name').execute()
            db_sets = {row['id']: row['name'] for row in result.data}
        except Exception as e:
            console.print(f"[red]Error fetching sets from database: {e}[/red]")
            return
        
        # Create mappings
        mappings = {}
        auto_mapped_count = 0
        needs_manual_count = 0
        
        for group in groups:
            group_id = str(group['groupId'])
            group_name = group['name']
            
            # Try automatic mapping
            extracted_id = self.extract_set_id_from_name(group_name)
            auto_mapped_to = None
            
            if extracted_id:
                # First try the extracted ID as-is
                if extracted_id in db_sets:
                    auto_mapped_to = extracted_id
                    auto_mapped_count += 1
                else:
                    # Try alternative formats (e.g., if we extracted "swsh7", also try "swsh07")
                    match = re.match(r'^([a-z]+)(\d+)(.*)$', extracted_id)
                    if match and len(match.group(2)) == 1:
                        # Try with leading zero
                        alt_id = f"{match.group(1)}0{match.group(2)}{match.group(3)}"
                        if alt_id in db_sets:
                            auto_mapped_to = alt_id
                            auto_mapped_count += 1
                        else:
                            needs_manual_count += 1
                    else:
                        needs_manual_count += 1
            else:
                needs_manual_count += 1
            
            mappings[group_id] = {
                'name': group_name,
                'auto_mapped_to': auto_mapped_to,
                'manual_set_id': '',
                'skip': False
            }
        
        # Save mappings to file
        mapping_file = 'manual_mappings.json'
        with open(mapping_file, 'w') as f:
            json.dump(mappings, f, indent=2)
        
        # Display summary
        console.print(f"\n[green]✓ Generated {mapping_file}[/green]")
        console.print(f"Total TCGCSV groups: [blue]{len(groups)}[/blue]")
        console.print(f"Auto-mapped: [green]{auto_mapped_count}[/green]")
        console.print(f"Needs manual mapping: [yellow]{needs_manual_count}[/yellow]")
        
        if needs_manual_count > 0:
            console.print("\n[yellow]Next steps:[/yellow]")
            console.print("1. Edit manual_mappings.json")
            console.print("2. For unmapped sets, add the correct set ID to 'manual_set_id'")
            console.print("3. To skip a set, leave 'manual_set_id' as empty string")
            console.print("4. Run: python backfill_pokemon_data.py --sync-tcgplayer")
            
            # Show some examples of unmapped sets
            console.print("\n[yellow]Examples of sets needing manual mapping:[/yellow]")
            count = 0
            for group_id, data in mappings.items():
                if not data['auto_mapped_to'] and count < 5:
                    console.print(f"  {data['name']} (Group ID: {group_id})")
                    count += 1
    
    def sync_tcgplayer_data(self, dry_run: bool = False):
        """Sync TCGPlayer data from manual mappings file"""
        mapping_file = 'manual_mappings.json'
        
        # Check if mapping file exists
        if not os.path.exists(mapping_file):
            console.print(f"[red]Mapping file {mapping_file} not found. Run --check-tcgplayer first.[/red]")
            return
        
        # Load mappings
        with open(mapping_file, 'r') as f:
            mappings = json.load(f)
        
        # Process mappings
        updates = []
        skipped = 0
        
        for group_id, data in mappings.items():
            # Determine which set ID to use
            set_id = None
            if data['manual_set_id']:
                set_id = data['manual_set_id']
            elif data['auto_mapped_to']:
                set_id = data['auto_mapped_to']
            
            # Skip if no mapping or explicitly skipped
            if not set_id:
                skipped += 1
                continue
            
            # Generate TCGPlayer URL
            tcgplayer_url = self.generate_tcgplayer_url(data['name'])
            
            updates.append({
                'set_id': set_id,
                'group_id': int(group_id),
                'tcgplayer_url': tcgplayer_url,
                'name': data['name']
            })
        
        # Display what will be updated
        if updates:
            table = Table(title="TCGPlayer Data to Sync")
            table.add_column("Set ID", style="cyan")
            table.add_column("TCGCSV Name", style="green")
            table.add_column("Group ID", justify="right")
            table.add_column("URL", style="blue", no_wrap=False)
            
            for update in updates[:10]:
                table.add_row(
                    update['set_id'],
                    update['name'],
                    str(update['group_id']),
                    update['tcgplayer_url']
                )
            
            if len(updates) > 10:
                table.add_row("...", f"... and {len(updates) - 10} more", "...", "...")
            
            console.print(table)
        
        console.print(f"\n[blue]Sets to update: {len(updates)}[/blue]")
        console.print(f"[yellow]Sets skipped: {skipped}[/yellow]")
        
        if not updates:
            console.print("[yellow]No sets to update![/yellow]")
            return
        
        if dry_run:
            console.print("\n[yellow]DRY RUN - No database changes made[/yellow]")
            return
        
        # Confirm before updating
        if input("\nUpdate database with TCGPlayer data? (y/N): ").lower() != 'y':
            console.print("[red]Sync cancelled[/red]")
            return
        
        # Update database
        success_count = 0
        error_count = 0
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Updating sets...", total=len(updates))
            
            for update in updates:
                try:
                    result = self.supabase.table('pokemon_sets').update({
                        'tcgplayer_group_id': update['group_id'],
                        'tcgplayer_url': update['tcgplayer_url'],
                        'updated_at': datetime.now().isoformat()
                    }).eq('id', update['set_id']).execute()
                    
                    success_count += 1
                except Exception as e:
                    console.print(f"[red]Error updating {update['set_id']}: {e}[/red]")
                    error_count += 1
                
                progress.advance(task)
        
        console.print(f"\n[green]✓ Successfully updated {success_count} sets[/green]")
        if error_count > 0:
            console.print(f"[red]Failed to update {error_count} sets[/red]")


def main():
    parser = argparse.ArgumentParser(description='Pokemon TCG Data Backfill Tool')
    parser.add_argument('--check-set', help='Check missing cards for a specific set')
    parser.add_argument('--check-all', action='store_true', help='Check all sets for missing cards')
    parser.add_argument('--backfill-set', help='Backfill missing cards for a specific set')
    parser.add_argument('--backfill-series-sets', action='store_true', help='Backfill missing series and sets')
    parser.add_argument('--backfill-all', action='store_true', help='Comprehensive backfill: series, sets, and all cards')
    parser.add_argument('--check-tcgplayer', action='store_true', help='Check and generate TCGPlayer mappings file')
    parser.add_argument('--sync-tcgplayer', action='store_true', help='Sync TCGPlayer data from mappings file')
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without inserting')
    
    args = parser.parse_args()
    
    if not any(vars(args).values()):
        parser.print_help()
        return
    
    backfiller = PokemonBackfiller()
    
    if args.check_set:
        missing = backfiller.check_missing_cards_in_set(args.check_set)
        if missing:
            table = Table(title=f"Missing cards in set {args.check_set}")
            table.add_column("ID", style="cyan")
            table.add_column("Local ID")
            table.add_column("Name", style="green")
            
            for card in missing[:20]:  # Show first 20
                table.add_row(card['id'], str(card['localId']), card['name'])
            
            if len(missing) > 20:
                table.add_row("...", "...", f"... and {len(missing) - 20} more")
            
            console.print(table)
    
    elif args.check_all:
        backfiller.check_all_sets()
    
    elif args.backfill_set:
        backfiller.backfill_set(args.backfill_set, dry_run=args.dry_run)
    
    elif args.backfill_series_sets:
        backfiller.backfill_series_and_sets()
    
    elif args.backfill_all:
        backfiller.backfill_all_data(dry_run=args.dry_run)
    
    elif args.check_tcgplayer:
        backfiller.check_tcgplayer_mappings()
    
    elif args.sync_tcgplayer:
        backfiller.sync_tcgplayer_data(dry_run=args.dry_run)


if __name__ == "__main__":
    main()