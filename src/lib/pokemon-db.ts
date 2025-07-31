/**
 * Pokemon Database module for Slab Advisor
 * 
 * This module provides database operations for Pokemon TCG data stored in Supabase.
 * It serves as a database-backed alternative to the TCGDex API, providing the same
 * interface but with local data for better performance and reliability.
 * 
 * Key features:
 * - Series, Set, and Card data management
 * - Full-text search capabilities
 * - Pagination support for large datasets
 * - Image URL handling with quality options
 * - Navigation helpers for card browsing
 * 
 * @module pokemon-db
 */

import { supabase } from './supabase'
import type {
  PokemonSeries,
  PokemonSet,
  PokemonCard,
  PokemonSearchParams,
  PokemonCardSearchParams,
  PaginatedResult,
  PokemonSetFilters,
  PokemonCardFilters,
  SerieWithSets,
  SetWithCards,
  CardBrief,
  CardFull
} from '@/models/pokemon'

/**
 * Fetch all series with their sets
 * Equivalent to getAllSeriesWithSets() from tcgdex.ts
 * 
 * @returns Promise containing array of series with their associated sets
 * @throws Error if database query fails
 * 
 * @example
 * ```typescript
 * const seriesWithSets = await getAllSeriesWithSets()
 * seriesWithSets.forEach(series => {
 *   console.log(`${series.name} has ${series.setCount} sets`)
 * })
 * ```
 */
export async function getAllSeriesWithSets(): Promise<SerieWithSets[]> {
  try {
    const { data: series, error } = await supabase
      .from('pokemon_series')
      .select(`
        *,
        sets:pokemon_sets(*)
      `)
      .order('name')

    if (error) {
      console.error('Error fetching series with sets:', error)
      throw new Error('Failed to fetch Pokemon series')
    }

    return series.map(serie => ({
      ...serie,
      sets: serie.sets || [],
      setCount: serie.sets?.length || 0
    })) as SerieWithSets[]
  } catch (error) {
    console.error('Error in getAllSeriesWithSets:', error)
    throw new Error('Failed to fetch Pokemon series')
  }
}

/**
 * Fetch all series without sets (lighter query)
 * 
 * This is a more performant alternative when set data is not needed.
 * 
 * @returns Promise containing array of series
 * @throws Error if database query fails
 * 
 * @example
 * ```typescript
 * const series = await getAllSeries()
 * console.log(`Found ${series.length} series`)
 * ```
 */
export async function getAllSeries(): Promise<PokemonSeries[]> {
  try {
    const { data, error } = await supabase
      .from('pokemon_series')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching series:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllSeries:', error)
    throw new Error('Failed to fetch Pokemon series')
  }
}

/**
 * Fetch all sets with pagination
 * 
 * Retrieves Pokemon sets with support for pagination and text search.
 * Sets are ordered by release date (newest first).
 * 
 * @param params - Search parameters including limit, offset, and query
 * @returns Promise containing paginated results with sets
 * @throws Error if database query fails
 * 
 * @example
 * ```typescript
 * // Get first page of sets
 * const result = await getAllSets({ limit: 20, offset: 0 })
 * console.log(`Found ${result.count} total sets`)
 * 
 * // Search for specific sets
 * const searchResult = await getAllSets({ query: 'Charizard', limit: 10 })
 * ```
 */
export async function getAllSets(params: PokemonSearchParams = {}): Promise<PaginatedResult<PokemonSet>> {
  try {
    const { limit = 50, offset = 0 } = params

    let query = supabase
      .from('pokemon_sets')
      .select('*', { count: 'exact' })
      .order('release_date', { ascending: false })

    if (params.query) {
      query = query.textSearch('name', params.query)
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching sets:', error)
      throw error
    }

    return {
      data: data || [],
      count: count || 0,
      hasMore: (count || 0) > offset + limit,
      offset,
      limit
    }
  } catch (error) {
    console.error('Error in getAllSets:', error)
    throw new Error('Failed to fetch Pokemon sets')
  }
}

/**
 * Fetch sets by series ID
 * 
 * Retrieves all sets belonging to a specific series,
 * ordered by release date (newest first).
 * 
 * @param seriesId - The ID of the series to fetch sets for
 * @returns Promise containing array of sets
 * @throws Error if database query fails
 * 
 * @example
 * ```typescript
 * const sets = await getSetsBySeries('sv')
 * console.log(`Scarlet & Violet has ${sets.length} sets`)
 * ```
 */
export async function getSetsBySeries(seriesId: string): Promise<PokemonSet[]> {
  try {
    const { data, error } = await supabase
      .from('pokemon_sets')
      .select('*')
      .eq('series_id', seriesId)
      .order('release_date', { ascending: false })

    if (error) {
      console.error('Error fetching sets by series:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getSetsBySeries:', error)
    throw new Error(`Failed to fetch sets for series: ${seriesId}`)
  }
}

/**
 * Fetch a specific set with all its cards
 * Equivalent to getSetWithCards() from tcgdex.ts
 * 
 * Retrieves complete set information including series data and all cards.
 * 
 * @param setId - The ID of the set to fetch
 * @returns Promise containing set with all cards and series information
 * @throws Error if set not found or database query fails
 * 
 * @example
 * ```typescript
 * const setWithCards = await getSetWithCards('sv1')
 * console.log(`${setWithCards.name} has ${setWithCards.cards.length} cards`)
 * ```
 */
export async function getSetWithCards(setId: string): Promise<SetWithCards> {
  try {
    const { data, error } = await supabase
      .from('pokemon_sets')
      .select(`
        *,
        series:pokemon_series(*),
        cards:pokemon_cards(*)
      `)
      .eq('id', setId)
      .single()

    if (error) {
      console.error('Error fetching set with cards:', error)
      throw error
    }

    if (!data) {
      throw new Error('Set not found')
    }

    return data as SetWithCards
  } catch (error) {
    console.error('Error in getSetWithCards:', error)
    throw new Error(`Failed to fetch set: ${setId}`)
  }
}

/**
 * Fetch a specific card
 * 
 * Retrieves complete card information including set and series data.
 * 
 * @param cardId - The ID of the card to fetch
 * @returns Promise containing card with set and series information
 * @throws Error if card not found or database query fails
 * 
 * @example
 * ```typescript
 * const card = await getCard('sv1-1')
 * console.log(`${card.name} from ${card.set.name}`)
 * ```
 */
export async function getCard(cardId: string): Promise<CardFull> {
  try {
    const { data, error } = await supabase
      .from('pokemon_cards')
      .select(`
        *,
        set:pokemon_sets(
          *,
          series:pokemon_series(*)
        )
      `)
      .eq('id', cardId)
      .single()

    if (error) {
      console.error('Error fetching card:', error)
      throw error
    }

    if (!data) {
      throw new Error('Card not found')
    }

    return data as CardFull
  } catch (error) {
    console.error('Error in getCard:', error)
    throw new Error(`Failed to fetch card: ${cardId}`)
  }
}

/**
 * Get all cards for a specific set
 * 
 * Retrieves cards from a specific set with pagination support.
 * Cards are ordered by their local_id within the set.
 * 
 * @param setId - The ID of the set to fetch cards from
 * @param params - Search parameters including limit, offset, and query
 * @returns Promise containing paginated results with cards
 * @throws Error if database query fails
 * 
 * @example
 * ```typescript
 * const result = await getCardsBySet('sv1', { limit: 50, offset: 0 })
 * console.log(`Found ${result.count} cards in set`)
 * ```
 */
export async function getCardsBySet(setId: string, params: PokemonCardSearchParams = {}): Promise<PaginatedResult<PokemonCard>> {
  try {
    const { limit = 100, offset = 0, query } = params

    let dbQuery = supabase
      .from('pokemon_cards')
      .select('*', { count: 'exact' })
      .eq('set_id', setId)
      .order('local_id')

    if (query) {
      dbQuery = dbQuery.textSearch('name', query)
    }

    const { data, error, count } = await dbQuery
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching cards by set:', error)
      throw error
    }

    return {
      data: data || [],
      count: count || 0,
      hasMore: (count || 0) > offset + limit,
      offset,
      limit
    }
  } catch (error) {
    console.error('Error in getCardsBySet:', error)
    throw new Error(`Failed to fetch cards for set: ${setId}`)
  }
}

/**
 * Search for sets by name
 * 
 * Performs full-text search on set names with optional filtering using the database.
 * 
 * @param query - Search query string
 * @param filters - Optional filters for series, card count, etc.
 * @returns Promise containing array of matching sets
 * @throws Error if database query fails
 * 
 * @example
 * ```typescript
 * const sets = await searchSets('Charizard', { seriesId: 'sv' })
 * console.log(`Found ${sets.length} sets matching 'Charizard'`)
 * ```
 */
export async function searchSets(query: string, filters: PokemonSetFilters = {}): Promise<PokemonSet[]> {
  try {
    let dbQuery = supabase
      .from('pokemon_sets')
      .select('*')
      .textSearch('name', query)
      .order('name')

    if (filters.seriesId) {
      dbQuery = dbQuery.eq('series_id', filters.seriesId)
    }

    if (filters.minCards) {
      dbQuery = dbQuery.gte('card_count_total', filters.minCards)
    }

    if (filters.maxCards) {
      dbQuery = dbQuery.lte('card_count_total', filters.maxCards)
    }

    const { data, error } = await dbQuery

    if (error) {
      console.error('Error searching sets:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in searchSets:', error)
    throw new Error('Failed to search sets')
  }
}

/**
 * Search for cards by name or number
 * 
 * Performs full-text search on card names with optional filtering using the database.
 * Returns brief card information for performance.
 * 
 * @param query - Search query string
 * @param filters - Optional filters for set, category, rarity, etc.
 * @returns Promise containing array of matching cards (brief format)
 * @throws Error if database query fails
 * 
 * @example
 * ```typescript
 * const cards = await searchCards('Pikachu', { rarity: 'rare' })
 * console.log(`Found ${cards.length} rare Pikachu cards`)
 * ```
 */
export async function searchCards(query: string, filters: PokemonCardFilters = {}): Promise<CardBrief[]> {
  try {
    let dbQuery = supabase
      .from('pokemon_cards')
      .select('id, local_id, name, image, rarity, category')
      .textSearch('name', query)
      .order('name')

    if (filters.setId) {
      dbQuery = dbQuery.eq('set_id', filters.setId)
    }

    if (filters.category) {
      dbQuery = dbQuery.eq('category', filters.category)
    }

    if (filters.rarity) {
      dbQuery = dbQuery.eq('rarity', filters.rarity)
    }

    if (filters.hasImage !== undefined) {
      if (filters.hasImage) {
        dbQuery = dbQuery.not('image', 'is', null)
      } else {
        dbQuery = dbQuery.is('image', null)
      }
    }

    const { data, error } = await dbQuery

    if (error) {
      console.error('Error searching cards:', error)
      throw error
    }

    return (data || []) as CardBrief[]
  } catch (error) {
    console.error('Error in searchCards:', error)
    throw new Error('Failed to search cards')
  }
}

/**
 * Get image URL with specific quality
 * 
 * Generates card image URLs with quality options.
 * Falls back to placeholder if no image URL provided.
 * 
 * @param imageUrl - Base image URL from card data
 * @param quality - Image quality ('low' or 'high')
 * @returns Complete image URL with quality suffix
 * 
 * @example
 * ```typescript
 * const lowRes = getCardImageUrl(card.image, 'low')
 * const highRes = getCardImageUrl(card.image, 'high')
 * ```
 */
export function getCardImageUrl(imageUrl: string | undefined | null, quality: 'low' | 'high' = 'low'): string {
  if (!imageUrl) return '/card-placeholder.svg'
  
  // TCGdx images support different qualities by appending to the URL
  return `${imageUrl}/${quality}.webp`
}

/**
 * Get logo URL with specific format
 * 
 * Generates set logo URLs with format options.
 * Falls back to placeholder if no logo URL provided.
 * 
 * @param logoUrl - Base logo URL from set data
 * @param format - Image format ('png' or 'webp')
 * @returns Complete logo URL with format extension
 * 
 * @example
 * ```typescript
 * const pngLogo = getLogoUrl(set.logo, 'png')
 * const webpLogo = getLogoUrl(set.logo, 'webp')
 * ```
 */
export function getLogoUrl(logoUrl: string | undefined | null, format: 'png' | 'webp' = 'png'): string {
  if (!logoUrl) return '/placeholder-logo.png'
  
  return `${logoUrl}.${format}`
}

/**
 * Get next and previous cards in a set
 * 
 * Finds the adjacent cards (previous and next) for navigation purposes.
 * Cards are ordered by their local_id within the set.
 * 
 * @param cardId - The ID of the current card
 * @param setId - The ID of the set containing the card
 * @returns Promise containing previous and next cards (null if at boundaries)
 * 
 * @example
 * ```typescript
 * const { previous, next } = await getAdjacentCards('sv1-1', 'sv1')
 * if (next) {
 *   console.log(`Next card: ${next.name}`)
 * }
 * ```
 */
export async function getAdjacentCards(cardId: string, setId: string): Promise<{
  previous: PokemonCard | null
  next: PokemonCard | null
}> {
  try {
    // Get the current card's local_id
    const { data: currentCard, error: currentError } = await supabase
      .from('pokemon_cards')
      .select('local_id')
      .eq('id', cardId)
      .single()

    if (currentError || !currentCard) {
      throw new Error('Current card not found')
    }

    // Get all cards in the set sorted by local_id
    const { data: allCards, error: allError } = await supabase
      .from('pokemon_cards')
      .select('*')
      .eq('set_id', setId)
      .order('local_id')

    if (allError) {
      throw allError
    }

    const cards = allCards || []
    const currentIndex = cards.findIndex(card => card.id === cardId)
    
    return {
      previous: currentIndex > 0 ? cards[currentIndex - 1] : null,
      next: currentIndex < cards.length - 1 ? cards[currentIndex + 1] : null
    }
  } catch (error) {
    console.error('Error getting adjacent cards:', error)
    return { previous: null, next: null }
  }
}