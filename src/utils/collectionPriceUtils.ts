/**
 * Utility functions for handling price data in collection cards
 *
 * Reads prices from the pokemon_card_prices table (joined via pokemon_card)
 * and resolves the correct price based on card variant, condition, and pattern.
 */

import { type CollectionCard } from '@/types/database'
import { type CollectionCardWithPokemon, type PokemonCardPriceRecord } from '@/utils/collectionCardUtils'

/**
 * Maps collection card variant values to TCG price variant keys
 * (matches the mapping in portfolio-server.ts snapshot_all_portfolios function)
 */
const VARIANT_TO_PRICE_KEY: Record<string, string> = {
  normal: 'Normal',
  holo: 'Holofoil',
  reverse_holo: 'Reverse Holofoil',
  first_edition: '1st Edition Holofoil',
  illustration_rare: 'Holofoil',
  alt_art: 'Holofoil',
  full_art: 'Holofoil',
  secret_rare: 'Holofoil',
}

/**
 * Maps collection card condition values to TCG price condition keys
 * (matches the mapping in portfolio-server.ts snapshot_all_portfolios function)
 */
const CONDITION_TO_PRICE_KEY: Record<string, string> = {
  mint: 'Near Mint',
  near_mint: 'Near Mint',
  lightly_played: 'Lightly Played',
  moderately_played: 'Moderately Played',
  heavily_played: 'Heavily Played',
  damaged: 'Damaged',
}

/**
 * Finds the matching price record for a collection card
 * Respects variant_pattern matching (null === null for base variants)
 */
function findMatchingPriceRecord(
  priceRecords: PokemonCardPriceRecord[] | undefined,
  cardVariantPattern: string | null
): PokemonCardPriceRecord | null {
  if (!priceRecords || priceRecords.length === 0) {
    return null
  }

  // Find price record matching the card's variant_pattern
  const matchingRecord = priceRecords.find(
    (p) =>
      (cardVariantPattern === null && p.variant_pattern === null) ||
      cardVariantPattern === p.variant_pattern
  )

  return matchingRecord || null
}

/**
 * Extracts the exact price for a variant/condition combo from prices_raw
 */
function extractPriceFromRaw(
  pricesRaw: unknown,
  variantKey: string,
  conditionKey: string
): number | null {
  if (!pricesRaw || typeof pricesRaw !== 'object') {
    return null
  }

  const rawData = pricesRaw as Record<string, unknown>

  if (!rawData.variants || typeof rawData.variants !== 'object') {
    return null
  }

  const variants = rawData.variants as Record<string, Record<string, { price?: number }>>
  const variantPrices = variants[variantKey]

  if (!variantPrices) {
    return null
  }

  const conditionPrice = variantPrices[conditionKey]?.price

  if (conditionPrice !== undefined && conditionPrice !== null && conditionPrice > 0) {
    return conditionPrice
  }

  return null
}

/**
 * Gets the price for a specific collection card variant
 *
 * Priority order:
 * 1. Exact variant/condition price from prices_raw
 * 2. current_market_price from price record
 * 3. Market average from prices_raw
 * 4. null if no price found
 *
 * @param card - The collection card (must include pokemon_card with pokemon_card_prices)
 * @returns The price for the card's variant or null if not found
 */
export function getCollectionCardPrice(card: CollectionCardWithPokemon): number | null {
  const priceRecords = card.pokemon_card?.pokemon_card_prices

  if (!priceRecords || priceRecords.length === 0) {
    return null
  }

  // Find the matching price record for this card's variant_pattern
  const priceRecord = findMatchingPriceRecord(priceRecords, card.variant_pattern ?? null)

  if (!priceRecord) {
    return null
  }

  // Priority 1: Extract exact variant/condition price from prices_raw
  const variantKey = VARIANT_TO_PRICE_KEY[card.variant] ?? 'Normal'
  const conditionKey = CONDITION_TO_PRICE_KEY[card.condition ?? ''] ??
    (priceRecord.current_market_price_condition || 'Near Mint')

  const exactPrice = extractPriceFromRaw(priceRecord.prices_raw, variantKey, conditionKey)
  if (exactPrice !== null) {
    return exactPrice
  }

  // Priority 2: current_market_price
  if (priceRecord.current_market_price && priceRecord.current_market_price > 0) {
    return priceRecord.current_market_price
  }

  // Priority 3: Market average from prices_raw
  const rawData = priceRecord.prices_raw as Record<string, unknown> | null
  if (rawData?.market) {
    const marketPrice = Number(rawData.market)
    if (marketPrice > 0) {
      return marketPrice
    }
  }

  return null
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
