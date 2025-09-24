#!/usr/bin/env python3
"""
Enhanced Pokemon Card Variant Sync Script v2

This script handles complex variant mappings where multiple TCGPlayer products
correspond to the same Pokemon card (same card number) but represent different
patterns/treatments like Poke Ball Pattern, Master Ball Pattern, etc.

Key Features:
- Detects 1:many product mappings
- Auto-classifies base vs special pattern variants
- Sets base variant as primary mapping
- Corrects existing incorrect mappings
- Stores all variants in comprehensive tcgplayer_products structure

Usage:
    python sync_card_variants_v2.py --set sv08.5
    python sync_card_variants_v2.py --all-sets
    python sync_card_variants_v2.py --set sv08.5 --dry-run
"""

import os
import sys
import argparse
import requests
import json
from datetime import datetime
from typing import List, Dict, Optional, Set, Tuple
from collections import defaultdict
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

class VariantCard:
    """Represents a card with multiple variant products"""
    def __init__(self, card_number: str, set_id: str):
        self.card_number = card_number
        self.set_id = set_id
        self.products = []
        self.base_product = None
        self.existing_card_id = f"{set_id}-{card_number}"

    def add_product(self, product: Dict):
        """Add a product variant to this card"""
        self.products.append(product)

    def classify_variants(self):
        """Classify all products and determine base variant"""
        classified_products = []

        for product in self.products:
            variant_type = self.classify_product_variant(product)
            classified_products.append({
                'product': product,
                'variant_type': variant_type,
                'is_base': variant_type == 'base'
            })

        # Find base product (prefer base variant, fallback to first)
        base_products = [p for p in classified_products if p['is_base']]
        if base_products:
            self.base_product = base_products[0]['product']
        else:
            # No explicit base variant, use first product as primary
            self.base_product = classified_products[0]['product']

        return classified_products

    @staticmethod
    def classify_product_variant(product: Dict) -> str:
        """Classify a product into variant type based on name"""
        name = product.get('name', '').lower()

        if 'master ball' in name:
            return 'master_ball'
        elif 'poke ball' in name or 'pokeball' in name:
            return 'poke_ball'
        elif any(term in name for term in ['rainbow', 'secret', 'gold', 'alternate art']):
            return 'special'
        else:
            return 'base'

    def build_tcgplayer_products_array(self, classified_products: List[Dict]) -> List[Dict]:
        """Build the tcgplayer_products JSON array"""
        products_array = []

        for classified in classified_products:
            product = classified['product']
            variant_type = classified['variant_type']

            # Determine variant types this product supports
            # For now, special patterns typically only support reverse holo
            if variant_type in ['poke_ball', 'master_ball']:
                variant_types = [variant_type]
            else:
                # Base products typically support normal, reverse, holo
                variant_types = ['normal', 'reverse', 'holo']

            products_array.append({
                'product_id': product['productId'],
                'variant_types': variant_types,
                'name': product['name'],
                'image_url': product['imageUrl'],
                'is_primary': product['productId'] == self.base_product['productId']
            })

        return products_array


class EnhancedVariantSync:
    def __init__(self, dry_run: bool = False):
        """Initialize the enhanced variant sync"""
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
            'sets_processed': 0,
            'cards_updated': 0,
            'cards_created': 0,
            'variants_fixed': 0,
            'multi_product_cards': 0,
            'input_actions_processed': 0,
            'automatic_updates': 0,
            'errors': 0,
            'unmapped_cards': []
        }

        # Track processed products to avoid duplicate processing
        self.processed_product_ids = set()

        # Input data will be loaded after file renaming
        self.input_data = None

    def load_input_file(self) -> Optional[Dict]:
        """Load unmapped_cards_input.json if it exists"""
        input_file = 'unmapped_cards_input.json'

        if os.path.exists(input_file):
            try:
                with open(input_file, 'r') as f:
                    data = json.load(f)
                console.print(f"[green]✓ Loaded input file: {input_file}[/green]")
                return data
            except Exception as e:
                console.print(f"[red]Error loading input file: {e}[/red]")
                return None
        else:
            console.print(f"[dim]No input file found: {input_file}[/dim]")
            return None

    def rename_unmapped_cards_file(self):
        """Rename unmapped_cards.json to unmapped_cards_input.json at start"""
        old_file = 'unmapped_cards.json'
        new_file = 'unmapped_cards_input.json'

        if os.path.exists(old_file):
            try:
                # Remove existing input file if it exists
                if os.path.exists(new_file):
                    os.remove(new_file)
                    console.print(f"[dim]Removed existing {new_file}[/dim]")

                # Rename current unmapped_cards.json to input file
                os.rename(old_file, new_file)
                console.print(f"[green]✓ Renamed {old_file} to {new_file}[/green]")
            except Exception as e:
                console.print(f"[red]Error renaming file: {e}[/red]")
        else:
            console.print(f"[dim]No {old_file} found to rename[/dim]")

    def fetch_tcgcsv_products(self, group_id: int) -> Optional[List[Dict]]:
        """Fetch all products for a TCGPlayer group"""
        try:
            url = f"{TCGCSV_API_BASE}/tcgplayer/3/{group_id}/products"
            console.print(f"[dim]Fetching products from: {url}[/dim]")

            response = requests.get(url, timeout=30)
            response.raise_for_status()

            data = response.json()

            # Handle different response structures
            if isinstance(data, dict) and 'results' in data:
                return data['results']
            elif isinstance(data, list):
                return data
            else:
                console.print(f"[yellow]Unexpected data structure for group {group_id}[/yellow]")
                return None

        except Exception as e:
            console.print(f"[red]Error fetching products for group {group_id}: {e}[/red]")
            self.stats['errors'] += 1
            return None

    def extract_local_id_from_extended_data(self, extended_data: List[Dict]) -> Optional[str]:
        """Extract local_id (card number before slash) from extendedData"""
        for item in extended_data:
            if item.get('name') == 'Number':
                value = item.get('value', '')
                # Extract "057" from "057/131"
                return value.split('/')[0] if '/' in value else value
        return None

    def extract_rarity_from_extended_data(self, extended_data: List[Dict]) -> Optional[str]:
        """Extract rarity from extendedData"""
        for item in extended_data:
            if item.get('name') == 'Rarity':
                return item.get('value')
        return None

    def extract_card_number(self, product: Dict) -> Optional[str]:
        """Extract card number from product's extendedData"""
        if not product.get('extendedData'):
            return None

        for item in product['extendedData']:
            if item['name'] == 'Number':
                return item['value']

        return None

    def group_products_by_card_number(self, products: List[Dict]) -> Dict[str, List[Dict]]:
        """Group products by their card number"""
        grouped = defaultdict(list)

        for product in products:
            # Skip non-card products (sealed products, etc.)
            if not self.is_card_product(product):
                continue

            card_number = self.extract_card_number(product)
            if card_number:
                # Extract just the number part (before the slash if present)
                if '/' in card_number:
                    number_part = card_number.split('/')[0]
                else:
                    number_part = card_number

                grouped[number_part].append(product)

        return grouped

    def is_card_product(self, product: Dict) -> bool:
        """Determine if a product is a card based on extendedData"""
        if not product.get('extendedData'):
            return False

        extended_names = [item['name'] for item in product['extendedData']]

        # Card-specific attributes
        card_attributes = ['Number', 'Rarity', 'HP', 'Stage', 'Card Type']

        # If any card attribute exists, it's a card
        return any(attr in extended_names for attr in card_attributes)

    def construct_card_id(self, set_id: str, card_number: str) -> str:
        """Construct card ID from set ID and card number"""
        return f"{set_id}-{card_number}"

    def check_product_exists_in_tcg_products(self, card_id: str, product_id: int) -> bool:
        """Check if a product already exists in the card's tcgplayer_products array"""
        try:
            result = self.supabase.table('pokemon_cards')\
                .select('tcgplayer_products')\
                .eq('id', card_id)\
                .execute()

            if result.data:
                tcg_products = result.data[0].get('tcgplayer_products')
                if tcg_products:
                    # Parse JSON if it's a string
                    if isinstance(tcg_products, str):
                        tcg_products = json.loads(tcg_products)

                    # Check if product_id already exists
                    return any(p.get('product_id') == product_id for p in tcg_products)

            return False
        except Exception:
            return False

    def try_multiple_card_ids(self, set_id: str, card_number: str) -> Optional[str]:
        """Try multiple card ID formats to handle inconsistent leading zero usage and letter prefixes"""
        # Extract the number part before the slash if present
        if '/' in card_number:
            number_part = card_number.split('/')[0]
        else:
            number_part = card_number

        # Generate multiple possible ID formats
        possible_ids = []

        # 1. Original format (with leading zeros if present)
        possible_ids.append(f"{set_id}-{number_part}")

        # 2. Trimmed leading zeros format
        trimmed_number = number_part.lstrip('0') or '0'  # Keep at least one zero
        if trimmed_number != number_part:
            possible_ids.append(f"{set_id}-{trimmed_number}")

        # 3. Zero-padded format (in case database has more zeros)
        if number_part.isdigit() and len(number_part) < 3:
            padded_number = number_part.zfill(3)
            if padded_number != number_part:
                possible_ids.append(f"{set_id}-{padded_number}")

        # 4. Letter prefix with number variations (e.g., BW004 → BW04 → BW4)
        import re
        letter_match = re.match(r'^([A-Za-z]+)(\d+)$', number_part)
        if letter_match:
            letter_prefix = letter_match.group(1)
            number_suffix = letter_match.group(2)

            # Generate multiple length variations: BW004 → BW04 → BW4
            if len(number_suffix) > 2:
                # Try 2-digit version (BW004 → BW04)
                two_digit = number_suffix.zfill(2)[-2:]  # Keep last 2 digits
                if two_digit != number_suffix and two_digit != '00':
                    possible_ids.append(f"{set_id}-{letter_prefix}{two_digit}")

            # Try single digit version (BW004 → BW4)
            trimmed_suffix = number_suffix.lstrip('0') or '0'
            if trimmed_suffix != number_suffix:
                possible_ids.append(f"{set_id}-{letter_prefix}{trimmed_suffix}")

            # Try with additional zero-padding if original was short
            if len(number_suffix) < 3:
                padded_suffix = number_suffix.zfill(3)
                if padded_suffix != number_suffix:
                    possible_ids.append(f"{set_id}-{letter_prefix}{padded_suffix}")

        # 5. TCG prefix format for created cards
        possible_ids.append(f"{set_id}-TCG{number_part}")

        # Try each possible ID format
        for card_id in possible_ids:
            try:
                result = self.supabase.table('pokemon_cards')\
                    .select('id')\
                    .eq('id', card_id)\
                    .execute()

                if result.data:
                    return card_id
            except Exception:
                continue

        return None

    def process_input_actions_for_set(self, set_id: str) -> int:
        """Process input actions for a specific set. Returns number of actions processed."""
        if not self.input_data:
            return 0

        actions_processed = 0

        # Look for this set in the input data
        set_products = []
        if isinstance(self.input_data, dict):
            # Handle new structured format: {"sets": {"bwp": {"products": [...]}}}
            if 'sets' in self.input_data and set_id in self.input_data['sets']:
                set_products = self.input_data['sets'][set_id].get('products', [])
            # Handle legacy format: {"set_id": "sv08.5", "products": [...]}
            elif self.input_data.get('set_id') == set_id:
                set_products = self.input_data.get('products', [])
        elif isinstance(self.input_data, list):
            # Handle flat list format
            set_products = [p for p in self.input_data if p.get('set_id') == set_id]

        if not set_products:
            return 0

        console.print(f"[cyan]Processing {len(set_products)} input actions for set {set_id}[/cyan]")

        for product_action in set_products:
            action = product_action.get('action', 'review')

            if action == 'review':
                continue  # Skip review actions
            elif action == 'update':
                self.process_update_action(product_action)
                actions_processed += 1
            elif action == 'create':
                self.process_create_action(set_id, product_action)
                actions_processed += 1
            elif action == 'skip':
                actions_processed += 1  # Count but don't process

        return actions_processed

    def process_update_action(self, product_action: Dict):
        """Process an update action from input file"""
        try:
            card_id = product_action.get('card_id')
            tcg_product = product_action.get('tcg_product', {})

            if not card_id or not tcg_product:
                console.print(f"[red]Invalid update action: missing card_id or tcg_product[/red]")
                return

            product_id = tcg_product.get('productId')
            if not product_id:
                console.print(f"[red]Invalid update action: missing productId[/red]")
                return

            # Check if product already exists
            if self.check_product_exists_in_tcg_products(card_id, product_id):
                console.print(f"[yellow]Product {product_id} already exists for card {card_id}, skipping[/yellow]")
                return

            if not self.dry_run:
                self.add_product_to_existing_card(card_id, tcg_product)
                console.print(f"[green]✓ Updated card {card_id} with product {product_id}[/green]")
                self.stats['cards_updated'] += 1
                # Track this product as processed
                self.processed_product_ids.add(product_id)
            else:
                console.print(f"[dim]DRY RUN: Would update card {card_id} with product {product_id}[/dim]")
                # Track this product as processed even in dry run
                self.processed_product_ids.add(product_id)

        except Exception as e:
            console.print(f"[red]Error processing update action: {e}[/red]")
            self.stats['errors'] += 1

    def process_create_action(self, set_id: str, product_action: Dict):
        """Process a create action from input file"""
        try:
            # Handle both single product and multi-variant products
            if 'tcg_product' in product_action:
                # Single product create
                tcg_product = product_action['tcg_product']
                self.create_single_card_from_product(set_id, tcg_product)
            elif 'tcg_products' in product_action:
                # Multi-variant create - create separate card for each product
                tcg_products = product_action['tcg_products']
                console.print(f"[cyan]Creating {len(tcg_products)} separate cards from multi-variant group[/cyan]")
                for tcg_product in tcg_products:
                    self.create_single_card_from_product(set_id, tcg_product)
            else:
                console.print(f"[red]Invalid create action: missing tcg_product or tcg_products[/red]")

        except Exception as e:
            console.print(f"[red]Error processing create action: {e}[/red]")
            self.stats['errors'] += 1

    def create_single_card_from_product(self, set_id: str, tcg_product: Dict):
        """Create a single card from one TCGPlayer product"""
        try:
            product_id = tcg_product.get('productId')
            if not product_id:
                console.print(f"[red]Invalid product: missing productId[/red]")
                return

            # Generate card ID
            card_id = f"{set_id}-TCG{product_id}"

            # Check if card already exists
            try:
                result = self.supabase.table('pokemon_cards')\
                    .select('id')\
                    .eq('id', card_id)\
                    .execute()

                if result.data:
                    console.print(f"[yellow]Card {card_id} already exists, skipping create[/yellow]")
                    return
            except Exception:
                pass

            if not self.dry_run:
                self.create_new_card_from_tcg_product(set_id, tcg_product)
                console.print(f"[green]✓ Created new card {card_id}[/green]")
                self.stats['cards_created'] += 1
                # Track this product as processed
                self.processed_product_ids.add(product_id)
            else:
                console.print(f"[dim]DRY RUN: Would create new card {card_id}[/dim]")
                # Track this product as processed even in dry run
                self.processed_product_ids.add(product_id)

        except Exception as e:
            console.print(f"[red]Error creating card from product {tcg_product.get('productId')}: {e}[/red]")
            self.stats['errors'] += 1

    def add_product_to_existing_card(self, card_id: str, tcg_product: Dict):
        """Add a product to an existing card's tcgplayer_products array"""
        try:
            # Get current card data
            result = self.supabase.table('pokemon_cards')\
                .select('tcgplayer_products, tcgplayer_product_id')\
                .eq('id', card_id)\
                .execute()

            if not result.data:
                raise Exception(f"Card {card_id} not found")

            current_data = result.data[0]
            current_products = current_data.get('tcgplayer_products', [])

            # Parse JSON if it's a string
            if isinstance(current_products, str):
                current_products = json.loads(current_products)
            elif current_products is None:
                current_products = []

            # Create new product entry
            variant_type = VariantCard.classify_product_variant(tcg_product)
            new_product = {
                'product_id': tcg_product['productId'],
                'variant_types': [variant_type] if variant_type in ['poke_ball', 'master_ball'] else ['normal', 'reverse', 'holo'],
                'name': tcg_product['name'],
                'image_url': tcg_product['imageUrl'],
                'is_primary': False  # Don't change primary unless it's the first product
            }

            # If this is the first product, make it primary
            if not current_products:
                new_product['is_primary'] = True

            # Add to products array
            current_products.append(new_product)

            # Update variant flags
            variant_flags = {
                'variant_poke_ball': any('poke_ball' in p.get('variant_types', []) for p in current_products),
                'variant_master_ball': any('master_ball' in p.get('variant_types', []) for p in current_products)
            }

            # Prepare update data
            update_data = {
                'tcgplayer_products': json.dumps(current_products),
                'tcgplayer_image_url': tcg_product['imageUrl'],
                'updated_at': datetime.now().isoformat(),
                **variant_flags
            }

            # If this is the primary product, update the main product ID
            if new_product['is_primary']:
                update_data['tcgplayer_product_id'] = tcg_product['productId']

            # Update the card
            self.supabase.table('pokemon_cards')\
                .update(update_data)\
                .eq('id', card_id)\
                .execute()

        except Exception as e:
            raise Exception(f"Failed to add product to card {card_id}: {e}")

    def create_new_card_from_tcg_product(self, set_id: str, tcg_product: Dict):
        """Create a new card record from TCGPlayer product data"""
        try:
            extended_data = tcg_product.get('extendedData', [])

            # Extract required fields
            local_id = self.extract_local_id_from_extended_data(extended_data)
            rarity = self.extract_rarity_from_extended_data(extended_data)

            # Generate card ID
            card_id = f"{set_id}-TCG{tcg_product['productId']}"

            # Build tcgplayer_products array
            variant_type = VariantCard.classify_product_variant(tcg_product)
            products_array = [{
                'product_id': tcg_product['productId'],
                'variant_types': [variant_type] if variant_type in ['poke_ball', 'master_ball'] else ['normal', 'reverse', 'holo'],
                'name': tcg_product['name'],
                'image_url': tcg_product['imageUrl'],
                'is_primary': True
            }]

            # Build card data
            card_data = {
                'id': card_id,
                'set_id': set_id,
                'local_id': local_id,
                'name': tcg_product['name'],
                'rarity': rarity,
                'variant_normal': True,
                'variant_reverse': False,
                'variant_holo': False,
                'variant_first_edition': False,
                'tcgplayer_product_id': tcg_product['productId'],
                'tcgplayer_image_url': tcg_product['imageUrl'],
                'variant_poke_ball': variant_type == 'poke_ball',
                'variant_master_ball': variant_type == 'master_ball',
                'tcgplayer_products': json.dumps(products_array),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }

            # Insert the card
            self.supabase.table('pokemon_cards')\
                .insert(card_data)\
                .execute()

        except Exception as e:
            raise Exception(f"Failed to create card from product {tcg_product.get('productId')}: {e}")

    def sync_set_variants(self, set_id: str):
        """Sync variants for a specific set"""
        console.print(f"\n[blue]Syncing variants for set: {set_id}[/blue]")

        # Process input actions first
        input_actions_processed = self.process_input_actions_for_set(set_id)
        if input_actions_processed > 0:
            console.print(f"[green]✓ Processed {input_actions_processed} input actions[/green]")
            self.stats['input_actions_processed'] += input_actions_processed

        # Get set info including TCGPlayer group ID
        try:
            result = self.supabase.table('pokemon_sets')\
                .select('id, name, tcgplayer_group_id')\
                .eq('id', set_id)\
                .execute()

            if not result.data:
                console.print(f"[red]Set {set_id} not found[/red]")
                return

            set_info = result.data[0]
            group_id = set_info['tcgplayer_group_id']

            if not group_id:
                console.print(f"[yellow]Set {set_id} has no TCGPlayer group ID[/yellow]")
                return

        except Exception as e:
            console.print(f"[red]Error fetching set info: {e}[/red]")
            self.stats['errors'] += 1
            return

        # Fetch all products for this set
        products = self.fetch_tcgcsv_products(group_id)
        if not products:
            console.print(f"[yellow]No products found for set {set_id}[/yellow]")
            return

        # Group products by card number
        grouped_products = self.group_products_by_card_number(products)
        console.print(f"Found [blue]{len(grouped_products)}[/blue] unique card numbers")

        # Process each card number group
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            console=console
        ) as progress:
            task = progress.add_task("Processing cards...", total=len(grouped_products))

            for card_number, card_products in grouped_products.items():
                progress.update(task, description=f"Processing card {card_number}...")

                if len(card_products) == 1:
                    # Simple 1:1 mapping
                    if self.sync_single_product_card(set_id, card_number, card_products[0]):
                        self.stats['automatic_updates'] += 1
                else:
                    # Complex 1:many mapping - our main case!
                    if self.sync_multi_variant_card(set_id, card_number, card_products):
                        self.stats['automatic_updates'] += 1
                    self.stats['multi_product_cards'] += 1

                progress.advance(task)

        self.stats['sets_processed'] += 1
        console.print(f"[green]✓ Completed sync for set {set_id}[/green]")

    def sync_single_product_card(self, set_id: str, card_number: str, product: Dict) -> bool:
        """Handle simple 1:1 product mapping. Returns True if successful."""
        # Skip if this product was already processed in input actions
        product_id = product.get('productId')
        if product_id in self.processed_product_ids:
            console.print(f"[dim]Product {product_id} already processed in input actions, skipping[/dim]")
            return True

        # Check if this product already has a TCG-prefixed card
        tcg_card_id = f"{set_id}-TCG{product_id}"
        try:
            result = self.supabase.table('pokemon_cards')\
                .select('id')\
                .eq('id', tcg_card_id)\
                .execute()

            if result.data:
                console.print(f"[dim]Product {product_id} already has TCG card {tcg_card_id}, skipping[/dim]")
                return True
        except Exception:
            pass

        # Try multiple card ID formats
        card_id = self.try_multiple_card_ids(set_id, card_number)

        if not card_id:
            # Track unmapped card for human review
            self.stats['unmapped_cards'].append({
                'set_id': set_id,
                'card_number': card_number,
                'product_name': product.get('name'),
                'product_id': product.get('productId'),
                'reason': 'Card not found in database',
                'action': 'review',
                'tcg_product': product
            })
            return False

        # Check if product already exists
        if self.check_product_exists_in_tcg_products(card_id, product['productId']):
            console.print(f"[dim]Product {product['productId']} already exists for card {card_id}, skipping[/dim]")
            return True  # Consider this successful

        # Update the card
        if not self.dry_run:
            try:
                self.update_card_variant_data(card_id, product, [], is_single_product=True)
                self.stats['cards_updated'] += 1
                return True
            except Exception as e:
                console.print(f"[red]Error updating card {card_id}: {e}[/red]")
                self.stats['errors'] += 1
                return False
        else:
            return True  # Dry run success

    def sync_multi_variant_card(self, set_id: str, card_number: str, products: List[Dict]) -> bool:
        """Handle complex 1:many product mapping. Returns True if successful."""
        # Filter out products that were already processed in input actions
        unprocessed_products = [p for p in products if p.get('productId') not in self.processed_product_ids]

        # Also filter out products that already have TCG-prefixed cards
        remaining_products = []
        for product in unprocessed_products:
            product_id = product.get('productId')
            tcg_card_id = f"{set_id}-TCG{product_id}"
            try:
                result = self.supabase.table('pokemon_cards')\
                    .select('id')\
                    .eq('id', tcg_card_id)\
                    .execute()

                if result.data:
                    console.print(f"[dim]Product {product_id} already has TCG card {tcg_card_id}, skipping[/dim]")
                    continue
            except Exception:
                pass
            remaining_products.append(product)

        unprocessed_products = remaining_products

        if not unprocessed_products:
            console.print(f"[dim]All products for card {card_number} already processed in input actions or have TCG cards, skipping[/dim]")
            return True

        # Try multiple card ID formats
        card_id = self.try_multiple_card_ids(set_id, card_number)

        if not card_id:
            # Track unmapped card for human review
            self.stats['unmapped_cards'].append({
                'set_id': set_id,
                'card_number': card_number,
                'product_names': [p.get('name') for p in unprocessed_products],
                'product_ids': [p.get('productId') for p in unprocessed_products],
                'reason': 'Multi-variant card not found in database',
                'action': 'review',
                'tcg_products': unprocessed_products
            })
            return False

        # Check if any unprocessed products already exist
        existing_products = []
        new_products = []
        for product in unprocessed_products:
            if self.check_product_exists_in_tcg_products(card_id, product['productId']):
                existing_products.append(product)
            else:
                new_products.append(product)

        if not new_products:
            console.print(f"[dim]All remaining products already exist for card {card_id}, skipping[/dim]")
            return True  # Consider this successful

        # Create variant card object with only new products
        variant_card = VariantCard(card_number, set_id)
        for product in new_products:
            variant_card.add_product(product)

        # Classify variants and determine base
        classified_products = variant_card.classify_variants()

        # Build tcgplayer_products array
        products_array = variant_card.build_tcgplayer_products_array(classified_products)

        console.print(f"[cyan]Multi-variant card {card_id} - adding {len(new_products)} new products:[/cyan]")
        for classified in classified_products:
            product = classified['product']
            variant_type = classified['variant_type']
            is_primary = product['productId'] == variant_card.base_product['productId']
            status = "[green]PRIMARY[/green]" if is_primary else ""
            console.print(f"  - {product['name']} ({variant_type}) {status}")

        if not self.dry_run:
            # Update the card with new products
            try:
                self.update_card_variant_data(card_id, variant_card.base_product, products_array)
                self.stats['cards_updated'] += 1
                self.stats['variants_fixed'] += 1
                return True
            except Exception as e:
                console.print(f"[red]Error updating card {card_id}: {e}[/red]")
                self.stats['errors'] += 1
                return False
        else:
            return True  # Dry run success

    def update_card_variant_data(self, card_id: str, base_product: Dict, products_array: List[Dict], is_single_product: bool = False):
        """Update card with new variant data structure"""
        try:
            # Get current card data to append to existing products
            result = self.supabase.table('pokemon_cards')\
                .select('tcgplayer_products')\
                .eq('id', card_id)\
                .execute()

            current_products = []
            if result.data:
                current_tcg_products = result.data[0].get('tcgplayer_products')
                if current_tcg_products:
                    if isinstance(current_tcg_products, str):
                        current_products = json.loads(current_tcg_products)
                    else:
                        current_products = current_tcg_products

            # If single product, build minimal products array
            if is_single_product:
                new_product = {
                    'product_id': base_product['productId'],
                    'variant_types': ['normal', 'reverse', 'holo'],  # Default variants
                    'name': base_product['name'],
                    'image_url': base_product['imageUrl'],
                    'is_primary': len(current_products) == 0  # Primary if it's the first product
                }
                products_array = [new_product]

            # Append new products to existing ones
            all_products = current_products + products_array

            # Determine variant flags from all products
            variant_flags = {
                'variant_poke_ball': any('poke_ball' in p.get('variant_types', []) for p in all_products),
                'variant_master_ball': any('master_ball' in p.get('variant_types', []) for p in all_products)
            }

            # Find primary product for main fields
            primary_product = next((p for p in all_products if p.get('is_primary')), all_products[0] if all_products else base_product)
            primary_product_id = primary_product.get('product_id') if isinstance(primary_product, dict) else base_product['productId']
            primary_image_url = primary_product.get('image_url') if isinstance(primary_product, dict) else base_product['imageUrl']

            # Update the card
            update_data = {
                'tcgplayer_product_id': primary_product_id,
                'tcgplayer_image_url': primary_image_url,
                'tcgplayer_products': json.dumps(all_products),
                'updated_at': datetime.now().isoformat(),
                **variant_flags
            }

            result = self.supabase.table('pokemon_cards')\
                .update(update_data)\
                .eq('id', card_id)\
                .execute()

            if not result.data:
                console.print(f"[yellow]Warning: No rows updated for card {card_id}[/yellow]")

        except Exception as e:
            console.print(f"[red]Error updating card {card_id}: {e}[/red]")
            self.stats['errors'] += 1

    def sync_all_sets(self):
        """Sync variants for all sets with TCGPlayer group IDs"""
        console.print("\n[bold]Syncing variants for all sets...[/bold]")

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

        console.print(f"Found [blue]{len(sets)}[/blue] sets with TCGPlayer group IDs")

        for set_data in sets:
            self.sync_set_variants(set_data['id'])

    def save_unmapped_cards(self):
        """Save unmapped cards to JSON file for human review"""
        filename = "unmapped_cards.json"

        if self.stats['unmapped_cards']:
            # Group products by set_id for efficient processing
            sets_data = {}
            for card in self.stats['unmapped_cards']:
                set_id = card.get('set_id')
                if set_id not in sets_data:
                    sets_data[set_id] = {'products': []}
                sets_data[set_id]['products'].append(card)

            # Structure the output data
            output_data = {
                'timestamp': datetime.now().isoformat(),
                'summary': {
                    'total_unmapped': len(self.stats['unmapped_cards']),
                    'sets_affected': len(sets_data)
                },
                'sets': sets_data
            }

            try:
                with open(filename, 'w') as f:
                    json.dump(output_data, f, indent=2)
                console.print(f"\n[yellow]📄 Saved {len(self.stats['unmapped_cards'])} unmapped cards to: {filename}[/yellow]")
            except Exception as e:
                console.print(f"[red]Error saving unmapped cards: {e}[/red]")
        else:
            # Create success file even when no unmapped cards
            output_data = {
                'timestamp': datetime.now().isoformat(),
                'summary': {
                    'total_unmapped': 0,
                    'sets_affected': 0,
                    'message': 'All cards successfully mapped! No unmapped cards found.'
                },
                'sets': {}
            }

            try:
                with open(filename, 'w') as f:
                    json.dump(output_data, f, indent=2)
                console.print(f"\n[green]✅ No unmapped cards found! Saved success status to: {filename}[/green]")
            except Exception as e:
                console.print(f"[red]Error saving success status: {e}[/red]")

    def print_summary(self):
        """Print sync summary"""
        console.print(f"\n[bold]Sync Summary:[/bold]")
        console.print(f"Sets processed: [blue]{self.stats['sets_processed']}[/blue]")
        console.print(f"Input actions processed: [cyan]{self.stats['input_actions_processed']}[/cyan]")
        console.print(f"Cards updated: [green]{self.stats['cards_updated']}[/green]")
        console.print(f"Cards created: [green]{self.stats['cards_created']}[/green]")
        console.print(f"Automatic updates: [green]{self.stats['automatic_updates']}[/green]")
        console.print(f"Multi-variant cards found: [cyan]{self.stats['multi_product_cards']}[/cyan]")
        console.print(f"Variant mappings fixed: [green]{self.stats['variants_fixed']}[/green]")
        console.print(f"Unmapped cards: [yellow]{len(self.stats['unmapped_cards'])}[/yellow]")
        console.print(f"Errors: [red]{self.stats['errors']}[/red]")

        # Always save unmapped cards file (even if empty for success status)
        self.save_unmapped_cards()

        if self.dry_run:
            console.print("\n[yellow]DRY RUN - No database changes were made[/yellow]")


def main():
    """Entry point for the script"""
    parser = argparse.ArgumentParser(description='Enhanced Pokemon Card Variant Sync')
    parser.add_argument('--set', help='Sync variants for a specific set (e.g., sv08.5)')
    parser.add_argument('--all-sets', action='store_true', help='Sync variants for all sets')
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without updating database')

    args = parser.parse_args()

    if not args.set and not args.all_sets:
        parser.print_help()
        return

    syncer = EnhancedVariantSync(dry_run=args.dry_run)

    # Rename unmapped_cards.json to unmapped_cards_input.json at start
    syncer.rename_unmapped_cards_file()

    # Load input file after renaming
    syncer.input_data = syncer.load_input_file()

    try:
        if args.set:
            syncer.sync_set_variants(args.set)
        elif args.all_sets:
            syncer.sync_all_sets()

        syncer.print_summary()

    except KeyboardInterrupt:
        console.print("\n[red]Sync interrupted by user[/red]")
    except Exception as e:
        console.print(f"\n[red]Fatal error: {e}[/red]")


if __name__ == "__main__":
    main()