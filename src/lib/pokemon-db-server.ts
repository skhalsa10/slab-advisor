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
import type { PokemonSetWithSeries, PokemonBrowseData, PokemonSetWithCardsAndProducts, CardFull, SetWithCards } from '@/models/pokemon'


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