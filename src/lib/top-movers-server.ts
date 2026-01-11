/**
 * Top Movers Server module
 *
 * Server-side only module for fetching cards with the largest price increases.
 * Uses service role client for secure server-side access.
 *
 * IMPORTANT: This file should ONLY be imported in Server Components or API routes.
 *
 * @module top-movers-server
 */

import { getServerSupabaseClient } from './supabase-server'
import type { PokemonCard, PokemonSetWithSeries } from '@/models/pokemon'

export interface TopMoverCard extends PokemonCard {
  set: PokemonSetWithSeries
  change_7d_percent: number
  current_market_price: number | null
}

/**
 * Fetch top cards by 7-day price change percentage
 *
 * Queries the pokemon_card_prices table for cards with the highest
 * positive price change over the past 7 days, joined with card and set data.
 *
 * @param limit - Number of cards to return (default: 10)
 * @returns Array of cards with their set info and price change data
 * @throws Error if database query fails
 *
 * @example
 * ```typescript
 * export default async function ServerComponent() {
 *   const cards = await getTopMoversServer(10)
 *   return <CardCarousel cards={cards} />
 * }
 * ```
 */
export async function getTopMoversServer(limit = 10): Promise<TopMoverCard[]> {
  try {
    const supabase = getServerSupabaseClient()

    // Query pokemon_card_prices joined with pokemon_cards and pokemon_sets
    const { data, error } = await supabase
      .from('pokemon_card_prices')
      .select(`
        pokemon_card_id,
        change_7d_percent,
        current_market_price,
        pokemon_cards!inner (
          *,
          set:pokemon_sets (
            *,
            series:pokemon_series (
              id,
              name
            )
          )
        )
      `)
      .not('change_7d_percent', 'is', null)
      .gt('change_7d_percent', 0) // Only positive changes (gainers)
      .gt('current_market_price', 1) // Filter out very cheap cards (avoid noise)
      .order('change_7d_percent', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching top movers:', error)
      throw new Error('Failed to fetch top movers')
    }

    if (!data || data.length === 0) {
      return []
    }

    // Transform the data to match expected format
    return data.map((item) => {
      const card = item.pokemon_cards as unknown as PokemonCard & {
        set: PokemonSetWithSeries
      }
      return {
        ...card,
        change_7d_percent: item.change_7d_percent!,
        current_market_price: item.current_market_price,
      }
    })
  } catch (error) {
    console.error('Error in getTopMoversServer:', error)
    throw new Error('Failed to fetch top movers')
  }
}
