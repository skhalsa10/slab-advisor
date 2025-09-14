#!/usr/bin/env python3
"""
Pokemon Card and Product Price Update Script

This script updates Pokemon card and product prices from TCGCSV API into the Supabase database.
For each price entry, it tries to find the product ID in pokemon_products first, then pokemon_cards.
Unknown product IDs are logged to a file for human investigation.

Usage:
    python update_pokemon_prices.py --all
    python update_pokemon_prices.py --set <set_id>
    python update_pokemon_prices.py --all --dry-run
    python update_pokemon_prices.py --set sv10 --dry-run
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
        Returns: (table_name, record_id) or (None, None) if not found
        """
        # First, check pokemon_products table
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
            result = self.supabase.table('pokemon_cards')\
                .select('id, name')\
                .eq('tcgplayer_product_id', product_id)\
                .eq('set_id', set_id)\
                .execute()
            
            if result.data and len(result.data) > 0:
                return ('pokemon_cards', result.data[0]['id'])
        except Exception as e:
            console.print(f"[red]Error querying pokemon_cards: {e}[/red]")
        
        # Not found in either table
        return (None, None)
    
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
    
    def process_set_prices(self, set_info: Dict, dry_run: bool = False, force: bool = False) -> Dict[str, int]:
        """
        Process prices for a single set
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
        group_id = set_info['tcgplayer_group_id']
        
        console.print(f"\n[blue]Processing: {set_name}[/blue] (Set: {set_id}, Group: {group_id})")
        
        # Fetch prices from TCGCSV
        price_data = self.fetch_tcgcsv_prices(group_id)
        if not price_data:
            console.print(f"[yellow]No price data found for {set_name}[/yellow]")
            return stats
        
        console.print(f"Found [green]{len(price_data)}[/green] price entries")
        
        # Group price data by product ID
        price_by_product = {}
        for price_entry in price_data:
            product_id = price_entry.get('productId')
            if product_id:
                if product_id not in price_by_product:
                    price_by_product[product_id] = []
                price_by_product[product_id].append(price_entry)
        
        console.print(f"Unique product IDs: [blue]{len(price_by_product)}[/blue]")
        
        # Process each unique product ID
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            console=console
        ) as progress:
            task = progress.add_task("Processing prices...", total=len(price_by_product))
            
            for product_id, price_variants in price_by_product.items():
                progress.update(task, description=f"Processing product {product_id}...")
                
                # Find where this product exists in our database
                table, record_id = self.find_product_in_database(product_id, set_id)
                
                if table and record_id:
                    # Check if we should skip this update (updated recently) unless force is True
                    if not force and self.should_skip_update(table, record_id):
                        if not dry_run:
                            progress.update(task, description=f"[dim]Skipping {product_id} (recently updated)[/dim]")
                        if table == 'pokemon_cards':
                            stats['cards_skipped'] += 1
                        else:
                            stats['products_skipped'] += 1
                    else:
                        # Update the price data
                        success = self.update_price_data(table, record_id, price_variants, dry_run)
                        
                        if success:
                            if table == 'pokemon_cards':
                                stats['cards_updated'] += 1
                            else:
                                stats['products_updated'] += 1
                        else:
                            stats['errors'] += 1
                else:
                    # Product ID not found - log it
                    stats['unknown_products'] += 1
                    if set_id not in self.unknown_product_ids:
                        self.unknown_product_ids[set_id] = {
                            'set_name': set_name,
                            'product_ids': []
                        }
                    self.unknown_product_ids[set_id]['product_ids'].append({
                        'product_id': product_id,
                        'variants': price_variants
                    })
                
                progress.advance(task)
        
        # Display stats for this set
        cards_skipped = stats.get('cards_skipped', 0)
        products_skipped = stats.get('products_skipped', 0)
        console.print(f"[dim]  Cards: {stats['cards_updated']} updated, {cards_skipped} skipped | Products: {stats['products_updated']} updated, {products_skipped} skipped | Unknown: {stats['unknown_products']}, Errors: {stats['errors']}[/dim]")
        
        return stats
    
    def update_set_prices(self, set_id: str, dry_run: bool = False, force: bool = False):
        """Update prices for a specific set"""
        # Get set info
        try:
            result = self.supabase.table('pokemon_sets')\
                .select('id, name, tcgplayer_group_id')\
                .eq('id', set_id)\
                .execute()
            
            if not result.data:
                console.print(f"[red]Set {set_id} not found[/red]")
                return
            
            set_info = result.data[0]
            if not set_info['tcgplayer_group_id']:
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
        
        # Get all sets with TCGPlayer group IDs
        try:
            result = self.supabase.table('pokemon_sets')\
                .select('id, name, tcgplayer_group_id')\
                .not_.is_('tcgplayer_group_id', 'null')\
                .order('name')\
                .execute()
            
            sets = result.data
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