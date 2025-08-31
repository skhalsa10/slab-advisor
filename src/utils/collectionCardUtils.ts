/**
 * Collection Card Utilities
 * 
 * Helper functions for working with collection cards consistently across the app.
 * Handles different card types (Pokemon, One Piece, Sports) and fallbacks.
 */

import type { CollectionCard } from '@/types/database'

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
 * 
 * Priority order:
 * 1. Pokemon card name (if joined data exists)
 * 2. Manual card name (if unidentified)
 * 3. Fallback text
 */
export function getCardDisplayName(card: CollectionCard): string {
  // Check if pokemon_card data was joined (type-safe check)
  if (hasJoinedPokemonData(card) && card.pokemon_card?.name) {
    return card.pokemon_card.name
  }
  
  // Manual card name
  if (card.manual_card_name) {
    return card.manual_card_name
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
  
  if (card.manual_set_name) {
    return card.manual_set_name
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
  
  if (card.manual_series) {
    return card.manual_series
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
  
  if (card.manual_card_number) {
    return card.manual_card_number
  }
  
  return '???'
}

/**
 * Gets the primary image URL for the card with complete fallback chain
 * 
 * Priority order:
 * 1. User's uploaded front image (highest priority)
 * 2. Linked Pokemon database image (fallback)
 * 3. Placeholder image (final fallback)
 */
export function getCardImageUrl(card: CollectionCard, quality: 'low' | 'high' = 'low'): string {
  // User's uploaded image takes priority
  if (card.front_image_url) {
    return card.front_image_url
  }
  
  // Fall back to Pokemon database image with proper formatting
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