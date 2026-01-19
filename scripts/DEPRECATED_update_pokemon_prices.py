#!/usr/bin/env python3
"""
Pokemon Card and Product Price Update Script

This script updates Pokemon card and product prices from TCGCSV API into the Supabase database.
Now supports multi-group sets (e.g., main set + trainer galleries) using tcgplayer_groups JSONB column.
For each price entry, it tries to find the product ID in pokemon_products first, then pokemon_cards.
Unknown product IDs are logged to a file for human investigation.

Usage:
    python update_pokemon_prices.py --all
    python update_pokemon_prices.py --set <set_id>
    python update_pokemon_prices.py --all --dry-run
    python update_pokemon_prices.py --set sv10 --dry-run
    python update_pokemon_prices.py --set swsh11 --force  # Updates main set + trainer gallery prices
    python update_pokemon_prices.py --stats
"""

import os
import sys
import argparse
import requests
import json
from datetime import datetime, timezone
from typing import List, Dict, Optional, Set, Any
from dotenv import load_dotenv
from supabase import create_client, Client
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn

# Load environment variables
load_dotenv('../.env.local')

# Initialize console for pretty output
console = Console()

# TCGCSV API base URL
TCGCSV_API_BASE = "https://tcgcsv.com"


class PokemonPriceUpdater:
    def __init__(self):
        """Initialize the price updater with Supabase client"""
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            console.print("[red]Error: Missing Supabase credentials in .env.local[/red]")
            sys.exit(1)
            
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.unknown_product_ids = {}  # Track unknown product IDs by set
        console.print("[green]✓ Connected to Supabase[/green]")
    
    def fetch_tcgcsv_prices(self, group_id: int) -> Optional[List[Dict]]:
        """Fetch prices for a specific TCGPlayer group from TCGCSV"""
        try:
            url = f"{TCGCSV_API_BASE}/tcgplayer/3/{group_id}/prices"
            console.print(f"[dim]Fetching prices from: {url}[/dim]")
            
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            # The API might return different structures, handle both
            if isinstance(data, list):
                return data
            elif isinstance(data, dict) and 'results' in data:
                return data['results']
            elif isinstance(data, dict) and 'data' in data:
                return data['data']
            else:
                console.print(f"[yellow]Unexpected data structure for group {group_id}[/yellow]")
                return None
                
        except requests.exceptions.Timeout:
            console.print(f"[red]Timeout fetching prices for group {group_id}[/red]")
            return None
        except requests.exceptions.RequestException as e:
            console.print(f"[red]Error fetching prices for group {group_id}: {e}[/red]")
            return None
        except Exception as e:
            console.print(f"[red]Unexpected error fetching prices for group {group_id}: {e}[/red]")
            return None
    
    def find_product_in_database(self, product_id: int, set_id: str) -> tuple[str, str]:
        """
        Try to find the product ID in the database
        Checks both legacy single tcgplayer_product_id and new tcgplayer_products JSON array
        Returns: (table_name, record_id) or (None, None) if not found
        """
        # First, check pokemon_products table (legacy single product ID only)
        try:
            result = self.supabase.table('pokemon_products')\
                .select('id, name')\
                .eq('tcgplayer_product_id', product_id)\
                .eq('pokemon_set_id', set_id)\
                .execute()

            if result.data and len(result.data) > 0:
                return ('pokemon_products', result.data[0]['id'])

        except Exception as e:
            console.print(f"[red]Error querying pokemon_products: {e}[/red]")

        # Next, check pokemon_cards table
        try:
            # Check legacy single product ID field
            result = self.supabase.table('pokemon_cards')\
                .select('id, name')\
                .eq('tcgplayer_product_id', product_id)\
                .eq('set_id', set_id)\
                .execute()

            if result.data and len(result.data) > 0:
                return ('pokemon_cards', result.data[0]['id'])

            # Check new tcgplayer_products JSON array for product ID
            result = self.supabase.table('pokemon_cards')\
                .select('id, name, tcgplayer_products')\
                .eq('set_id', set_id)\
                .not_.is_('tcgplayer_products', 'null')\
                .execute()

            if result.data:
                for record in result.data:
                    tcgplayer_products = record.get('tcgplayer_products')
                    if tcgplayer_products and self._product_id_in_array(product_id, tcgplayer_products):
                        return ('pokemon_cards', record['id'])

        except Exception as e:
            console.print(f"[red]Error querying pokemon_cards: {e}[/red]")

        # Not found in either table
        return (None, None)
    
    def _product_id_in_array(self, product_id: int, tcgplayer_products) -> bool:
        """
        Check if product_id exists in tcgplayer_products array
        Handles both JSON string and parsed array formats
        """
        try:
            # Parse JSON string if needed
            if isinstance(tcgplayer_products, str):
                import json
                products_array = json.loads(tcgplayer_products)
            else:
                products_array = tcgplayer_products

            # Check if it's a list and contains objects with product_id
            if isinstance(products_array, list):
                for product in products_array:
                    if isinstance(product, dict) and product.get('product_id') == product_id:
                        return True

            return False
        except (json.JSONDecodeError, TypeError, AttributeError):
            return False

    def should_skip_update(self, table: str, record_id: str, hours: int = 24) -> bool:
        """
        Check if a record was recently updated (within specified hours)
        Returns True if should skip, False if should update
        """
        try:
            # Calculate the cutoff time
            from datetime import timedelta
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
            
            # Query for the last update time
            if table == 'pokemon_cards':
                result = self.supabase.table('pokemon_cards')\
                    .select('price_last_updated')\
                    .eq('id', record_id)\
                    .execute()
            elif table == 'pokemon_products':
                result = self.supabase.table('pokemon_products')\
                    .select('price_last_updated')\
                    .eq('id', record_id)\
                    .execute()
            else:
                return False  # Unknown table, don't skip
            
            if result.data and len(result.data) > 0:
                last_updated_str = result.data[0].get('price_last_updated')
                if last_updated_str:
                    try:
                        # Handle different timestamp formats from Supabase
                        # Remove 'Z' if present and replace with '+00:00'
                        timestamp_str = last_updated_str.replace('Z', '+00:00')

                        # Handle microseconds with varying precision (Supabase sometimes returns 5 or 6 digits)
                        # Split at the '+' to separate timestamp from timezone
                        if '+' in timestamp_str:
                            time_part, tz_part = timestamp_str.rsplit('+', 1)
                            # If there's a decimal point, ensure microseconds have exactly 6 digits
                            if '.' in time_part:
                                date_part, micro_part = time_part.rsplit('.', 1)
                                # Pad or truncate microseconds to 6 digits
                                micro_part = micro_part.ljust(6, '0')[:6]
                                timestamp_str = f"{date_part}.{micro_part}+{tz_part}"

                        # Parse the timestamp
                        last_updated = datetime.fromisoformat(timestamp_str)

                        # Check if it's recent
                        if last_updated > cutoff_time:
                            return True  # Skip this update
                    except ValueError as e:
                        # If parsing fails, log it but continue with the update
                        console.print(f"[yellow]Warning: Could not parse timestamp '{last_updated_str}': {e}[/yellow]")
                        return False
            
            return False  # Need to update
            
        except Exception as e:
            console.print(f"[yellow]Warning: Could not check last update time for {table}/{record_id}: {e}[/yellow]")
            return False  # If we can't check, perform the update
    
    def update_price_data(self, table: str, record_id: str, new_price_data: List[Dict], dry_run: bool = False) -> bool:
        """
        Update the price_data JSON for a specific record
        Intelligently merges new price data with existing data
        """
        if dry_run:
            console.print(f"[yellow]DRY RUN: Would update {table}/{record_id} with {len(new_price_data)} price variants[/yellow]")
            return True
        
        try:
            # For now, we'll overwrite the entire price_data
            # In the future, we could merge based on timestamps
            update_data = {
                'price_data': json.dumps(new_price_data),
                'price_last_updated': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
            
            if table == 'pokemon_cards':
                result = self.supabase.table('pokemon_cards')\
                    .update(update_data)\
                    .eq('id', record_id)\
                    .execute()
            elif table == 'pokemon_products':
                result = self.supabase.table('pokemon_products')\
                    .update(update_data)\
                    .eq('id', record_id)\
                    .execute()
            else:
                console.print(f"[red]Unknown table: {table}[/red]")
                return False
            
            return len(result.data) > 0
        except Exception as e:
            console.print(f"[red]Error updating {table}/{record_id}: {e}[/red]")
            return False
    
    def extract_all_product_ids_from_card(self, card: Dict) -> List[int]:
        """
        Extract all product IDs from a card record
        Handles both legacy tcgplayer_product_id and new tcgplayer_products array
        Returns deduplicated list of product IDs
        """
        product_ids = set()

        # Check legacy single product ID
        if card.get('tcgplayer_product_id'):
            product_ids.add(card['tcgplayer_product_id'])

        # Check new tcgplayer_products array
        tcgplayer_products = card.get('tcgplayer_products')
        if tcgplayer_products:
            try:
                # Parse JSON string if needed
                if isinstance(tcgplayer_products, str):
                    import json
                    products_array = json.loads(tcgplayer_products)
                else:
                    products_array = tcgplayer_products

                # Extract product_id from each product in the array
                if isinstance(products_array, list):
                    for product in products_array:
                        if isinstance(product, dict) and product.get('product_id'):
                            product_ids.add(product['product_id'])
            except (json.JSONDecodeError, TypeError, AttributeError):
                pass

        return list(product_ids)

    def get_variant_pattern_for_product(self, product_id: int, tcgplayer_products) -> str:
        """
        Get the variant pattern (base, poke_ball, master_ball) for a specific product ID
        from the tcgplayer_products array
        """
        if not tcgplayer_products:
            return "base"  # Default to base pattern

        try:
            # Parse JSON string if needed
            if isinstance(tcgplayer_products, str):
                products_array = json.loads(tcgplayer_products)
            else:
                products_array = tcgplayer_products

            # Find the product with matching product_id
            if isinstance(products_array, list):
                for product in products_array:
                    if isinstance(product, dict) and product.get('product_id') == product_id:
                        variant_types = product.get('variant_types', [])

                        # Ensure variant_types is not None and is iterable
                        if variant_types is None:
                            variant_types = []

                        # Determine pattern based on variant_types
                        if 'poke_ball' in variant_types:
                            return 'poke_ball'
                        elif 'master_ball' in variant_types:
                            return 'master_ball'
                        else:
                            return 'base'

        except (json.JSONDecodeError, TypeError, AttributeError):
            pass

        return "base"  # Default fallback

    def process_set_prices(self, set_info: Dict, dry_run: bool = False, force: bool = False) -> Dict[str, int]:
        """
        Process prices for a single set (now supports multiple TCGPlayer groups)
        New approach: Process by card to prevent variant overwriting
        Returns statistics about the processing
        """
        stats = {
            'cards_updated': 0,
            'products_updated': 0,
            'cards_skipped': 0,
            'products_skipped': 0,
            'unknown_products': 0,
            'errors': 0
        }

        set_id = set_info['id']
        set_name = set_info['name']

        # Get group IDs (either from new multi-group support or legacy single group)
        group_ids = set_info.get('group_ids', [])
        if not group_ids and set_info.get('tcgplayer_group_id'):
            group_ids = [set_info['tcgplayer_group_id']]

        console.print(f"\n[blue]Processing: {set_name}[/blue] (Set: {set_id}, Groups: {group_ids})")

        # Fetch prices from TCGCSV for ALL groups
        all_price_data = []
        for group_id in group_ids:
            console.print(f"[dim]Fetching prices for group {group_id}...[/dim]")
            price_data = self.fetch_tcgcsv_prices(group_id)
            if price_data:
                all_price_data.extend(price_data)
                console.print(f"[green]  Found {len(price_data)} price entries from group {group_id}[/green]")

        if not all_price_data:
            console.print(f"[yellow]No price data found for {set_name} across {len(group_ids)} groups[/yellow]")
            return stats

        console.print(f"Found [green]{len(all_price_data)}[/green] total price entries across {len(group_ids)} groups")
        price_data = all_price_data  # Use combined price data from all groups

        # Group price data by product ID
        price_by_product = {}
        for price_entry in price_data:
            product_id = price_entry.get('productId')
            if product_id:
                if product_id not in price_by_product:
                    price_by_product[product_id] = []
                price_by_product[product_id].append(price_entry)

        console.print(f"Unique product IDs: [blue]{len(price_by_product)}[/blue]")

        # Get all cards in this set (with their product IDs)
        try:
            cards_result = self.supabase.table('pokemon_cards')\
                .select('id, name, tcgplayer_product_id, tcgplayer_products')\
                .eq('set_id', set_id)\
                .execute()

            cards = cards_result.data
        except Exception as e:
            console.print(f"[red]Error fetching cards for set {set_id}: {e}[/red]")
            return stats

        if not cards:
            console.print(f"[yellow]No cards found for set {set_id}[/yellow]")
            return stats

        console.print(f"Found [blue]{len(cards)}[/blue] cards in set")

        # Also handle pokemon_products (legacy approach for products)
        try:
            products_result = self.supabase.table('pokemon_products')\
                .select('id, name, tcgplayer_product_id')\
                .eq('pokemon_set_id', set_id)\
                .not_.is_('tcgplayer_product_id', 'null')\
                .execute()

            products = products_result.data
        except Exception as e:
            console.print(f"[red]Error fetching products for set {set_id}: {e}[/red]")
            products = []

        total_items = len(cards) + len(products)

        # Process each card and product
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            console=console
        ) as progress:
            task = progress.add_task("Processing cards and products...", total=total_items)

            # Process cards (new approach - collect all variant prices per card)
            for card in cards:
                progress.update(task, description=f"Processing card {card['name']}...")

                # Extract all product IDs for this card
                card_product_ids = self.extract_all_product_ids_from_card(card)

                if not card_product_ids:
                    progress.advance(task)
                    continue

                # Check if we should skip this update (unless force is True)
                if not force and self.should_skip_update('pokemon_cards', card['id']):
                    stats['cards_skipped'] += 1
                    progress.advance(task)
                    continue

                # Collect all price variants for this card
                all_card_prices = []
                found_products = 0

                for product_id in card_product_ids:
                    if product_id in price_by_product:
                        # Get the variant pattern for this product
                        variant_pattern = self.get_variant_pattern_for_product(
                            product_id, card.get('tcgplayer_products')
                        )

                        # Add variant_pattern to each price entry for this product
                        product_prices = price_by_product[product_id]
                        for price_entry in product_prices:
                            price_entry_with_pattern = price_entry.copy()
                            price_entry_with_pattern['variant_pattern'] = variant_pattern
                            all_card_prices.append(price_entry_with_pattern)

                        found_products += 1
                        # Remove from price_by_product to free memory
                        price_by_product.pop(product_id, None)

                # Update card with all its variant prices
                if all_card_prices:
                    success = self.update_price_data('pokemon_cards', card['id'], all_card_prices, dry_run)

                    if success:
                        stats['cards_updated'] += 1
                    else:
                        stats['errors'] += 1
                elif found_products == 0:
                    # None of this card's products had prices
                    for product_id in card_product_ids:
                        stats['unknown_products'] += 1
                        if set_id not in self.unknown_product_ids:
                            self.unknown_product_ids[set_id] = {
                                'set_name': set_name,
                                'product_ids': []
                            }
                        self.unknown_product_ids[set_id]['product_ids'].append({
                            'product_id': product_id,
                            'variants': [],
                            'card_name': card['name']
                        })

                progress.advance(task)

            # Process remaining products (legacy single product approach)
            for product in products:
                progress.update(task, description=f"Processing product {product['name']}...")

                product_id = product['tcgplayer_product_id']

                if product_id in price_by_product:
                    # Check if we should skip this update (unless force is True)
                    if not force and self.should_skip_update('pokemon_products', product['id']):
                        stats['products_skipped'] += 1
                    else:
                        # Update the price data
                        success = self.update_price_data('pokemon_products', product['id'],
                                                       price_by_product[product_id], dry_run)

                        if success:
                            stats['products_updated'] += 1
                        else:
                            stats['errors'] += 1

                    # Remove from price_by_product to free memory
                    price_by_product.pop(product_id, None)
                else:
                    # Product ID not found in prices
                    stats['unknown_products'] += 1
                    if set_id not in self.unknown_product_ids:
                        self.unknown_product_ids[set_id] = {
                            'set_name': set_name,
                            'product_ids': []
                        }
                    self.unknown_product_ids[set_id]['product_ids'].append({
                        'product_id': product_id,
                        'variants': [],
                        'product_name': product['name']
                    })

                progress.advance(task)

        # Any remaining product IDs in price_by_product are truly unknown
        for product_id, variants in price_by_product.items():
            stats['unknown_products'] += 1
            if set_id not in self.unknown_product_ids:
                self.unknown_product_ids[set_id] = {
                    'set_name': set_name,
                    'product_ids': []
                }
            self.unknown_product_ids[set_id]['product_ids'].append({
                'product_id': product_id,
                'variants': variants
            })

        # Display stats for this set
        cards_skipped = stats.get('cards_skipped', 0)
        products_skipped = stats.get('products_skipped', 0)
        console.print(f"[dim]  Cards: {stats['cards_updated']} updated, {cards_skipped} skipped | Products: {stats['products_updated']} updated, {products_skipped} skipped | Unknown: {stats['unknown_products']}, Errors: {stats['errors']}[/dim]")

        return stats
    
    def update_set_prices(self, set_id: str, dry_run: bool = False, force: bool = False):
        """Update prices for a specific set"""
        # Get set info including new tcgplayer_groups JSONB column
        try:
            result = self.supabase.table('pokemon_sets')\
                .select('id, name, tcgplayer_group_id, tcgplayer_groups')\
                .eq('id', set_id)\
                .execute()

            if not result.data:
                console.print(f"[red]Set {set_id} not found[/red]")
                return

            set_info = result.data[0]

            # Check for groups in new JSONB column first, fall back to legacy field
            tcgplayer_groups = set_info.get('tcgplayer_groups')
            if tcgplayer_groups:
                # Extract group IDs from JSONB array
                group_ids = []
                if isinstance(tcgplayer_groups, list):
                    for group in tcgplayer_groups:
                        if isinstance(group, dict) and group.get('groupId'):
                            group_ids.append(group['groupId'])

                if not group_ids:
                    console.print(f"[yellow]Set {set_id} has no valid TCGPlayer group IDs in tcgplayer_groups[/yellow]")
                    return

                # Add group_ids to set_info for processing
                set_info['group_ids'] = group_ids
                console.print(f"[green]Found {len(group_ids)} TCGPlayer groups for {set_id}: {group_ids}[/green]")

            elif set_info.get('tcgplayer_group_id'):
                # Fall back to legacy single group ID
                set_info['group_ids'] = [set_info['tcgplayer_group_id']]
                console.print(f"[yellow]Using legacy tcgplayer_group_id for {set_id}[/yellow]")
            else:
                console.print(f"[yellow]Set {set_id} has no TCGPlayer group ID[/yellow]")
                return
                
        except Exception as e:
            console.print(f"[red]Error fetching set info: {e}[/red]")
            return
        
        stats = self.process_set_prices(set_info, dry_run, force)
        
        # Display results
        console.print(f"\n[bold]Results for {set_info['name']}:[/bold]")
        console.print(f"Cards updated: [green]{stats['cards_updated']}[/green]")
        console.print(f"Cards skipped (recent): [blue]{stats.get('cards_skipped', 0)}[/blue]")
        console.print(f"Products updated: [green]{stats['products_updated']}[/green]")
        console.print(f"Products skipped (recent): [blue]{stats.get('products_skipped', 0)}[/blue]")
        console.print(f"Unknown product IDs: [yellow]{stats['unknown_products']}[/yellow]")
        console.print(f"Errors: [red]{stats['errors']}[/red]")
        
        if dry_run:
            console.print("\n[yellow]DRY RUN - No database changes were made[/yellow]")
        
        # Save unknown product IDs if any
        if self.unknown_product_ids:
            self.save_unknown_product_ids()
    
    def update_all_prices(self, dry_run: bool = False, force: bool = False):
        """Update prices for all sets with TCGPlayer group IDs"""
        console.print("\n[bold]Starting comprehensive price update...[/bold]")

        # Get all sets with TCGPlayer group IDs (check both new and legacy fields)
        try:
            result = self.supabase.table('pokemon_sets')\
                .select('id, name, tcgplayer_group_id, tcgplayer_groups')\
                .order('name')\
                .execute()

            # Filter sets that have either tcgplayer_groups or tcgplayer_group_id
            sets = []
            for set_data in result.data:
                if set_data.get('tcgplayer_groups') or set_data.get('tcgplayer_group_id'):
                    # Extract group IDs similar to update_set_prices
                    tcgplayer_groups = set_data.get('tcgplayer_groups')
                    if tcgplayer_groups:
                        group_ids = []
                        if isinstance(tcgplayer_groups, list):
                            for group in tcgplayer_groups:
                                if isinstance(group, dict) and group.get('groupId'):
                                    group_ids.append(group['groupId'])
                        if group_ids:
                            set_data['group_ids'] = group_ids
                            sets.append(set_data)
                    elif set_data.get('tcgplayer_group_id'):
                        set_data['group_ids'] = [set_data['tcgplayer_group_id']]
                        sets.append(set_data)

        except Exception as e:
            console.print(f"[red]Error fetching sets: {e}[/red]")
            return
        
        if not sets:
            console.print("[red]No sets with TCGPlayer group IDs found[/red]")
            return
        
        console.print(f"Found [blue]{len(sets)}[/blue] sets with TCGPlayer group IDs")
        
        # Initialize totals
        total_stats = {
            'cards_updated': 0,
            'products_updated': 0,
            'cards_skipped': 0,
            'products_skipped': 0,
            'unknown_products': 0,
            'errors': 0
        }
        
        # Process each set
        for set_info in sets:
            stats = self.process_set_prices(set_info, dry_run, force)
            
            # Add to totals (safely handle missing keys)
            for key in total_stats:
                total_stats[key] += stats.get(key, 0)
        
        # Display final results
        console.print(f"\n[bold]Final Results:[/bold]")
        console.print(f"Sets processed: [blue]{len(sets)}[/blue]")
        console.print(f"Cards updated: [green]{total_stats['cards_updated']}[/green]")
        console.print(f"Cards skipped (recent): [blue]{total_stats['cards_skipped']}[/blue]")
        console.print(f"Products updated: [green]{total_stats['products_updated']}[/green]")
        console.print(f"Products skipped (recent): [blue]{total_stats['products_skipped']}[/blue]")
        console.print(f"Unknown product IDs: [yellow]{total_stats['unknown_products']}[/yellow]")
        console.print(f"Errors: [red]{total_stats['errors']}[/red]")
        
        if dry_run:
            console.print("\n[yellow]DRY RUN - No database changes were made[/yellow]")
        else:
            console.print(f"\n[green]✓ Price update completed successfully![/green]")
        
        # Save unknown product IDs if any
        if self.unknown_product_ids:
            self.save_unknown_product_ids()
    
    def save_unknown_product_ids(self):
        """Save unknown product IDs to a JSON file for investigation"""
        filename = 'unknown_product_ids.json'

        # Add timestamp to the data itself for reference
        data_with_timestamp = {
            'last_updated': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'product_ids': self.unknown_product_ids
        }

        with open(filename, 'w') as f:
            json.dump(data_with_timestamp, f, indent=2)

        console.print(f"\n[yellow]Unknown product IDs saved to {filename}[/yellow]")
        console.print(f"[yellow]Total unknown products: {sum(len(data['product_ids']) for data in self.unknown_product_ids.values())}[/yellow]")
        
        # Show a sample
        sample_count = 0
        for set_id, data in self.unknown_product_ids.items():
            if sample_count >= 3:
                break
            console.print(f"  {data['set_name']}: {len(data['product_ids'])} unknown products")
            for product in data['product_ids'][:2]:
                variant_names = [v.get('subTypeName', 'Unknown') for v in product['variants']]
                console.print(f"    Product ID {product['product_id']}: {', '.join(variant_names)}")
            sample_count += 1
    
    def show_price_stats(self):
        """Show statistics about current price data"""
        console.print("\n[bold]Current Price Statistics:[/bold]")
        
        try:
            # Cards statistics
            total_cards_result = self.supabase.table('pokemon_cards')\
                .select('id', count='exact')\
                .execute()
            total_cards = total_cards_result.count
            
            cards_with_price_result = self.supabase.table('pokemon_cards')\
                .select('id', count='exact')\
                .not_.is_('price_data', 'null')\
                .execute()
            cards_with_price = cards_with_price_result.count
            
            cards_with_tcgplayer_result = self.supabase.table('pokemon_cards')\
                .select('id', count='exact')\
                .not_.is_('tcgplayer_product_id', 'null')\
                .execute()
            cards_with_tcgplayer = cards_with_tcgplayer_result.count
            
            # Products statistics
            total_products_result = self.supabase.table('pokemon_products')\
                .select('id', count='exact')\
                .execute()
            total_products = total_products_result.count
            
            products_with_price_result = self.supabase.table('pokemon_products')\
                .select('id', count='exact')\
                .not_.is_('price_data', 'null')\
                .execute()
            products_with_price = products_with_price_result.count
            
            products_with_tcgplayer_result = self.supabase.table('pokemon_products')\
                .select('id', count='exact')\
                .not_.is_('tcgplayer_product_id', 'null')\
                .execute()
            products_with_tcgplayer = products_with_tcgplayer_result.count
            
            # Recent updates (last 24 hours)
            from datetime import timedelta
            yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
            
            recent_cards_result = self.supabase.table('pokemon_cards')\
                .select('id', count='exact')\
                .gte('price_last_updated', yesterday)\
                .execute()
            recent_cards = recent_cards_result.count
            
            recent_products_result = self.supabase.table('pokemon_products')\
                .select('id', count='exact')\
                .gte('price_last_updated', yesterday)\
                .execute()
            recent_products = recent_products_result.count
            
            # Create tables
            table = Table(title="Price Data Statistics")
            table.add_column("Category", style="cyan")
            table.add_column("Metric", style="white")
            table.add_column("Count", justify="right", style="green")
            table.add_column("Percentage", justify="right", style="yellow")
            
            # Cards section
            table.add_row("[bold]Cards[/bold]", "Total", str(total_cards), "100%")
            table.add_row("", "With TCGPlayer IDs", str(cards_with_tcgplayer), 
                         f"{(cards_with_tcgplayer/total_cards*100):.1f}%" if total_cards > 0 else "0%")
            table.add_row("", "With prices", str(cards_with_price), 
                         f"{(cards_with_price/total_cards*100):.1f}%" if total_cards > 0 else "0%")
            table.add_row("", "Updated (24h)", str(recent_cards), 
                         f"{(recent_cards/total_cards*100):.1f}%" if total_cards > 0 else "0%")
            
            # Separator
            table.add_row("", "", "", "")
            
            # Products section
            table.add_row("[bold]Products[/bold]", "Total", str(total_products), "100%")
            table.add_row("", "With TCGPlayer IDs", str(products_with_tcgplayer), 
                         f"{(products_with_tcgplayer/total_products*100):.1f}%" if total_products > 0 else "0%")
            table.add_row("", "With prices", str(products_with_price), 
                         f"{(products_with_price/total_products*100):.1f}%" if total_products > 0 else "0%")
            table.add_row("", "Updated (24h)", str(recent_products), 
                         f"{(recent_products/total_products*100):.1f}%" if total_products > 0 else "0%")
            
            console.print(table)
            
        except Exception as e:
            console.print(f"[red]Error fetching statistics: {e}[/red]")
    
    def show_sample_prices(self, set_id: str = None, limit: int = 5):
        """Show sample price data to verify JSON structure"""
        console.print(f"\n[bold]Sample Price Data:[/bold]")
        
        try:
            # Build query for cards
            query = self.supabase.table('pokemon_cards')\
                .select('id, name, price_data, price_last_updated')\
                .not_.is_('price_data', 'null')\
                .limit(limit)
            
            if set_id:
                query = query.eq('set_id', set_id)
                console.print(f"Set: [cyan]{set_id}[/cyan]")
            
            cards_result = query.execute()
            
            if cards_result.data:
                console.print("\n[cyan]Sample Cards with Prices:[/cyan]")
                for card in cards_result.data:
                    console.print(f"\n[green]{card['name']}[/green] (ID: {card['id']})")
                    console.print(f"  Last updated: {card['price_last_updated']}")
                    
                    if card['price_data']:
                        price_data = json.loads(card['price_data']) if isinstance(card['price_data'], str) else card['price_data']
                        for variant in price_data:
                            variant_type = variant.get('subTypeName', 'Unknown')
                            market = variant.get('marketPrice', 'N/A')
                            low = variant.get('lowPrice', 'N/A')
                            high = variant.get('highPrice', 'N/A')
                            console.print(f"  [yellow]{variant_type}:[/yellow] Market: ${market}, Low: ${low}, High: ${high}")
            
            # Build query for products
            query = self.supabase.table('pokemon_products')\
                .select('id, name, price_data, price_last_updated')\
                .not_.is_('price_data', 'null')\
                .limit(limit)
            
            if set_id:
                query = query.eq('pokemon_set_id', set_id)
            
            products_result = query.execute()
            
            if products_result.data:
                console.print("\n[cyan]Sample Products with Prices:[/cyan]")
                for product in products_result.data:
                    console.print(f"\n[green]{product['name']}[/green] (ID: {product['id']})")
                    console.print(f"  Last updated: {product['price_last_updated']}")
                    
                    if product['price_data']:
                        price_data = json.loads(product['price_data']) if isinstance(product['price_data'], str) else product['price_data']
                        for variant in price_data:
                            variant_type = variant.get('subTypeName', 'Unknown')
                            market = variant.get('marketPrice', 'N/A')
                            low = variant.get('lowPrice', 'N/A')
                            high = variant.get('highPrice', 'N/A')
                            console.print(f"  [yellow]{variant_type}:[/yellow] Market: ${market}, Low: ${low}, High: ${high}")
                    
        except Exception as e:
            console.print(f"[red]Error fetching sample data: {e}[/red]")


def main():
    parser = argparse.ArgumentParser(description='Pokemon Card and Product Price Update Tool')
    parser.add_argument('--set', help='Update prices for a specific set (e.g., sv10)')
    parser.add_argument('--all', action='store_true', help='Update prices for all sets')
    parser.add_argument('--stats', action='store_true', help='Show current price statistics')
    parser.add_argument('--sample', nargs='?', const='', help='Show sample price data (optional set_id)')
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without updating database')
    parser.add_argument('--force', action='store_true', help='Force update even if recently updated (ignore 24h skip rule)')
    
    args = parser.parse_args()
    
    if not any([args.set, args.all, args.stats, args.sample is not None]):
        parser.print_help()
        return
    
    updater = PokemonPriceUpdater()
    
    if args.stats:
        updater.show_price_stats()
    elif args.sample is not None:
        set_id = args.sample if args.sample else None
        updater.show_sample_prices(set_id=set_id)
    elif args.set:
        updater.update_set_prices(args.set, dry_run=args.dry_run, force=args.force)
    elif args.all:
        updater.update_all_prices(dry_run=args.dry_run, force=args.force)


if __name__ == "__main__":
    main()