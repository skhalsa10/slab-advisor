'use server'

import { getServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Featured card data for the waitlist page mockup
 */
export interface FeaturedCardData {
  cardId: string
  cardName: string
  setCode: string
  rarity: string
  rawPrice: number
  psa10Price: number
  gainAmount: number
  gainPercent: number
  lastUpdated: string
}

/**
 * Fetch the featured card price data for the waitlist page
 *
 * Returns real-time pricing data for the Mega Charizard X ex (me02-125)
 * including raw and PSA 10 graded prices to demonstrate value potential.
 */
export async function getFeaturedCardData(): Promise<FeaturedCardData | null> {
  try {
    const supabase = getServerSupabaseClient()

    // Fetch card with price data
    const { data, error } = await supabase
      .from('pokemon_card_prices')
      .select(`
        pokemon_card_id,
        current_market_price,
        psa10,
        last_updated,
        pokemon_cards!inner(
          name,
          rarity,
          pokemon_sets!inner(id)
        )
      `)
      .eq('pokemon_card_id', 'me02-125')
      .single()

    if (error || !data) {
      console.error('Error fetching featured card data:', error)
      return null
    }

    // Extract PSA 10 smart market price (most accurate)
    const psa10Data = data.psa10 as { smartMarketPrice?: { price: number } } | null
    const psa10Price = psa10Data?.smartMarketPrice?.price || 0
    const rawPrice = Number(data.current_market_price) || 0

    // Calculate gain
    const gainAmount = psa10Price - rawPrice
    const gainPercent = rawPrice > 0 ? Math.round((gainAmount / rawPrice) * 100) : 0

    // Extract card info - Supabase returns nested !inner joins as objects (not arrays) when using .single()
    const cardInfo = data.pokemon_cards as unknown as {
      name: string
      rarity: string
      pokemon_sets: { id: string }
    }

    return {
      cardId: data.pokemon_card_id,
      cardName: cardInfo?.name || 'Unknown',
      setCode: cardInfo?.pokemon_sets?.id?.toUpperCase() || 'N/A',
      rarity: cardInfo?.rarity || 'Unknown',
      rawPrice: Math.round(rawPrice),
      psa10Price: Math.round(psa10Price),
      gainAmount: Math.round(gainAmount),
      gainPercent,
      lastUpdated: data.last_updated
    }
  } catch (error) {
    console.error('Error in getFeaturedCardData:', error)
    return null
  }
}
