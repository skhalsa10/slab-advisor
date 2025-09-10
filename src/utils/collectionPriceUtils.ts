/**
 * Utility functions for handling price data in collection cards
 */

import { type CollectionCard } from '@/types/database'
import { type CollectionCardWithPokemon } from '@/utils/collectionCardUtils'
import { extractMarketPrices } from './priceUtils'

/**
 * Maps collection card variant values to TCG price variant names
 * 
 * Collection variants: "normal", "holo", "reverse_holo", "first_edition"
 * TCG price variants: "Normal", "Holofoil", "Reverse Holofoil", "1st Edition Normal", "1st Edition Holofoil"
 */
const VARIANT_TO_PRICE_MAP: Record<string, string[]> = {
  'normal': ['Normal'],
  'holo': ['Holofoil', 'Holo'],
  'reverse_holo': ['Reverse Holofoil', 'Reverse'],
  'first_edition': ['1st Edition Normal', '1st Edition Holofoil', '1st Edition']
}

/**
 * Gets the price for a specific collection card variant
 * @param card - The collection card (must include pokemon_card with price_data)
 * @returns The price for the card's variant or null if not found
 */
export function getCollectionCardPrice(card: CollectionCardWithPokemon): number | null {
  if (!card.pokemon_card?.price_data) return null
  
  const prices = extractMarketPrices(card.pokemon_card.price_data)
  if (!prices) return null
  
  // Get the variant price mappings for this card's variant
  const priceVariantNames = VARIANT_TO_PRICE_MAP[card.variant] || []
  
  // Try to find a matching price variant
  for (const variantName of priceVariantNames) {
    if (prices[variantName] && prices[variantName] > 0) {
      return prices[variantName]
    }
  }
  
  // If no exact match, fall back to the lowest available price
  const allPrices = Object.values(prices).filter(price => price > 0)
  return allPrices.length > 0 ? Math.min(...allPrices) : null
}

/**
 * Formats a price value as a currency string
 * @param price - The price value
 * @returns Formatted price string (e.g., "$12.99")
 */
export function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return '—'
  return `$${price.toFixed(2)}`
}

/**
 * Calculates the total value for a collection card (price × quantity)
 * @param card - The collection card with pokemon_card data
 * @returns The total value or null if price not available
 */
export function getCardTotalValue(card: CollectionCardWithPokemon): number | null {
  const price = getCollectionCardPrice(card)
  if (price === null) return null
  
  const quantity = card.quantity || 1
  return price * quantity
}

/**
 * Formats the total value for display
 * @param card - The collection card with pokemon_card data
 * @returns Formatted total value string
 */
export function formatCardTotalValue(card: CollectionCardWithPokemon): string {
  const total = getCardTotalValue(card)
  return formatPrice(total)
}

/**
 * Calculates the total collection value from an array of cards
 * @param cards - Array of collection cards with pokemon_card data
 * @returns Total collection value
 */
export function calculateCollectionValue(cards: CollectionCardWithPokemon[]): number {
  return cards.reduce((total, card) => {
    const cardValue = getCardTotalValue(card)
    return total + (cardValue || 0)
  }, 0)
}

/**
 * Gets display text for price with quantity consideration
 * @param card - The collection card with pokemon_card data
 * @param showTotal - Whether to show total (price × qty) or individual price
 * @returns Price display text
 */
export function getCollectionPriceDisplay(
  card: CollectionCardWithPokemon, 
  showTotal: boolean = false
): string {
  const price = getCollectionCardPrice(card)
  if (price === null) return 'Price unavailable'
  
  const quantity = card.quantity || 1
  
  if (showTotal && quantity > 1) {
    const total = price * quantity
    return `$${total.toFixed(2)}`
  }
  
  return `$${price.toFixed(2)}`
}

/**
 * Determines if we should show total price based on quantity
 * @param card - The collection card
 * @returns True if total should be shown (qty > 1)
 */
export function shouldShowTotalPrice(card: CollectionCard): boolean {
  return (card.quantity || 1) > 1
}