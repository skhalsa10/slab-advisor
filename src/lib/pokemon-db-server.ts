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
import type { Match, DatabaseCardMatch } from '@/types/ximilar'


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
    // Note: price_data is fetched separately from pokemon_card_prices table
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
          variant_normal,
          variant_holo,
          variant_reverse,
          variant_first_edition,
          variant_poke_ball,
          variant_master_ball
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

    // Fetch prices from pokemon_card_prices table for all cards in this set
    const cardIds = setWithCards.cards.map((c: { id: string }) => c.id)

    const pricesByCardId: Map<string, Array<{ subTypeName: string; marketPrice: number; variant_pattern?: string }>> = new Map()

    if (cardIds.length > 0) {
      const { data: prices, error: pricesError } = await supabase
        .from('pokemon_card_prices')
        .select('pokemon_card_id, current_market_price, current_market_price_condition, variant_pattern')
        .in('pokemon_card_id', cardIds)

      if (pricesError) {
        console.error('Error fetching card prices (server):', pricesError)
        // Don't throw - continue without prices
      } else if (prices) {
        // Group prices by card ID and transform to legacy format
        for (const price of prices) {
          const cardId = price.pokemon_card_id
          if (!pricesByCardId.has(cardId)) {
            pricesByCardId.set(cardId, [])
          }

          if (price.current_market_price && price.current_market_price > 0) {
            // Map variant_pattern to user-friendly subTypeName
            let subTypeName = price.current_market_price_condition || 'Near Mint'
            if (price.variant_pattern === 'poke_ball') {
              subTypeName = `${subTypeName} (Poké Ball)`
            } else if (price.variant_pattern === 'master_ball') {
              subTypeName = `${subTypeName} (Master Ball)`
            }

            pricesByCardId.get(cardId)!.push({
              subTypeName,
              marketPrice: price.current_market_price,
              variant_pattern: price.variant_pattern || undefined
            })
          }
        }
      }
    }

    // Merge prices into cards as price_data
    const cardsWithPrices = setWithCards.cards.map((card: { id: string }) => ({
      ...card,
      price_data: pricesByCardId.get(card.id) || null
    }))

    // Fetch products for this set
    const { data: products, error: productsError } = await supabase
      .from('pokemon_products')
      .select('*')
      .eq('pokemon_set_id', setId)
      .order('name')

    if (productsError) {
      console.error('Error fetching products (server):', productsError)
      throw new Error('Failed to fetch Pokemon products')
    }

    // Fetch latest prices from the view (Supabase can't auto-join views, so we do it manually)
    const productIds = (products || []).map((p: { id: number }) => p.id)

    const pricesByProductId: Map<number, { market_price: number | null; price_date: string | null }> = new Map()

    if (productIds.length > 0) {
      const { data: latestPrices, error: pricesError } = await supabase
        .from('pokemon_product_latest_prices')
        .select('pokemon_product_id, market_price, price_date')
        .in('pokemon_product_id', productIds)

      if (pricesError) {
        console.error('Error fetching product prices (server):', pricesError)
        // Continue without prices - graceful degradation
      } else if (latestPrices) {
        for (const price of latestPrices) {
          if (price.pokemon_product_id) {
            pricesByProductId.set(price.pokemon_product_id, {
              market_price: price.market_price,
              price_date: price.price_date
            })
          }
        }
      }
    }

    // Merge prices into products
    const productsWithPrices = (products || []).map((product: { id: number }) => ({
      ...product,
      pokemon_product_latest_prices: pricesByProductId.get(product.id) || null
    }))

    return {
      ...setWithCards,
      cards: cardsWithPrices,
      products: productsWithPrices
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

    if (cardsError) {
      console.error('Error fetching cards from recent sets (server):', cardsError)
      throw new Error('Failed to fetch cards from recent sets')
    }

    if (!cards || cards.length === 0) {
      return []
    }

    // Fetch prices from pokemon_card_prices table for all cards
    const cardIds = cards.map(c => c.id)
    const { data: prices, error: pricesError } = await supabase
      .from('pokemon_card_prices')
      .select('pokemon_card_id, current_market_price, current_market_price_condition, variant_pattern')
      .in('pokemon_card_id', cardIds)

    if (pricesError) {
      console.error('Error fetching card prices (server):', pricesError)
      // Don't throw - continue without prices
    }

    // Build a map of card ID -> highest price and price_data array
    const priceDataByCardId: Map<string, { highestPrice: number; priceData: Array<{ subTypeName: string; marketPrice: number; variant_pattern?: string }> }> = new Map()

    if (prices) {
      for (const price of prices) {
        const cardId = price.pokemon_card_id
        if (!priceDataByCardId.has(cardId)) {
          priceDataByCardId.set(cardId, { highestPrice: 0, priceData: [] })
        }

        const entry = priceDataByCardId.get(cardId)!
        const marketPrice = price.current_market_price || 0

        if (marketPrice > 0) {
          // Track highest price for sorting
          if (marketPrice > entry.highestPrice) {
            entry.highestPrice = marketPrice
          }

          // Build price_data array in legacy format
          let subTypeName = price.current_market_price_condition || 'Near Mint'
          if (price.variant_pattern === 'poke_ball') {
            subTypeName = `${subTypeName} (Poké Ball)`
          } else if (price.variant_pattern === 'master_ball') {
            subTypeName = `${subTypeName} (Master Ball)`
          }

          entry.priceData.push({
            subTypeName,
            marketPrice,
            variant_pattern: price.variant_pattern || undefined
          })
        }
      }
    }

    // Helper to get the highest price for a card
    const getHighestPrice = (cardId: string): number => {
      return priceDataByCardId.get(cardId)?.highestPrice || 0
    }

    // Filter to only cards with prices, group by set, sort by price, take top N from each
    const cardsWithPrices = cards.filter(card => getHighestPrice(card.id) > 0)

    const cardsBySet: Record<string, typeof cardsWithPrices> = {}
    for (const card of cardsWithPrices) {
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
        .sort((a, b) => getHighestPrice(b.id) - getHighestPrice(a.id))
        .slice(0, cardsPerSet)
        .map(card => ({
          ...card,
          price_data: priceDataByCardId.get(card.id)?.priceData || null
        }))

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
    // Note: price_data is fetched separately from pokemon_card_prices
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
            tcgplayer_image_url
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

    // Fetch prices from pokemon_card_prices for the main card
    const { data: prices, error: pricesError } = await supabase
      .from('pokemon_card_prices')
      .select('current_market_price, current_market_price_condition, variant_pattern')
      .eq('pokemon_card_id', cardId)

    if (pricesError) {
      console.error('Error fetching card prices (server):', pricesError)
      // Don't throw - continue without prices
    }

    // Transform prices to legacy format
    let priceData: Array<{ subTypeName: string; marketPrice: number; variant_pattern?: string }> | null = null
    if (prices && prices.length > 0) {
      priceData = []
      for (const price of prices) {
        if (price.current_market_price && price.current_market_price > 0) {
          let subTypeName = price.current_market_price_condition || 'Near Mint'
          if (price.variant_pattern === 'poke_ball') {
            subTypeName = `${subTypeName} (Poké Ball)`
          } else if (price.variant_pattern === 'master_ball') {
            subTypeName = `${subTypeName} (Master Ball)`
          }

          priceData.push({
            subTypeName,
            marketPrice: price.current_market_price,
            variant_pattern: price.variant_pattern || undefined
          })
        }
      }
      if (priceData.length === 0) {
        priceData = null
      }
    }

    // Extract set data for navigation
    const set = card.set as SetWithCards

    // Add price_data to the card
    const cardWithPrices = {
      ...card,
      price_data: priceData
    }

    return {
      card: cardWithPrices as CardFull,
      set
    }
  } catch (error) {
    console.error('Error in getCardWithSetServer:', error)
    throw new Error(`Failed to fetch card with set: ${cardId}`)
  }
}

/**
 * Match a card in our database using Ximilar identification metadata
 *
 * Uses multiple strategies to find the best match:
 * 1. Card number + set code (most accurate)
 * 2. Card name + set name
 * 3. Card name only (fallback)
 *
 * @param match - Ximilar Match data containing card metadata
 * @returns DatabaseCardMatch if found, null otherwise
 *
 * @example
 * ```typescript
 * const ximilarMatch = { card_number: '181', set_code: 'sv7', full_name: 'Pikachu ex' }
 * const dbCard = await matchCardByXimilarMetadata(ximilarMatch)
 * if (dbCard) {
 *   console.log('Found:', dbCard.name, 'in', dbCard.set_name)
 * }
 * ```
 */
export async function matchCardByXimilarMetadata(
  match: Match
): Promise<DatabaseCardMatch | null> {
  const supabase = getServerSupabaseClient()

  console.log('matchCardByXimilarMetadata input:', JSON.stringify(match, null, 2))

  // Extract TCGPlayer product ID from links
  const extractTcgplayerProductId = (links: Match['links']): string | null => {
    if (!links) return null

    let tcgplayerUrl: string | null = null

    if (Array.isArray(links)) {
      tcgplayerUrl = links.find(link => typeof link === 'string' && link.includes('tcgplayer.com/product/')) || null
    } else if (typeof links === 'object') {
      tcgplayerUrl = (links as Record<string, string>)['tcgplayer.com'] || null
    }

    if (tcgplayerUrl) {
      // Extract product ID from URL like "https://www.tcgplayer.com/product/654409"
      const match = tcgplayerUrl.match(/\/product\/(\d+)/)
      if (match) {
        return match[1]
      }
    }
    return null
  }

  // Helper to transform result - handles both array and object formats from Supabase
  // Note: price_data is not included - caller can fetch from pokemon_card_prices if needed
  const toDbMatch = (card: unknown): DatabaseCardMatch => {
    const c = card as Record<string, unknown>
    const sets = c.pokemon_sets
    // Supabase can return pokemon_sets as array or object depending on query
    const setData = Array.isArray(sets) ? sets[0] : sets
    const setName = (setData as { name?: string } | null)?.name || 'Unknown Set'

    return {
      id: c.id as string,
      name: c.name as string,
      local_id: c.local_id as string | null,
      image: c.image as string | null,
      tcgplayer_image_url: c.tcgplayer_image_url as string | null,
      rarity: c.rarity as string | null,
      set_name: setName,
      set_id: c.set_id as string,
      price_data: null, // Price data fetched separately from pokemon_card_prices
      card_type: 'pokemon'
    }
  }

  /**
   * Extract clean Pokemon name from Ximilar full_name
   * Examples:
   * - "Salazzle Sword & Shield (SSH) #028" -> "Salazzle"
   * - "Pikachu ex - Stellar Crown" -> "Pikachu ex"
   * - "Charizard VMAX" -> "Charizard VMAX"
   */
  const extractPokemonName = (fullName: string): string => {
    let name = fullName

    // Remove set code in parentheses: "Salazzle Sword & Shield (SSH) #028" -> "Salazzle Sword & Shield #028"
    name = name.replace(/\s*\([A-Z0-9]+\)\s*/g, ' ')

    // Remove card number: "#028" or "028/210"
    name = name.replace(/\s*#?\d+(?:\/\d+)?\s*$/, '')

    // Remove set name after " - ": "Pikachu ex - Stellar Crown" -> "Pikachu ex"
    name = name.split(' - ')[0]

    // Remove common set name patterns that might be appended
    // e.g., "Salazzle Sword & Shield" -> "Salazzle"
    const setPatterns = [
      'Sword & Shield',
      'Scarlet & Violet',
      'Sun & Moon',
      'XY',
      'Black & White',
      'Diamond & Pearl',
      'Platinum',
      'HeartGold & SoulSilver',
      'Legendary Collection',
      'Base Set',
      'Jungle',
      'Fossil',
      'Team Rocket',
      'Gym Heroes',
      'Gym Challenge',
      'Neo Genesis',
      'Neo Discovery',
      'Neo Revelation',
      'Neo Destiny'
    ]

    for (const pattern of setPatterns) {
      if (name.includes(pattern)) {
        name = name.replace(pattern, '').trim()
      }
    }

    return name.trim()
  }

  // Strategy 0: Match by TCGPlayer product ID (most accurate)
  const tcgplayerProductId = extractTcgplayerProductId(match.links)
  if (tcgplayerProductId) {
    console.log('Strategy 0 - TCGPlayer product ID:', tcgplayerProductId)

    const { data: cards, error } = await supabase
      .from('pokemon_cards')
      .select(`
        id,
        name,
        local_id,
        image,
        tcgplayer_image_url,
        rarity,
        set_id,
        pokemon_sets!inner(name, id)
      `)
      .eq('tcgplayer_product_id', parseInt(tcgplayerProductId))
      .limit(1)

    if (!error && cards && cards.length > 0) {
      console.log('Strategy 0 - Found match:', cards[0])
      return toDbMatch(cards[0])
    }
    console.log('Strategy 0 - No match found')
  }

  // Strategy 1: Match by card_number and set_code
  if (match.card_number && match.set_code) {
    console.log('Strategy 1 - card_number:', match.card_number, 'set_code:', match.set_code)

    // Try exact set code match first
    const { data: cards, error } = await supabase
      .from('pokemon_cards')
      .select(`
        id,
        name,
        local_id,
        image,
        tcgplayer_image_url,
        rarity,
        set_id,
        pokemon_sets!inner(name, id)
      `)
      .eq('local_id', match.card_number)
      .ilike('pokemon_sets.id', `%${match.set_code.toLowerCase()}%`)
      .limit(1)

    if (!error && cards && cards.length > 0) {
      console.log('Strategy 1 - Found match:', cards[0])
      return toDbMatch(cards[0])
    }
    console.log('Strategy 1 - No match found')
  }

  // Strategy 2: Match by name and set name
  if (match.full_name && match.set) {
    // Extract clean Pokemon name from Ximilar format
    const baseName = extractPokemonName(match.full_name)
    console.log('Strategy 2 - baseName:', baseName, 'set:', match.set)

    const { data: cards, error } = await supabase
      .from('pokemon_cards')
      .select(`
        id,
        name,
        local_id,
        image,
        tcgplayer_image_url,
        rarity,
        set_id,
        pokemon_sets!inner(name, id)
      `)
      .ilike('name', `%${baseName}%`)
      .ilike('pokemon_sets.name', `%${match.set}%`)
      .limit(5)

    if (!error && cards && cards.length > 0) {
      // If we have a card number, try to find exact match
      if (match.card_number) {
        const exactMatch = cards.find(
          (c: { local_id: string | null }) => c.local_id === match.card_number
        )
        if (exactMatch) {
          return toDbMatch(exactMatch)
        }
      }
      // Return first match
      return toDbMatch(cards[0])
    }
  }

  // Strategy 3: Fallback to name-only search
  if (match.full_name) {
    const baseName = extractPokemonName(match.full_name)
    console.log('Strategy 3 - baseName:', baseName)

    const { data: cards, error } = await supabase
      .from('pokemon_cards')
      .select(`
        id,
        name,
        local_id,
        image,
        tcgplayer_image_url,
        rarity,
        set_id,
        pokemon_sets!inner(name, id)
      `)
      .ilike('name', `%${baseName}%`)
      .limit(1)

    if (!error && cards && cards.length > 0) {
      console.log('Strategy 3 - Found match:', cards[0])
      return toDbMatch(cards[0])
    }
  }

  // Strategy 4: Match by card number and extracted name (for when set doesn't match)
  if (match.card_number && match.full_name) {
    const baseName = extractPokemonName(match.full_name)
    console.log('Strategy 4 - baseName:', baseName, 'card_number:', match.card_number)

    const { data: cards, error } = await supabase
      .from('pokemon_cards')
      .select(`
        id,
        name,
        local_id,
        image,
        tcgplayer_image_url,
        rarity,
        set_id,
        pokemon_sets!inner(name, id)
      `)
      .eq('local_id', match.card_number)
      .ilike('name', `%${baseName}%`)
      .limit(1)

    if (!error && cards && cards.length > 0) {
      console.log('Strategy 4 - Found match:', cards[0])
      return toDbMatch(cards[0])
    }
    console.log('Strategy 4 - No match found')
  }

  // Strategy 5: Match by card number + set name partial match (for set name variations)
  if (match.card_number && match.set) {
    // Try to match set by partial name - Ximilar may return "Sword & Shield" while DB has "Sword & Shield Base Set"
    const setWords = match.set.split(/\s+/).filter(word => word.length > 2)
    console.log('Strategy 5 - card_number:', match.card_number, 'set words:', setWords)

    if (setWords.length > 0) {
      // Build a search using the first significant word of the set name
      const primarySetWord = setWords[0]

      const { data: cards, error } = await supabase
        .from('pokemon_cards')
        .select(`
          id,
          name,
          local_id,
          image,
          tcgplayer_image_url,
          rarity,
          set_id,
          pokemon_sets!inner(name, id)
        `)
        .eq('local_id', match.card_number)
        .ilike('pokemon_sets.name', `%${primarySetWord}%`)
        .limit(5)

      if (!error && cards && cards.length > 0) {
        // If multiple matches, try to find one where more set words match
        if (cards.length > 1 && setWords.length > 1) {
          for (const card of cards) {
            const cardSetName = ((card.pokemon_sets as { name?: string })?.name || '').toLowerCase()
            const matchCount = setWords.filter(word => cardSetName.includes(word.toLowerCase())).length
            if (matchCount >= 2) {
              console.log('Strategy 5 - Found best match with multiple word matches:', card)
              return toDbMatch(card)
            }
          }
        }
        console.log('Strategy 5 - Found match:', cards[0])
        return toDbMatch(cards[0])
      }
    }
    console.log('Strategy 5 - No match found')
  }

  console.log('No match found for:', match.full_name, 'in set:', match.set)
  return null
}