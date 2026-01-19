#!/usr/bin/env python3
"""
Pokemon Product Price History Backfill & Daily Update Script

Backfills historical price data from TCGCSV archives into the
pokemon_product_price_history table, and supports daily updates.

Usage:
    # Backfill from local tcgCsvPrices/ folder
    python step5_backfill_product_price_history.py --backfill              # Full backfill
    python step5_backfill_product_price_history.py --backfill --dry-run    # Preview without inserts
    python step5_backfill_product_price_history.py --backfill --group-id 604  # Single group only
    python step5_backfill_product_price_history.py --backfill --date 2024-02-08  # Single date only

    # Daily update (downloads from TCGCSV, processes, then cleans up)
    python step5_backfill_product_price_history.py --daily                 # Process yesterday + today
    python step5_backfill_product_price_history.py --daily --dry-run       # Preview without download/insert
    python step5_backfill_product_price_history.py --daily --date 2026-01-18  # Specific date only
"""

import os
import sys
import json
import shutil
import argparse
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Set
from collections import defaultdict
from dotenv import load_dotenv
from supabase import create_client, Client
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn

# Load environment variables
load_dotenv('../.env.local')

# Initialize console for pretty output
console = Console()

# Constants
TCGCSV_PRICES_DIR = Path("tcgCsvPrices")
POKEMON_CATEGORY_ID = "3"


class ProductPriceHistoryBackfill:
    def __init__(self, dry_run: bool = False):
        """Initialize the backfill script"""
        self.dry_run = dry_run

        # Initialize Supabase
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

        if not supabase_url or not supabase_key:
            console.print("[red]ERROR: Missing Supabase credentials in .env.local[/red]")
            sys.exit(1)

        self.supabase: Client = create_client(supabase_url, supabase_key)
        console.print("[green]✓ Connected to Supabase[/green]")

        # Initialize stats
        self.stats = {
            'dates_processed': 0,
            'groups_processed': 0,
            'products_found': 0,
            'prices_inserted': 0,
            'prices_skipped': 0,
            'errors': 0
        }

        # Cache products by group_id for efficient lookups
        self.products_by_group: Dict[int, Dict[int, int]] = {}  # group_id -> {tcgplayer_product_id -> pokemon_product_id}

    def load_products(self, group_id: Optional[int] = None) -> None:
        """Load products from database, optionally filtered by group_id"""
        console.print("[blue]Loading products from database...[/blue]")

        try:
            query = self.supabase.table('pokemon_products').select('id, tcgplayer_product_id, tcgplayer_group_id')

            if group_id:
                query = query.eq('tcgplayer_group_id', group_id)

            result = query.execute()

            if not result.data:
                console.print("[yellow]No products found in database[/yellow]")
                return

            # Group products by tcgplayer_group_id
            for product in result.data:
                gid = product['tcgplayer_group_id']
                if gid not in self.products_by_group:
                    self.products_by_group[gid] = {}
                self.products_by_group[gid][product['tcgplayer_product_id']] = product['id']

            total_products = sum(len(p) for p in self.products_by_group.values())
            console.print(f"[green]✓ Loaded {total_products} products across {len(self.products_by_group)} groups[/green]")

        except Exception as e:
            console.print(f"[red]Error loading products: {e}[/red]")
            sys.exit(1)

    def get_available_dates(self) -> List[str]:
        """Get list of available date folders in TCGCSV archive"""
        if not TCGCSV_PRICES_DIR.exists():
            console.print(f"[red]TCGCSV prices directory not found: {TCGCSV_PRICES_DIR}[/red]")
            return []

        dates = []
        for item in sorted(TCGCSV_PRICES_DIR.iterdir()):
            if item.is_dir() and len(item.name) == 10:  # YYYY-MM-DD format
                try:
                    datetime.strptime(item.name, '%Y-%m-%d')
                    dates.append(item.name)
                except ValueError:
                    continue

        return dates

    def load_prices_file(self, date_str: str, group_id: int) -> Optional[List[Dict]]:
        """Load prices JSON file for a specific date and group"""
        prices_path = TCGCSV_PRICES_DIR / date_str / POKEMON_CATEGORY_ID / str(group_id) / "prices"

        if not prices_path.exists():
            return None

        try:
            with open(prices_path, 'r') as f:
                data = json.load(f)

            if data.get('success') and 'results' in data:
                return data['results']

            return None
        except Exception as e:
            console.print(f"[red]Error loading prices file {prices_path}: {e}[/red]")
            return None

    def insert_price_records(self, records: List[Dict]) -> int:
        """Insert price records into database, returns count of inserted records"""
        if not records:
            return 0

        if self.dry_run:
            return len(records)

        try:
            # Use upsert with ON CONFLICT to handle duplicates
            result = self.supabase.table('pokemon_product_price_history').upsert(
                records,
                on_conflict='tcgplayer_product_id,price_date'
            ).execute()

            return len(result.data) if result.data else 0
        except Exception as e:
            console.print(f"[red]Error inserting price records: {e}[/red]")
            self.stats['errors'] += 1
            return 0

    def process_date(self, date_str: str, target_group_id: Optional[int] = None) -> None:
        """Process all groups for a specific date"""
        groups_to_process = [target_group_id] if target_group_id else list(self.products_by_group.keys())

        for group_id in groups_to_process:
            if group_id not in self.products_by_group:
                continue

            products_in_group = self.products_by_group[group_id]
            prices_data = self.load_prices_file(date_str, group_id)

            if not prices_data:
                continue

            self.stats['groups_processed'] += 1

            # Build price records for products we care about
            records_to_insert = []

            for price_entry in prices_data:
                tcgplayer_product_id = price_entry.get('productId')

                if tcgplayer_product_id not in products_in_group:
                    continue

                self.stats['products_found'] += 1
                pokemon_product_id = products_in_group[tcgplayer_product_id]

                record = {
                    'pokemon_product_id': pokemon_product_id,
                    'tcgplayer_product_id': tcgplayer_product_id,
                    'market_price': price_entry.get('marketPrice'),
                    'low_price': price_entry.get('lowPrice'),
                    'mid_price': price_entry.get('midPrice'),
                    'high_price': price_entry.get('highPrice'),
                    'price_date': date_str
                }

                records_to_insert.append(record)

            # Batch insert
            if records_to_insert:
                inserted = self.insert_price_records(records_to_insert)
                self.stats['prices_inserted'] += inserted

    def run_backfill(self, target_group_id: Optional[int] = None, target_date: Optional[str] = None) -> None:
        """Run the backfill process"""
        console.print("\n[bold blue]Starting Price History Backfill[/bold blue]")

        if self.dry_run:
            console.print("[yellow]DRY RUN MODE - No database changes will be made[/yellow]")

        # Load products
        self.load_products(target_group_id)

        if not self.products_by_group:
            console.print("[red]No products to process[/red]")
            return

        # Get available dates
        if target_date:
            dates = [target_date]
        else:
            dates = self.get_available_dates()

        if not dates:
            console.print("[red]No dates available to process[/red]")
            return

        console.print(f"[blue]Processing {len(dates)} dates...[/blue]")

        # Process each date
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            console=console
        ) as progress:
            task = progress.add_task("Processing dates...", total=len(dates))

            for date_str in dates:
                progress.update(task, description=f"Processing {date_str}...")
                self.process_date(date_str, target_group_id)
                self.stats['dates_processed'] += 1
                progress.advance(task)

        self.print_summary()

    def print_summary(self) -> None:
        """Print backfill summary"""
        console.print("\n[bold]Summary:[/bold]")
        console.print(f"Dates processed: [blue]{self.stats['dates_processed']}[/blue]")
        console.print(f"Groups processed: [blue]{self.stats['groups_processed']}[/blue]")
        console.print(f"Products found: [blue]{self.stats['products_found']}[/blue]")
        console.print(f"Prices inserted: [green]{self.stats['prices_inserted']}[/green]")
        console.print(f"Errors: [red]{self.stats['errors']}[/red]")

        if self.dry_run:
            console.print("\n[yellow]DRY RUN - No database changes were made[/yellow]")

    # =========================================================================
    # Daily Update Methods
    # =========================================================================

    def check_archive_available(self, date_str: str) -> bool:
        """Check if TCGCSV archive exists for a specific date"""
        archive_url = f"https://tcgcsv.com/archive/tcgplayer/prices-{date_str}.ppmd.7z"
        result = subprocess.run(['curl', '-I', '-s', archive_url], capture_output=True, text=True)
        return 'HTTP/2 200' in result.stdout or 'HTTP/1.1 200' in result.stdout

    def download_archive(self, date_str: str) -> Optional[Path]:
        """Download TCGCSV price archive for a specific date"""
        archive_url = f"https://tcgcsv.com/archive/tcgplayer/prices-{date_str}.ppmd.7z"
        archive_path = Path(f"prices-{date_str}.ppmd.7z")

        console.print(f"[blue]Downloading {archive_url}...[/blue]")
        result = subprocess.run(
            ['curl', '-f', '-o', str(archive_path), archive_url],
            capture_output=True
        )

        if result.returncode != 0:
            console.print(f"[red]Failed to download archive: {result.stderr.decode()}[/red]")
            return None

        console.print(f"[green]✓ Downloaded {archive_path}[/green]")
        return archive_path

    def extract_archive(self, archive_path: Path) -> Optional[Path]:
        """Extract 7z archive to current directory"""
        console.print(f"[blue]Extracting {archive_path}...[/blue]")
        result = subprocess.run(
            ['7z', 'x', '-y', str(archive_path)],
            capture_output=True
        )

        if result.returncode != 0:
            console.print(f"[red]Failed to extract archive: {result.stderr.decode()}[/red]")
            return None

        # Return the extracted date folder path
        date_str = archive_path.stem.replace('prices-', '').replace('.ppmd', '')
        extracted_path = Path(date_str)

        console.print(f"[green]✓ Extracted to {extracted_path}[/green]")
        return extracted_path

    def load_prices_from_extracted(self, extracted_path: Path, group_id: int) -> Optional[List[Dict]]:
        """Load prices JSON from extracted archive (not tcgCsvPrices)"""
        prices_path = extracted_path / POKEMON_CATEGORY_ID / str(group_id) / "prices"

        if not prices_path.exists():
            return None

        try:
            with open(prices_path, 'r') as f:
                data = json.load(f)

            if data.get('success') and 'results' in data:
                return data['results']
            return None
        except Exception as e:
            console.print(f"[red]Error loading prices file {prices_path}: {e}[/red]")
            return None

    def process_extracted_date(self, extracted_path: Path, date_str: str) -> None:
        """Process all groups from an extracted archive folder"""
        for group_id in self.products_by_group.keys():
            products_in_group = self.products_by_group[group_id]
            prices_data = self.load_prices_from_extracted(extracted_path, group_id)

            if not prices_data:
                continue

            self.stats['groups_processed'] += 1

            # Build price records (same logic as existing process_date)
            records_to_insert = []
            for price_entry in prices_data:
                tcgplayer_product_id = price_entry.get('productId')

                if tcgplayer_product_id not in products_in_group:
                    continue

                self.stats['products_found'] += 1
                pokemon_product_id = products_in_group[tcgplayer_product_id]

                record = {
                    'pokemon_product_id': pokemon_product_id,
                    'tcgplayer_product_id': tcgplayer_product_id,
                    'market_price': price_entry.get('marketPrice'),
                    'low_price': price_entry.get('lowPrice'),
                    'mid_price': price_entry.get('midPrice'),
                    'high_price': price_entry.get('highPrice'),
                    'price_date': date_str
                }
                records_to_insert.append(record)

            if records_to_insert:
                inserted = self.insert_price_records(records_to_insert)
                self.stats['prices_inserted'] += inserted

    def cleanup_daily_files(self, archive_path: Optional[Path], extracted_path: Optional[Path]) -> None:
        """Remove downloaded archive and extracted folder"""
        if archive_path and archive_path.exists():
            archive_path.unlink()
            console.print(f"[green]✓ Deleted {archive_path}[/green]")

        if extracted_path and extracted_path.exists():
            shutil.rmtree(extracted_path)
            console.print(f"[green]✓ Deleted {extracted_path}/[/green]")

    def process_single_daily_date(self, date_str: str) -> bool:
        """Process a single date - download, extract, process, cleanup. Returns True if successful."""
        console.print(f"\n[bold cyan]Processing {date_str}...[/bold cyan]")

        archive_path = None
        extracted_path = None

        try:
            # Check if archive is available
            if not self.check_archive_available(date_str):
                console.print(f"[yellow]Archive for {date_str} not available, skipping[/yellow]")
                return False

            if self.dry_run:
                console.print(f"[yellow]DRY RUN - Would download and process {date_str}[/yellow]")
                return True

            # Download
            archive_path = self.download_archive(date_str)
            if not archive_path:
                return False

            # Extract
            extracted_path = self.extract_archive(archive_path)
            if not extracted_path:
                return False

            # Process prices from extracted folder
            self.process_extracted_date(extracted_path, date_str)
            self.stats['dates_processed'] += 1

            return True

        finally:
            # Always cleanup, even on error
            if not self.dry_run:
                self.cleanup_daily_files(archive_path, extracted_path)

    def run_daily(self, target_date: Optional[str] = None) -> None:
        """Run daily price update - process today and yesterday (or specific date if provided)"""
        console.print(f"\n[bold blue]Starting Daily Price Update[/bold blue]")

        if self.dry_run:
            console.print("[yellow]DRY RUN MODE - No downloads or database changes[/yellow]")

        # Load products first (needed for all dates)
        self.load_products()

        if not self.products_by_group:
            console.print("[red]No products to process[/red]")
            return

        # Determine which dates to process
        if target_date:
            # User specified a single date
            dates_to_process = [target_date]
        else:
            # Process yesterday and today
            today = datetime.now()
            yesterday = today - timedelta(days=1)
            dates_to_process = [
                yesterday.strftime('%Y-%m-%d'),
                today.strftime('%Y-%m-%d')
            ]

        console.print(f"[blue]Will process dates: {', '.join(dates_to_process)}[/blue]")

        # Process each date
        successful_dates = []
        for date_str in dates_to_process:
            if self.process_single_daily_date(date_str):
                successful_dates.append(date_str)

        # Summary
        console.print(f"\n[bold]Successfully processed: {', '.join(successful_dates) if successful_dates else 'None'}[/bold]")
        self.print_summary()


def main():
    """Entry point for the script"""
    parser = argparse.ArgumentParser(description='Pokemon Product Price History Backfill & Daily Update')
    parser.add_argument('--backfill', action='store_true', help='Run backfill from local tcgCsvPrices/ archives')
    parser.add_argument('--daily', action='store_true', help='Download and process daily prices (yesterday + today)')
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without inserting')
    parser.add_argument('--group-id', type=int, help='Process only a specific TCGPlayer group ID (backfill only)')
    parser.add_argument('--date', type=str, help='Process only a specific date (YYYY-MM-DD)')

    args = parser.parse_args()

    if not args.backfill and not args.daily:
        parser.print_help()
        console.print("\n[yellow]Use --backfill or --daily to run the script[/yellow]")
        return

    script = ProductPriceHistoryBackfill(dry_run=args.dry_run)

    try:
        if args.daily:
            script.run_daily(target_date=args.date)
        elif args.backfill:
            script.run_backfill(target_group_id=args.group_id, target_date=args.date)
    except KeyboardInterrupt:
        console.print("\n[red]Process interrupted by user[/red]")
    except Exception as e:
        console.print(f"\n[red]Fatal error: {e}[/red]")


if __name__ == "__main__":
    main()
