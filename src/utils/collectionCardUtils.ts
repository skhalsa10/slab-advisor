/**
 * Collection Card Utilities
 * 
 * Helper functions for working with collection cards consistently across the app.
 * Handles different card types (Pokemon, One Piece, Sports) and fallbacks.
 */

import type { CollectionCard } from '@/types/database'

/**
 * Price record from pokemon_card_prices table
 */
export interface PokemonCardPriceRecord {
  current_market_price: number | null
  current_market_price_condition: string | null
  current_market_price_variant: string | null
  variant_pattern: string | null
  prices_raw: unknown
}

/**
 * Extended collection card type that includes joined Pokemon card data
 * This represents the actual shape returned by database queries with joins
 */
export interface CollectionCardWithPokemon extends CollectionCard {
  pokemon_card?: {
    id: string
    name: string
    local_id: string | null
    rarity: string | null
    image: string | null
    category: string | null
    illustrator: string | null
    tcgplayer_image_url: string | null
    pokemon_card_prices?: PokemonCardPriceRecord[]
    set?: {
      id: string
      name: string
      logo: string | null
      symbol: string | null
      release_date: string | null
      series?: {
        id: string
        name: string
        logo: string | null
      }
    }
  }
}

/**
 * Type guard to check if a card has joined Pokemon data
 */
function hasJoinedPokemonData(card: CollectionCard): card is CollectionCardWithPokemon {
  return 'pokemon_card' in card && card.pokemon_card !== null
}

/**
 * Gets the display name for any card type
 */
export function getCardDisplayName(card: CollectionCard): string {
  if (hasJoinedPokemonData(card) && card.pokemon_card?.name) {
    return card.pokemon_card.name
  }

  return 'Untitled Card'
}

/**
 * Gets the set name for display
 */
export function getCardSetName(card: CollectionCard): string {
  if (hasJoinedPokemonData(card) && card.pokemon_card?.set?.name) {
    return card.pokemon_card.set.name
  }

  return 'Unknown Set'
}

/**
 * Gets the series name for display
 */
export function getCardSeriesName(card: CollectionCard): string {
  if (hasJoinedPokemonData(card) && card.pokemon_card?.set?.series?.name) {
    return card.pokemon_card.set.series.name
  }

  return 'Unknown Series'
}

/**
 * Gets the card number for display
 */
export function getCardNumber(card: CollectionCard): string {
  if (hasJoinedPokemonData(card) && card.pokemon_card?.local_id) {
    return card.pokemon_card.local_id
  }

  return '???'
}

/**
 * Gets the primary image URL for the card with complete fallback chain
 * 
 * Priority order:
 * 1. Linked Pokemon database image
 * 2. TCGPlayer image (fallback)
 * 3. Placeholder image (final fallback)
 *
 * NOTE: User uploaded images (front_image_url) are private storage paths and
 * cannot be used directly with next/image. Re-enable once signed URL or
 * public bucket support is added.
 */
export function getCardImageUrl(card: CollectionCard, quality: 'low' | 'high' = 'low'): string {
  // Pokemon database image with proper formatting
  if (hasJoinedPokemonData(card) && card.pokemon_card?.image) {
    return `${card.pokemon_card.image}/${quality}.jpg`
  }
  
  // Try TCGPlayer image as additional fallback
  if (hasJoinedPokemonData(card) && card.pokemon_card?.tcgplayer_image_url) {
    return card.pokemon_card.tcgplayer_image_url
  }
  
  // Final fallback to placeholder
  return '/card-placeholder.svg'
}

/**
 * Gets a formatted variant display name
 */
export function getVariantDisplayName(variant: string): string {
  const variantMap: Record<string, string> = {
    'normal': 'Normal',
    'holo': 'Holo',
    'reverse_holo': 'Reverse Holo',
    'first_edition': '1st Edition',
    'illustration_rare': 'Illustration Rare',
    'alt_art': 'Alt Art',
    'full_art': 'Full Art',
    'secret_rare': 'Secret Rare',
    'other': 'Other'
  }
  
  return variantMap[variant] || variant
}