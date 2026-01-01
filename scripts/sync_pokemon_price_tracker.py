#!/usr/bin/env python3
"""
Pokemon Price Tracker API Sync Script

This script syncs price data from PokemonPriceTracker API to the pokemon_card_prices table.
It fetches cards by set using tcgplayer_set_id and populates:
- Current raw prices (market price, condition)
- PSA graded prices (psa10, psa9, psa8)
- Price history (sliced into 7d, 30d, 90d, 180d, 365d windows)
- Percent change calculations

Usage:
    python sync_pokemon_price_tracker.py --all
    python sync_pokemon_price_tracker.py --set <tcgplayer_set_id>
    python sync_pokemon_price_tracker.py --all --dry-run
    python sync_pokemon_price_tracker.py --stats

API Documentation: https://www.pokemonpricetracker.com/docs
"""

import os
import sys
import argparse
import requests
import json
import time
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional, Any
from dotenv import load_dotenv
from supabase import create_client, Client
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn

# Load environment variables
load_dotenv('../.env.local')

# Initialize console for pretty output
console = Console()

# PokemonPriceTracker API base URL
PPT_API_BASE = "https://www.pokemonpricetracker.com/api/v2"

# Rate limiting: wait 60 seconds between sets
SET_RATE_LIMIT_SECONDS = 60


class PokemonPriceTrackerSync:
    def __init__(self):
        """Initialize the sync with Supabase client and API key"""
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        self.api_key = os.getenv('POKEMON_PRICE_TRACKER_API_KEY')

        if not supabase_url or not supabase_key:
            console.print("[red]Error: Missing Supabase credentials in .env.local[/red]")
            sys.exit(1)

        if not self.api_key:
            console.print("[red]Error: Missing POKEMON_PRICE_TRACKER_API_KEY in .env.local[/red]")
            sys.exit(1)

        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.skipped_cards = {}  # Track skipped cards by set
        console.print("[green]✓ Connected to Supabase[/green]")
        console.print("[green]✓ PokemonPriceTracker API key loaded[/green]")

    def fetch_cards_for_set(self, tcgplayer_set_id: str) -> List[Dict]:
        """
        Fetch all cards for a set from PokemonPriceTracker API.
        Uses fetchAllInSet=true to get all cards. For sets with 200+ cards,
        pagination is handled via offset (only added after first request if hasMore=true).
        """
        all_cards = []
        offset = 0
        is_first_request = True

        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

        while True:
            # Base params - don't include offset on first request
            # Adding offset triggers pagination mode and limits to 50 cards per request
            params = {
                'language': 'english',
                'setId': tcgplayer_set_id,
                'includeHistory': 'true',
                'includeEbay': 'true',
                'includeBoth': 'true',
                'days': 365,
                'fetchAllInSet': 'true'
            }

            # Only add offset for subsequent requests (sets with 200+ cards)
            if not is_first_request:
                params['offset'] = offset

            try:
                url = f"{PPT_API_BASE}/cards"
                if is_first_request:
                    console.print(f"[dim]Fetching all cards for set {tcgplayer_set_id}...[/dim]")
                else:
                    console.print(f"[dim]Fetching more cards (offset={offset})...[/dim]")

                response = requests.get(url, headers=headers, params=params, timeout=120)
                response.raise_for_status()

                data = response.json()

                # Extract cards from response
                cards = data.get('data', [])
                metadata = data.get('metadata', {})
                total = metadata.get('total', 0)
                count = metadata.get('count', len(cards))
                has_more = metadata.get('hasMore', False)

                all_cards.extend(cards)

                console.print(f"[dim]  Fetched {len(cards)} cards (total so far: {len(all_cards)}/{total})[/dim]")

                # If no more pages, we're done
                if not has_more:
                    break

                # Prepare for next page
                is_first_request = False
                offset += count
                time.sleep(0.5)  # Small delay between pages

            except requests.exceptions.Timeout:
                console.print(f"[red]Timeout fetching cards for set {tcgplayer_set_id}[/red]")
                break
            except requests.exceptions.RequestException as e:
                console.print(f"[red]Error fetching cards: {e}[/red]")
                if hasattr(e, 'response') and e.response is not None:
                    console.print(f"[red]Response: {e.response.text}[/red]")
                break
            except Exception as e:
                console.print(f"[red]Unexpected error: {e}[/red]")
                break

        return all_cards

    def slice_history(self, price_history: Dict, days: int) -> Dict:
        """
        Slice price history to only include entries within the specified days.
        Input format: { "variants": { "Variant": { "Condition": { "history": [...] } } } }
        Output format: { "Variant": { "Condition": [...history entries...] } }
        """
        if not price_history:
            return {}

        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        result = {}

        variants = price_history.get('variants', {})
        for variant_name, conditions in variants.items():
            if not isinstance(conditions, dict):
                continue
            result[variant_name] = {}
            for condition_name, condition_data in conditions.items():
                if not isinstance(condition_data, dict):
                    continue
                history = condition_data.get('history', [])
                if not isinstance(history, list):
                    continue
                # Filter history entries by date
                filtered_history = []
                for entry in history:
                    try:
                        entry_date_str = entry.get('date', '')
                        if entry_date_str:
                            entry_date = datetime.fromisoformat(entry_date_str.replace('Z', '+00:00'))
                            if entry_date >= cutoff_date:
                                filtered_history.append({
                                    'date': entry_date_str,
                                    'market': entry.get('market'),
                                    'low': entry.get('low'),
                                    'mid': entry.get('mid'),
                                    'high': entry.get('high'),
                                    'volume': entry.get('volume')
                                })
                    except (ValueError, TypeError):
                        continue
                if filtered_history:
                    result[variant_name][condition_name] = filtered_history

        return result

    def calc_percent_change(self, history: List[Dict]) -> Optional[float]:
        """Calculate percent change from oldest to newest price in history."""
        if not history or len(history) < 2:
            return None

        # Sort by date to ensure correct order
        sorted_history = sorted(history, key=lambda x: x.get('date', ''))

        oldest_price = sorted_history[0].get('market')
        newest_price = sorted_history[-1].get('market')

        if oldest_price is None or newest_price is None or oldest_price == 0:
            return None

        return round(((newest_price - oldest_price) / oldest_price) * 100, 2)

    def get_primary_history(self, raw_history_365d: Dict) -> List[Dict]:
        """
        Get the primary history for percent change calculations.
        Prefers Normal > first variant, then Near Mint > first condition.
        """
        if not raw_history_365d:
            return []

        # Try Normal first, then fall back to first variant
        variant_name = 'Normal' if 'Normal' in raw_history_365d else next(iter(raw_history_365d), None)
        if not variant_name:
            return []

        conditions = raw_history_365d.get(variant_name, {})

        # Try Near Mint first, then fall back to first condition
        condition_name = 'Near Mint' if 'Near Mint' in conditions else next(iter(conditions), None)
        if not condition_name:
            return []

        return conditions.get(condition_name, [])

    def get_market_price_condition(self, prices: Dict) -> tuple[Optional[float], Optional[str]]:
        """
        Extract the market price and condition from the prices object.
        Returns (market_price, condition_name)
        """
        market_price = prices.get('market')

        # Find the first condition with a market price
        conditions = prices.get('conditions', {})
        for condition_name, condition_data in conditions.items():
            if isinstance(condition_data, dict) and condition_data.get('market'):
                return (market_price, condition_name)

        return (market_price, 'Near Mint')  # Default to Near Mint if no condition found

    def transform_card_to_price_record(self, card: Dict, our_card_id: str) -> Dict:
        """
        Transform a PokemonPriceTracker API card response to a pokemon_card_prices record.
        """
        # Extract tcgplayer_product_id
        tcgplayer_product_id = card.get('tcgPlayerId')
        if tcgplayer_product_id:
            try:
                tcgplayer_product_id = int(tcgplayer_product_id)
            except (ValueError, TypeError):
                tcgplayer_product_id = None

        # Extract prices
        prices = card.get('prices', {})
        market_price, condition = self.get_market_price_condition(prices)

        # Extract PSA graded data
        ebay = card.get('ebay', {})
        sales_by_grade = ebay.get('salesByGrade', {})

        psa10 = sales_by_grade.get('psa10')
        psa9 = sales_by_grade.get('psa9')
        psa8 = sales_by_grade.get('psa8')

        # Extract eBay price history (for PSA grades)
        ebay_price_history = ebay.get('priceHistory')

        # Slice raw price history into time windows
        price_history = card.get('priceHistory', {})
        raw_history_7d = self.slice_history(price_history, 7)
        raw_history_30d = self.slice_history(price_history, 30)
        raw_history_90d = self.slice_history(price_history, 90)
        raw_history_180d = self.slice_history(price_history, 180)
        raw_history_365d = self.slice_history(price_history, 365)

        # Track variants and conditions
        variants_tracked = list(raw_history_365d.keys()) if raw_history_365d else []
        conditions_tracked = list(set(
            cond for variant_data in raw_history_365d.values()
            for cond in variant_data.keys()
        )) if raw_history_365d else []

        # Calculate percent changes using primary history
        primary_history = self.get_primary_history(raw_history_365d)

        # For percent changes, we need to get history slices based on primary variant/condition
        primary_7d = primary_history[-7:] if len(primary_history) >= 7 else primary_history
        primary_30d = primary_history[-30:] if len(primary_history) >= 30 else primary_history
        primary_90d = primary_history[-90:] if len(primary_history) >= 90 else primary_history
        primary_180d = primary_history[-180:] if len(primary_history) >= 180 else primary_history

        change_7d = self.calc_percent_change(primary_7d)
        change_30d = self.calc_percent_change(primary_30d)
        change_90d = self.calc_percent_change(primary_90d)
        change_180d = self.calc_percent_change(primary_180d)
        change_365d = self.calc_percent_change(primary_history)

        return {
            'pokemon_card_id': our_card_id,
            'tcgplayer_product_id': tcgplayer_product_id,
            'current_market_price': market_price,
            'current_market_price_condition': condition,
            'psa10': json.dumps(psa10) if psa10 else None,
            'psa9': json.dumps(psa9) if psa9 else None,
            'psa8': json.dumps(psa8) if psa8 else None,
            'change_7d_percent': change_7d,
            'change_30d_percent': change_30d,
            'change_90d_percent': change_90d,
            'change_180d_percent': change_180d,
            'change_365d_percent': change_365d,
            'prices_raw': json.dumps(prices) if prices else None,
            'ebay_price_history': json.dumps(ebay_price_history) if ebay_price_history else None,
            'raw_history_7d': json.dumps(raw_history_7d) if raw_history_7d else None,
            'raw_history_30d': json.dumps(raw_history_30d) if raw_history_30d else None,
            'raw_history_90d': json.dumps(raw_history_90d) if raw_history_90d else None,
            'raw_history_180d': json.dumps(raw_history_180d) if raw_history_180d else None,
            'raw_history_365d': json.dumps(raw_history_365d) if raw_history_365d else None,
            'raw_history_variants_tracked': variants_tracked,
            'raw_history_conditions_tracked': conditions_tracked,
            'last_updated': datetime.now(timezone.utc).isoformat()
        }

    def find_our_card_id(self, ppt_card: Dict, cards_by_tcgplayer_id: Dict) -> Optional[str]:
        """
        Find our pokemon_cards.id for a PokemonPriceTracker card.
        Matches by tcgplayer_product_id.
        """
        tcgplayer_id = ppt_card.get('tcgPlayerId')
        if tcgplayer_id:
            try:
                tcgplayer_id = int(tcgplayer_id)
                return cards_by_tcgplayer_id.get(tcgplayer_id)
            except (ValueError, TypeError):
                pass
        return None

    def get_cards_for_set_from_db(self, set_id: str) -> Dict[int, str]:
        """
        Get all cards for a set from our database.
        Returns a dict mapping tcgplayer_product_id -> pokemon_card.id
        """
        cards_by_tcgplayer_id = {}

        try:
            # Fetch all cards for this set with tcgplayer_product_id
            result = self.supabase.table('pokemon_cards')\
                .select('id, tcgplayer_product_id')\
                .eq('set_id', set_id)\
                .not_.is_('tcgplayer_product_id', 'null')\
                .execute()

            for card in result.data:
                if card.get('tcgplayer_product_id'):
                    cards_by_tcgplayer_id[card['tcgplayer_product_id']] = card['id']

        except Exception as e:
            console.print(f"[red]Error fetching cards from database: {e}[/red]")

        return cards_by_tcgplayer_id

    def upsert_price_record(self, record: Dict, dry_run: bool = False) -> bool:
        """
        Insert or update a pokemon_card_prices record.
        Uses upsert with pokemon_card_id as the conflict key.
        """
        if dry_run:
            console.print(f"[yellow]DRY RUN: Would upsert price for {record['pokemon_card_id']}[/yellow]")
            return True

        try:
            # Use upsert to insert or update based on pokemon_card_id
            result = self.supabase.table('pokemon_card_prices')\
                .upsert(record, on_conflict='pokemon_card_id')\
                .execute()

            return len(result.data) > 0
        except Exception as e:
            console.print(f"[red]Error upserting price record: {e}[/red]")
            return False

    def process_set(self, set_info: Dict, dry_run: bool = False) -> Dict[str, int]:
        """
        Process a single set: fetch from API and update database.
        Returns statistics about the processing.
        """
        stats = {
            'cards_fetched': 0,
            'cards_matched': 0,
            'cards_updated': 0,
            'cards_skipped': 0,
            'errors': 0
        }

        set_id = set_info['id']
        set_name = set_info['name']
        tcgplayer_set_id = set_info['tcgplayer_set_id']

        console.print(f"\n[blue]Processing: {set_name}[/blue]")
        console.print(f"[dim]  Set ID: {set_id}, TCGPlayer Set ID: {tcgplayer_set_id}[/dim]")

        # Fetch cards from PokemonPriceTracker API
        ppt_cards = self.fetch_cards_for_set(tcgplayer_set_id)
        stats['cards_fetched'] = len(ppt_cards)

        if not ppt_cards:
            console.print(f"[yellow]No cards found from API for {set_name}[/yellow]")
            return stats

        console.print(f"[green]Fetched {len(ppt_cards)} cards from API[/green]")

        # Get our cards from database for matching
        cards_by_tcgplayer_id = self.get_cards_for_set_from_db(set_id)
        console.print(f"[dim]Found {len(cards_by_tcgplayer_id)} cards in our database with TCGPlayer IDs[/dim]")

        # Process each card
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            console=console
        ) as progress:
            task = progress.add_task("Processing cards...", total=len(ppt_cards))

            for ppt_card in ppt_cards:
                card_name = ppt_card.get('name', 'Unknown')
                progress.update(task, description=f"Processing {card_name}...")

                # Find our card ID
                our_card_id = self.find_our_card_id(ppt_card, cards_by_tcgplayer_id)

                if not our_card_id:
                    stats['cards_skipped'] += 1
                    # Track skipped card for logging
                    if tcgplayer_set_id not in self.skipped_cards:
                        self.skipped_cards[tcgplayer_set_id] = {
                            'set_name': set_name,
                            'set_id': set_id,
                            'cards': []
                        }
                    self.skipped_cards[tcgplayer_set_id]['cards'].append({
                        'name': ppt_card.get('name'),
                        'tcgPlayerId': ppt_card.get('tcgPlayerId'),
                        'number': ppt_card.get('number'),
                        'rarity': ppt_card.get('rarity'),
                        'setName': ppt_card.get('setName'),
                        'pptId': ppt_card.get('_id')
                    })
                    progress.advance(task)
                    continue

                stats['cards_matched'] += 1

                # Transform and upsert
                try:
                    price_record = self.transform_card_to_price_record(ppt_card, our_card_id)
                    success = self.upsert_price_record(price_record, dry_run)

                    if success:
                        stats['cards_updated'] += 1
                    else:
                        stats['errors'] += 1
                except Exception as e:
                    console.print(f"[red]Error processing card {card_name}: {e}[/red]")
                    stats['errors'] += 1

                progress.advance(task)

        # Display stats for this set
        console.print(f"[dim]  Fetched: {stats['cards_fetched']} | Matched: {stats['cards_matched']} | Updated: {stats['cards_updated']} | Skipped: {stats['cards_skipped']} | Errors: {stats['errors']}[/dim]")

        return stats

    def sync_set(self, tcgplayer_set_id: str, dry_run: bool = False):
        """Sync prices for a specific set by TCGPlayer set ID."""
        # Find the set in our database
        try:
            result = self.supabase.table('pokemon_sets')\
                .select('id, name, tcgplayer_set_id')\
                .eq('tcgplayer_set_id', tcgplayer_set_id)\
                .execute()

            if not result.data:
                console.print(f"[red]Set with tcgplayer_set_id '{tcgplayer_set_id}' not found[/red]")
                return

            set_info = result.data[0]

        except Exception as e:
            console.print(f"[red]Error fetching set info: {e}[/red]")
            return

        stats = self.process_set(set_info, dry_run)

        # Display results
        console.print(f"\n[bold]Results for {set_info['name']}:[/bold]")
        console.print(f"Cards fetched from API: [blue]{stats['cards_fetched']}[/blue]")
        console.print(f"Cards matched: [green]{stats['cards_matched']}[/green]")
        console.print(f"Cards updated: [green]{stats['cards_updated']}[/green]")
        console.print(f"Cards skipped (no match): [yellow]{stats['cards_skipped']}[/yellow]")
        console.print(f"Errors: [red]{stats['errors']}[/red]")

        if dry_run:
            console.print("\n[yellow]DRY RUN - No database changes were made[/yellow]")

        # Save skipped cards log if any
        if self.skipped_cards:
            self.save_skipped_cards_log()

    def sync_all(self, dry_run: bool = False):
        """Sync prices for all sets with tcgplayer_set_id."""
        console.print("\n[bold]Starting full price sync from PokemonPriceTracker...[/bold]")

        # Get all sets with tcgplayer_set_id
        try:
            result = self.supabase.table('pokemon_sets')\
                .select('id, name, tcgplayer_set_id')\
                .not_.is_('tcgplayer_set_id', 'null')\
                .order('name')\
                .execute()

            sets = result.data

        except Exception as e:
            console.print(f"[red]Error fetching sets: {e}[/red]")
            return

        if not sets:
            console.print("[red]No sets with tcgplayer_set_id found[/red]")
            return

        console.print(f"Found [blue]{len(sets)}[/blue] sets with tcgplayer_set_id")

        # Initialize totals
        total_stats = {
            'cards_fetched': 0,
            'cards_matched': 0,
            'cards_updated': 0,
            'cards_skipped': 0,
            'errors': 0
        }

        # Process each set
        for i, set_info in enumerate(sets):
            stats = self.process_set(set_info, dry_run)

            # Add to totals
            for key in total_stats:
                total_stats[key] += stats.get(key, 0)

            # Rate limit between sets (unless it's the last one)
            if i < len(sets) - 1:
                console.print(f"\n[yellow]Rate limiting: waiting {SET_RATE_LIMIT_SECONDS} seconds before next set...[/yellow]")
                time.sleep(SET_RATE_LIMIT_SECONDS)

        # Display final results
        console.print(f"\n[bold]Final Results:[/bold]")
        console.print(f"Sets processed: [blue]{len(sets)}[/blue]")
        console.print(f"Cards fetched from API: [blue]{total_stats['cards_fetched']}[/blue]")
        console.print(f"Cards matched: [green]{total_stats['cards_matched']}[/green]")
        console.print(f"Cards updated: [green]{total_stats['cards_updated']}[/green]")
        console.print(f"Cards skipped (no match): [yellow]{total_stats['cards_skipped']}[/yellow]")
        console.print(f"Errors: [red]{total_stats['errors']}[/red]")

        if dry_run:
            console.print("\n[yellow]DRY RUN - No database changes were made[/yellow]")
        else:
            console.print(f"\n[green]✓ Price sync completed successfully![/green]")

        # Save skipped cards log if any
        if self.skipped_cards:
            self.save_skipped_cards_log()

    def save_skipped_cards_log(self):
        """Save skipped cards to a JSON file for investigation."""
        filename = 'ppt_skipped_cards.json'

        data_with_timestamp = {
            'last_updated': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'total_skipped': sum(len(data['cards']) for data in self.skipped_cards.values()),
            'sets': self.skipped_cards
        }

        with open(filename, 'w') as f:
            json.dump(data_with_timestamp, f, indent=2)

        console.print(f"\n[yellow]Skipped cards saved to {filename}[/yellow]")

        # Show summary of skipped cards
        total_skipped = data_with_timestamp['total_skipped']
        console.print(f"[yellow]Total skipped cards: {total_skipped}[/yellow]")

        for tcgplayer_set_id, data in self.skipped_cards.items():
            console.print(f"\n[cyan]{data['set_name']}[/cyan] ({len(data['cards'])} skipped):")
            for card in data['cards'][:5]:  # Show first 5
                console.print(f"  - {card['name']} (tcgPlayerId: {card['tcgPlayerId']}, number: {card['number']})")
            if len(data['cards']) > 5:
                console.print(f"  ... and {len(data['cards']) - 5} more")

    def show_stats(self):
        """Show statistics about current price data in pokemon_card_prices."""
        console.print("\n[bold]Pokemon Card Prices Statistics:[/bold]")

        try:
            # Total sets with tcgplayer_set_id
            sets_result = self.supabase.table('pokemon_sets')\
                .select('id', count='exact')\
                .not_.is_('tcgplayer_set_id', 'null')\
                .execute()
            total_sets = sets_result.count

            # Total price records
            prices_result = self.supabase.table('pokemon_card_prices')\
                .select('id', count='exact')\
                .execute()
            total_prices = prices_result.count

            # Price records with market price
            with_market_result = self.supabase.table('pokemon_card_prices')\
                .select('id', count='exact')\
                .not_.is_('current_market_price', 'null')\
                .execute()
            with_market = with_market_result.count

            # Price records with PSA data
            with_psa10_result = self.supabase.table('pokemon_card_prices')\
                .select('id', count='exact')\
                .not_.is_('psa10', 'null')\
                .execute()
            with_psa10 = with_psa10_result.count

            # Price records with history
            with_history_result = self.supabase.table('pokemon_card_prices')\
                .select('id', count='exact')\
                .not_.is_('raw_history_365d', 'null')\
                .execute()
            with_history = with_history_result.count

            # Recent updates (last 24 hours)
            yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
            recent_result = self.supabase.table('pokemon_card_prices')\
                .select('id', count='exact')\
                .gte('last_updated', yesterday)\
                .execute()
            recent = recent_result.count

            # Create table
            table = Table(title="Price Cache Statistics")
            table.add_column("Metric", style="cyan")
            table.add_column("Count", justify="right", style="green")
            table.add_column("Percentage", justify="right", style="yellow")

            table.add_row("Sets with tcgplayer_set_id", str(total_sets), "-")
            table.add_row("Total price records", str(total_prices), "100%")
            table.add_row("With market price", str(with_market),
                         f"{(with_market/total_prices*100):.1f}%" if total_prices > 0 else "0%")
            table.add_row("With PSA10 data", str(with_psa10),
                         f"{(with_psa10/total_prices*100):.1f}%" if total_prices > 0 else "0%")
            table.add_row("With price history", str(with_history),
                         f"{(with_history/total_prices*100):.1f}%" if total_prices > 0 else "0%")
            table.add_row("Updated (last 24h)", str(recent),
                         f"{(recent/total_prices*100):.1f}%" if total_prices > 0 else "0%")

            console.print(table)

        except Exception as e:
            console.print(f"[red]Error fetching statistics: {e}[/red]")

    def show_sample(self, tcgplayer_set_id: Optional[str] = None, limit: int = 3):
        """Show sample price data from the database."""
        console.print("\n[bold]Sample Price Data:[/bold]")

        try:
            query = self.supabase.table('pokemon_card_prices')\
                .select('*, pokemon_cards!inner(id, name, set_id)')\
                .limit(limit)

            if tcgplayer_set_id:
                # Get set_id from tcgplayer_set_id
                set_result = self.supabase.table('pokemon_sets')\
                    .select('id')\
                    .eq('tcgplayer_set_id', tcgplayer_set_id)\
                    .execute()

                if set_result.data:
                    set_id = set_result.data[0]['id']
                    query = query.eq('pokemon_cards.set_id', set_id)

            result = query.execute()

            if not result.data:
                console.print("[yellow]No price data found[/yellow]")
                return

            for record in result.data:
                card_name = record.get('pokemon_cards', {}).get('name', 'Unknown')
                console.print(f"\n[green]{card_name}[/green]")
                console.print(f"  Market Price: ${record.get('current_market_price', 'N/A')} ({record.get('current_market_price_condition', 'N/A')})")

                # PSA prices
                if record.get('psa10'):
                    psa10 = json.loads(record['psa10']) if isinstance(record['psa10'], str) else record['psa10']
                    smart_price = psa10.get('smartMarketPrice', {})
                    console.print(f"  PSA 10: ${smart_price.get('price', 'N/A')} (confidence: {smart_price.get('confidence', 'N/A')})")

                # Percent changes
                changes = []
                if record.get('change_7d_percent') is not None:
                    changes.append(f"7d: {record['change_7d_percent']:+.1f}%")
                if record.get('change_30d_percent') is not None:
                    changes.append(f"30d: {record['change_30d_percent']:+.1f}%")
                if changes:
                    console.print(f"  Price Changes: {', '.join(changes)}")

                # Variants tracked
                variants = record.get('raw_history_variants_tracked', [])
                if variants:
                    console.print(f"  Variants: {', '.join(variants)}")

                console.print(f"  Last Updated: {record.get('last_updated', 'N/A')}")

        except Exception as e:
            console.print(f"[red]Error fetching sample data: {e}[/red]")


def main():
    parser = argparse.ArgumentParser(description='Pokemon Price Tracker API Sync Tool')
    parser.add_argument('--set', help='Sync prices for a specific set (tcgplayer_set_id, e.g., "me01-mega-evolution")')
    parser.add_argument('--all', action='store_true', help='Sync prices for all sets with tcgplayer_set_id')
    parser.add_argument('--stats', action='store_true', help='Show current price statistics')
    parser.add_argument('--sample', nargs='?', const='', help='Show sample price data (optional tcgplayer_set_id)')
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without updating database')

    args = parser.parse_args()

    if not any([args.set, args.all, args.stats, args.sample is not None]):
        parser.print_help()
        return

    syncer = PokemonPriceTrackerSync()

    if args.stats:
        syncer.show_stats()
    elif args.sample is not None:
        tcgplayer_set_id = args.sample if args.sample else None
        syncer.show_sample(tcgplayer_set_id=tcgplayer_set_id)
    elif args.set:
        syncer.sync_set(args.set, dry_run=args.dry_run)
    elif args.all:
        syncer.sync_all(dry_run=args.dry_run)


if __name__ == "__main__":
    main()
