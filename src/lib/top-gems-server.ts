/**
 * Server-side module for fetching top gems (most valuable cards)
 *
 * Fetches user's collection cards sorted by current market value,
 * returning the top 3 most valuable cards for the dashboard widget.
 *
 * ALL DATABASE ACCESS IS SERVER-SIDE ONLY.
 *
 * @module top-gems-server
 */

import { getAuthenticatedSupabaseClient } from './supabase-server'
import { getCardImageUrl } from './pokemon-db'
import type { TopGem, TopGemsResponse } from '@/types/top-gem'

/**
 * Raw data shape from Supabase query
 */
interface RawCardData {
  id: string
  pokemon_card_id: string
  variant: string
  variant_pattern: string | null
  condition: string | null
  pokemon_card: {
    id: string
    name: string
    image: string | null
    tcgplayer_image_url: string | null
    local_id: string | null
    pokemon_set: {
      name: string
    } | null
    pokemon_card_prices: RawPriceRecord[]
  }
}

/**
 * Raw price record shape from nested query
 */
interface RawPriceRecord {
  current_market_price: number | null
  variant_pattern: string | null
  prices_raw: PricesRawData | null
}

/**
 * Shape of the prices_raw JSONB field
 */
interface PricesRawData {
  market?: number
  variants?: Record<string, Record<string, { price?: number }>>
}

/**
 * Maps collection card variant values to TCG price variant keys
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
 * Finds the matching price record for a card's variant_pattern
 */
function findMatchingPriceRecord(
  priceRecords: RawPriceRecord[] | undefined,
  cardVariantPattern: string | null
): RawPriceRecord | null {
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
  pricesRaw: PricesRawData | null,
  variantKey: string,
  conditionKey: string
): number | null {
  if (!pricesRaw || typeof pricesRaw !== 'object') {
    return null
  }

  if (!pricesRaw.variants || typeof pricesRaw.variants !== 'object') {
    return null
  }

  const variantPrices = pricesRaw.variants[variantKey]
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
 * Calculates the market value for a card
 *
 * Priority order (matches collectionPriceUtils.ts):
 * 1. Exact variant/condition price from prices_raw
 * 2. current_market_price from price record
 * 3. Market average from prices_raw
 * 4. 0 if no price found
 */
function calculateCardValue(
  card: RawCardData,
  priceRecord: RawPriceRecord | null
): number {
  if (!priceRecord) {
    return 0
  }

  // Priority 1: Extract exact variant/condition price from prices_raw
  const variantKey = VARIANT_TO_PRICE_KEY[card.variant] ?? 'Normal'
  const conditionKey = CONDITION_TO_PRICE_KEY[card.condition ?? ''] ?? 'Near Mint'

  const exactPrice = extractPriceFromRaw(priceRecord.prices_raw, variantKey, conditionKey)
  if (exactPrice !== null) {
    return exactPrice
  }

  // Priority 2: current_market_price
  if (priceRecord.current_market_price && priceRecord.current_market_price > 0) {
    return priceRecord.current_market_price
  }

  // Priority 3: Market average from prices_raw
  const rawData = priceRecord.prices_raw
  if (rawData?.market) {
    const marketPrice = Number(rawData.market)
    if (marketPrice > 0) {
      return marketPrice
    }
  }

  return 0
}

/**
 * Gets the user's top 3 most valuable cards
 *
 * Fetches collection cards with prices, calculates value using
 * raw/market pricing, sorts by value descending, and returns top 3.
 *
 * @returns Promise containing top gems array
 *
 * @example
 * ```typescript
 * export default async function DashboardPage() {
 *   const { gems } = await getTopGems()
 *   return <TopGemsWidget gems={gems} />
 * }
 * ```
 */
export async function getTopGems(): Promise<TopGemsResponse> {
  try {
    const supabase = await getAuthenticatedSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { gems: [] }
    }

    // Fetch collection cards with pokemon card data and prices
    const { data: cardsData, error: cardsError } = await supabase
      .from('collection_cards')
      .select(
        `
        id,
        pokemon_card_id,
        variant,
        variant_pattern,
        condition,
        pokemon_card:pokemon_cards!inner(
          id,
          name,
          image,
          tcgplayer_image_url,
          local_id,
          pokemon_set:pokemon_sets(name),
          pokemon_card_prices(
            current_market_price,
            variant_pattern,
            prices_raw
          )
        )
      `
      )
      .eq('user_id', user.id)
      .not('pokemon_card_id', 'is', null)

    if (cardsError || !cardsData || cardsData.length === 0) {
      if (cardsError) {
        console.error('Error fetching collection cards:', cardsError)
      }
      return { gems: [] }
    }

    // Calculate value for each card and create sortable array
    const cardsWithValue: { card: RawCardData; value: number }[] = []

    for (const rawCard of cardsData) {
      const card = rawCard as unknown as RawCardData

      // Find matching price record
      const priceRecord = findMatchingPriceRecord(
        card.pokemon_card.pokemon_card_prices,
        card.variant_pattern
      )

      const value = calculateCardValue(card, priceRecord)

      // Only include cards with a value > 0
      if (value > 0) {
        cardsWithValue.push({ card, value })
      }
    }

    // Sort by value descending and take top 3
    cardsWithValue.sort((a, b) => b.value - a.value)
    const topCards = cardsWithValue.slice(0, 3)

    // Transform to TopGem format with ranks
    const gems: TopGem[] = topCards.map((item, index) => {
      const { card, value } = item
      const pokemon = card.pokemon_card

      // Get image URL with fallback chain
      const imageUrl = getCardImageUrl(
        pokemon.image || undefined,
        'low',
        pokemon.tcgplayer_image_url || undefined
      )

      return {
        collectionCardId: card.id,
        pokemonCardId: pokemon.id,
        cardName: pokemon.name,
        setName: pokemon.pokemon_set?.name || 'Unknown Set',
        cardNumber: pokemon.local_id || null,
        imageUrl,
        currentValue: value,
        rank: (index + 1) as 1 | 2 | 3,
      }
    })

    return { gems }
  } catch (error) {
    console.error('Error in getTopGems:', error)
    return { gems: [] }
  }
}
