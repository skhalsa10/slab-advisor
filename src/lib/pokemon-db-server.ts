/**
 * Pokemon Database Server module for Slab Advisor
 * 
 * This module provides SERVER-ONLY database operations for Pokemon TCG data.
 * It uses service role client for secure server-side access.
 * 
 * IMPORTANT: This file should ONLY be imported in Server Components or API routes.
 * Importing this in Client Components will cause build errors.
 * 
 * @module pokemon-db-server
 */

import { getServerSupabaseClient } from './supabase-server'
import type { PokemonSetWithSeries, PokemonBrowseData, PokemonSetWithCardsAndProducts, CardFull, SetWithCards, PokemonCard } from '@/models/pokemon'


/**
 * Fetch Pokemon browse data with optimized series dropdown
 * 
 * Returns both sets and unique series data optimized for browse page.
 * Eliminates need for client-side series extraction and deduplication.
 * 
 * @returns Promise containing sets and series data for browse page
 * @throws Error if database query fails
 * 
 * @example
 * ```typescript
 * export default async function ServerComponent() {
 *   const { sets, series } = await getPokemonBrowseDataServer()
 *   return <ClientComponent initialSets={sets} seriesOptions={series} />
 * }
 * ```
 */
export async function getPokemonBrowseDataServer(): Promise<PokemonBrowseData> {
  try {
    const supabase = getServerSupabaseClient()
    
    // Fetch sets with series info
    const { data: sets, error: setsError } = await supabase
      .from('pokemon_sets')
      .select(`
        *,
        series:pokemon_series(
          id,
          name
        )
      `)
      .order('release_date', { ascending: false })
    
    if (setsError) {
      console.error('Error fetching sets with series (server):', setsError)
      throw new Error('Failed to fetch Pokemon sets')
    }
    
    // Fetch unique series for dropdown (more efficient than client-side deduplication)
    const { data: series, error: seriesError } = await supabase
      .from('pokemon_series')
      .select('id, name')
      .order('name')
    
    if (seriesError) {
      console.error('Error fetching series (server):', seriesError)
      throw new Error('Failed to fetch Pokemon series')
    }
    
    return {
      sets: (sets || []) as PokemonSetWithSeries[],
      series: series || []
    }
  } catch (error) {
    console.error('Error in getPokemonBrowseDataServer:', error)
    throw new Error('Failed to fetch Pokemon browse data')
  }
}

/**
 * Fetch a set with both cards and products (server-side)
 * 
 * Server-side version of getSetWithCardsAndProducts for use in Server Components.
 * Uses service role client for secure, server-only database access.
 * Optimized to only fetch necessary fields for better performance.
 * 
 * @param setId - The ID of the set to fetch
 * @returns Promise containing set with cards, products, and series information
 * @throws Error if set not found or database query fails
 * 
 * @example
 * ```typescript
 * export default async function ServerComponent({ params }) {
 *   const setData = await getSetWithCardsAndProductsServer(params.setId)
 *   return <ClientComponent initialData={setData} />
 * }
 * ```
 */
export async function getSetWithCardsAndProductsServer(setId: string): Promise<PokemonSetWithCardsAndProducts> {
  try {
    const supabase = getServerSupabaseClient()
    
    // Fetch set with optimized card/series data (only fields we need)
    const { data: setWithCards, error: setError } = await supabase
      .from('pokemon_sets')
      .select(`
        *,
        series:pokemon_series(
          id,
          name
        ),
        cards:pokemon_cards(
          id,
          name,
          local_id,
          rarity,
          image,
          tcgplayer_image_url,
          tcgplayer_product_id,
          price_data
        )
      `)
      .eq('id', setId)
      .single()

    if (setError) {
      console.error('Error fetching set with cards (server):', setError)
      throw new Error('Failed to fetch Pokemon set')
    }

    if (!setWithCards) {
      throw new Error('Set not found')
    }
    
    // Fetch products (we need all product fields for display)
    const { data: products, error: productsError } = await supabase
      .from('pokemon_products')
      .select('*')
      .eq('pokemon_set_id', setId)
      .order('name')

    if (productsError) {
      console.error('Error fetching products (server):', productsError)
      throw new Error('Failed to fetch Pokemon products')
    }
    
    return {
      ...setWithCards,
      products: products || []
    } as PokemonSetWithCardsAndProducts
  } catch (error) {
    console.error('Error in getSetWithCardsAndProductsServer:', error)
    throw new Error(`Failed to fetch set with cards and products: ${setId}`)
  }
}

/**
 * Fetch a single card with its set and navigation context (server-side)
 * 
 * Securely fetches card data with full set information for navigation.
 * Uses service role client to prevent client-side query manipulation.
 * 
 * @param cardId - The ID of the card to fetch
 * @returns Promise containing card with set data and navigation context
 * @throws Error if card not found or database query fails
 * 
 * @example
 * ```typescript
 * export default async function ServerComponent({ params }) {
 *   const { card, set } = await getCardWithSetServer(params.cardId)
 *   return <ClientComponent card={card} set={set} />
 * }
 * ```
 */
/**
 * Fetch newest Pokemon sets by release date (for widgets)
 *
 * Returns the most recently released sets, useful for explore page widgets
 * or any component showing recent releases.
 *
 * @param limit - Maximum number of sets to return (default: 8)
 * @returns Promise containing array of newest sets
 * @throws Error if database query fails
 *
 * @example
 * ```typescript
 * export default async function NewestSetsWidget() {
 *   const sets = await getNewestSetsServer(8)
 *   return <SetCarousel sets={sets} />
 * }
 * ```
 */
export async function getNewestSetsServer(limit = 8): Promise<PokemonSetWithSeries[]> {
  try {
    const supabase = getServerSupabaseClient()

    const { data, error } = await supabase
      .from('pokemon_sets')
      .select(`
        *,
        series:pokemon_series(
          id,
          name
        )
      `)
      .order('release_date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching newest sets (server):', error)
      throw new Error('Failed to fetch newest Pokemon sets')
    }

    return (data || []) as PokemonSetWithSeries[]
  } catch (error) {
    console.error('Error in getNewestSetsServer:', error)
    throw new Error('Failed to fetch newest Pokemon sets')
  }
}

/**
 * Fetch top priced cards from the most recent sets (for widgets)
 *
 * Returns high-value cards from recently released sets. Useful for
 * explore page widgets showing valuable new releases.
 *
 * @param numSets - Number of recent sets to fetch cards from (default: 2)
 * @param cardsPerSet - Maximum cards per set (default: 5)
 * @returns Promise containing array of cards with set info
 * @throws Error if database query fails
 *
 * @example
 * ```typescript
 * export default async function TopCardsWidget() {
 *   const cards = await getTopCardsFromNewestSetsServer(2, 5)
 *   return <CardCarousel cards={cards} />
 * }
 * ```
 */
export async function getTopCardsFromNewestSetsServer(
  numSets = 2,
  cardsPerSet = 5
): Promise<Array<PokemonCard & { set: PokemonSetWithSeries }>> {
  try {
    const supabase = getServerSupabaseClient()

    // First get the ID of the "Pokémon TCG Pocket" series to exclude
    const { data: pocketSeries } = await supabase
      .from('pokemon_series')
      .select('id')
      .eq('name', 'Pokémon TCG Pocket')
      .single()

    // Get the N most recent sets, excluding TCG Pocket series
    let setsQuery = supabase
      .from('pokemon_sets')
      .select('id, name, release_date, series_id')
      .order('release_date', { ascending: false })

    // Exclude TCG Pocket series if it exists
    if (pocketSeries?.id) {
      setsQuery = setsQuery.neq('series_id', pocketSeries.id)
    }

    const { data: recentSets, error: setsError } = await setsQuery.limit(numSets)

    if (setsError) {
      console.error('Error fetching recent sets (server):', setsError)
      throw new Error('Failed to fetch recent Pokemon sets')
    }

    if (!recentSets || recentSets.length === 0) {
      return []
    }

    const setIds = recentSets.map(s => s.id)

    // Fetch cards from these sets with their set info
    // Note: We fetch more than needed and then filter/sort in JS
    // because Supabase doesn't support complex ordering on JSONB fields
    const { data: cards, error: cardsError } = await supabase
      .from('pokemon_cards')
      .select(`
        *,
        set:pokemon_sets(
          *,
          series:pokemon_series(
            id,
            name
          )
        )
      `)
      .in('set_id', setIds)
      .not('price_data', 'is', null)

    if (cardsError) {
      console.error('Error fetching cards from recent sets (server):', cardsError)
      throw new Error('Failed to fetch cards from recent sets')
    }

    if (!cards || cards.length === 0) {
      return []
    }

    // Helper to extract the highest market price from price_data JSONB
    // price_data may come as a JSON string or already-parsed array
    const getHighestPrice = (priceData: unknown): number => {
      if (!priceData) return 0

      // Parse JSON string if needed (Supabase sometimes returns JSONB as string)
      let parsedData = priceData
      if (typeof priceData === 'string') {
        try {
          parsedData = JSON.parse(priceData)
        } catch {
          return 0
        }
      }

      // Handle array format (standard format from TCGCSV)
      if (Array.isArray(parsedData)) {
        let maxPrice = 0
        for (const variant of parsedData) {
          if (variant && typeof variant === 'object') {
            const v = variant as Record<string, unknown>
            if (typeof v.marketPrice === 'number' && v.marketPrice > maxPrice) {
              maxPrice = v.marketPrice
            }
          }
        }
        return maxPrice
      }

      // Fallback for object format (legacy or alternative structure)
      if (typeof parsedData === 'object' && parsedData !== null) {
        const data = parsedData as Record<string, unknown>
        let maxPrice = 0
        for (const key of Object.keys(data)) {
          const variant = data[key]
          if (variant && typeof variant === 'object') {
            const v = variant as Record<string, unknown>
            if (typeof v.market === 'number' && v.market > maxPrice) {
              maxPrice = v.market
            }
            if (typeof v.marketPrice === 'number' && v.marketPrice > maxPrice) {
              maxPrice = v.marketPrice
            }
          }
        }
        return maxPrice
      }

      return 0
    }

    // Group cards by set, sort by price, take top N from each
    const cardsBySet: Record<string, typeof cards> = {}
    for (const card of cards) {
      const setId = card.set_id
      if (setId && !cardsBySet[setId]) {
        cardsBySet[setId] = []
      }
      if (setId) {
        cardsBySet[setId].push(card)
      }
    }

    const result: Array<PokemonCard & { set: PokemonSetWithSeries }> = []

    for (const setId of setIds) {
      const setCards = cardsBySet[setId] || []
      // Sort by price descending and take top N
      const topCards = setCards
        .sort((a, b) => getHighestPrice(b.price_data) - getHighestPrice(a.price_data))
        .slice(0, cardsPerSet)

      result.push(...topCards as Array<PokemonCard & { set: PokemonSetWithSeries }>)
    }

    return result
  } catch (error) {
    console.error('Error in getTopCardsFromNewestSetsServer:', error)
    throw new Error('Failed to fetch top cards from newest sets')
  }
}

export async function getCardWithSetServer(cardId: string): Promise<{ card: CardFull; set: SetWithCards }> {
  try {
    const supabase = getServerSupabaseClient()
    
    // Fetch card with set and series information
    const { data: card, error: cardError } = await supabase
      .from('pokemon_cards')
      .select(`
        *,
        set:pokemon_sets(
          *,
          series:pokemon_series(*),
          cards:pokemon_cards(
            id,
            name,
            local_id,
            rarity,
            image,
            tcgplayer_image_url,
            price_data
          )
        )
      `)
      .eq('id', cardId)
      .single()

    if (cardError) {
      console.error('Error fetching card with set (server):', cardError)
      throw new Error('Failed to fetch Pokemon card')
    }

    if (!card) {
      throw new Error('Card not found')
    }

    // Extract set data for navigation
    const set = card.set as SetWithCards
    
    return {
      card: card as CardFull,
      set
    }
  } catch (error) {
    console.error('Error in getCardWithSetServer:', error)
    throw new Error(`Failed to fetch card with set: ${cardId}`)
  }
}