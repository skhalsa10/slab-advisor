/**
 * Market Movers Server module
 *
 * Server-side only module for fetching user's collection cards with the
 * biggest price movements across different time periods (24h, 7d, 30d).
 *
 * ALL DATABASE ACCESS IS SERVER-SIDE ONLY.
 * This file should ONLY be imported in Server Components or API routes.
 *
 * @module market-movers-server
 */

import { getAuthenticatedSupabaseClient } from './supabase-server'
import { getCardImageUrl } from './pokemon-db'
import type { MarketMoverCard, MarketMoversResponse } from '@/types/market-mover'
import type { VariantConditionHistory, HistoryEntry } from '@/types/prices'

/** Minimum card price to include in Market Movers. Filters out "penny stock" noise. */
const MIN_PRICE_THRESHOLD = 1.0

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
  change_7d_percent: number | null
  change_30d_percent: number | null
  raw_price_history: VariantConditionHistory | null
  variant_pattern: string | null
}

/**
 * Finds the matching price record for a card's variant_pattern.
 * Reuses the same pattern as top-gems-server.ts.
 */
function findMatchingPriceRecord(
  priceRecords: RawPriceRecord[] | undefined,
  cardVariantPattern: string | null
): RawPriceRecord | null {
  if (!priceRecords || priceRecords.length === 0) {
    return null
  }

  const matchingRecord = priceRecords.find(
    (p) =>
      (cardVariantPattern === null && p.variant_pattern === null) ||
      cardVariantPattern === p.variant_pattern
  )

  return matchingRecord || null
}

/**
 * Computes the 24h price change percentage from raw_price_history JSONB.
 *
 * Extracts the two most recent daily entries from the primary variant's
 * "Near Mint" condition and calculates the percentage change.
 *
 * @param rawHistory - The raw_price_history JSONB field
 * @returns The 24h percent change, or null if insufficient data
 */
export function compute24hChange(
  rawHistory: VariantConditionHistory | null
): number | null {
  if (!rawHistory || typeof rawHistory !== 'object') {
    return null
  }

  // Try "Normal" variant first, then fall back to first available
  const variants = Object.keys(rawHistory)
  const primaryVariant = variants.includes('Normal') ? 'Normal' : variants[0]
  if (!primaryVariant) return null

  const variantData = rawHistory[primaryVariant]
  if (!variantData || typeof variantData !== 'object') return null

  // Try "Near Mint" condition first, then fall back to first available
  const conditions = Object.keys(variantData)
  const primaryCondition = conditions.includes('Near Mint')
    ? 'Near Mint'
    : conditions[0]
  if (!primaryCondition) return null

  const entries: HistoryEntry[] = variantData[primaryCondition]
  if (!entries || !Array.isArray(entries) || entries.length < 2) return null

  // Sort entries by date ascending to get the two most recent
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const latest = sorted[sorted.length - 1]
  const previous = sorted[sorted.length - 2]

  // Verify entries are within 2 days of each other
  const latestDate = new Date(latest.date)
  const previousDate = new Date(previous.date)
  const diffDays =
    (latestDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)

  if (diffDays > 2 || previous.market <= 0) {
    return null
  }

  return ((latest.market - previous.market) / previous.market) * 100
}

/**
 * Gets the user's collection cards with price movement data.
 *
 * Fetches all collection cards with their pre-computed 7d/30d changes
 * and computes 24h changes from raw price history. Returns all cards
 * with valid price data so the client can sort by any period.
 *
 * @returns Promise containing all cards with price change data
 */
export async function getMarketMovers(): Promise<MarketMoversResponse> {
  try {
    const supabase = await getAuthenticatedSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { cards: [] }
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
            change_7d_percent,
            change_30d_percent,
            raw_price_history,
            variant_pattern
          )
        )
      `
      )
      .eq('user_id', user.id)
      .not('pokemon_card_id', 'is', null)

    if (cardsError || !cardsData || cardsData.length === 0) {
      if (cardsError) {
        console.error('Error fetching collection cards for market movers:', cardsError)
      }
      return { cards: [] }
    }

    // Process each card and compute price changes
    const cards: MarketMoverCard[] = []

    for (const rawCard of cardsData) {
      const card = rawCard as unknown as RawCardData

      // Find matching price record for this card's variant_pattern
      const priceRecord = findMatchingPriceRecord(
        card.pokemon_card.pokemon_card_prices,
        card.variant_pattern
      )

      if (!priceRecord) continue

      // Skip cards below the minimum price threshold (filters out penny stock noise)
      const currentPrice = priceRecord.current_market_price
      if (!currentPrice || currentPrice < MIN_PRICE_THRESHOLD) continue

      // Compute 24h change from raw_price_history (server-side only)
      const change24h = compute24hChange(priceRecord.raw_price_history)

      // Skip cards that have no change data at all
      const change7d = priceRecord.change_7d_percent
      const change30d = priceRecord.change_30d_percent

      if (change24h === null && change7d === null && change30d === null) {
        continue
      }

      // Get image URL with fallback chain
      const imageUrl = getCardImageUrl(
        card.pokemon_card.image || undefined,
        'low',
        card.pokemon_card.tcgplayer_image_url || undefined
      )

      cards.push({
        collectionCardId: card.id,
        pokemonCardId: card.pokemon_card.id,
        cardName: card.pokemon_card.name,
        setName: card.pokemon_card.pokemon_set?.name || 'Unknown Set',
        cardNumber: card.pokemon_card.local_id || null,
        imageUrl,
        currentPrice,
        change24h,
        change7d,
        change30d,
      })
    }

    return { cards }
  } catch (error) {
    console.error('Error in getMarketMovers:', error)
    return { cards: [] }
  }
}
