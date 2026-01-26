/**
 * Server-side Collection module for Slab Advisor
 * 
 * This module provides secure server-side data fetching for user collection data.
 * All database queries are performed server-side with proper authentication checks.
 * 
 * @module collection-server
 */

import { getAuthenticatedSupabaseClient } from './supabase-server'
import { type CollectionCard, type DashboardStats } from '@/types/database'
import { type CollectionProductWithPriceChanges } from '@/utils/collectionProductUtils'

/**
 * Gets the authenticated user's collection cards from server-side context
 * 
 * Fetches all collection cards for the current user with full Pokemon card data,
 * set information, and series details. This function validates authentication
 * server-side and ensures secure data access.
 * 
 * @returns Promise containing user's collection cards or throws error
 * 
 * @throws {Error} When user is not authenticated or query fails
 * 
 * @example
 * ```typescript
 * export default async function CollectionPage() {
 *   try {
 *     const cards = await getUserCollectionCards()
 *     return <CollectionClient cards={cards} />
 *   } catch (error) {
 *     throw error // Handled by error.tsx
 *   }
 * }
 * ```
 */
export async function getUserCollectionCards(): Promise<CollectionCard[]> {
  try {
    // Create authenticated Supabase client that respects RLS policies
    const supabase = await getAuthenticatedSupabaseClient()
    
    // Validate user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('User not authenticated')
    }
    
    // Fetch user's collection cards with full Pokemon data and prices
    const { data: cardsData, error: cardsError } = await supabase
      .from('collection_cards')
      .select(`
        *,
        pokemon_card:pokemon_cards(
          *,
          pokemon_card_prices(
            current_market_price,
            current_market_price_condition,
            current_market_price_variant,
            variant_pattern,
            prices_raw
          ),
          set:pokemon_sets(
            *,
            series:pokemon_series(*)
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (cardsError) {
      console.error('Error fetching collection cards:', cardsError)
      throw new Error('Failed to load collection cards')
    }
    
    return cardsData || []

  } catch (error) {
    console.error('Error in getUserCollectionCards:', error)
    throw error instanceof Error ? error : new Error('Failed to load collection')
  }
}

/**
 * Gets ownership statistics for a specific set
 *
 * Returns the count of unique cards the authenticated user owns from a given set.
 * This function handles unauthenticated users gracefully by returning 0.
 *
 * @param setId - The ID of the Pokemon set to check ownership for
 * @returns Promise containing ownership stats { ownedCount: number }
 *
 * @example
 * ```typescript
 * const stats = await getSetOwnershipStats('sv8pt5')
 * console.log(`You own ${stats.ownedCount} cards from this set`)
 * ```
 */
export async function getSetOwnershipStats(setId: string): Promise<{ ownedCount: number }> {
  try {
    const supabase = await getAuthenticatedSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Return 0 for unauthenticated users (graceful handling)
    if (authError || !user) {
      return { ownedCount: 0 }
    }

    // Query collection_cards joined with pokemon_cards to filter by set_id
    // Count unique pokemon_card_id entries (a user may have multiple variants of the same card)
    const { data, error } = await supabase
      .from('collection_cards')
      .select(`
        pokemon_card_id,
        pokemon_card:pokemon_cards!inner(set_id)
      `)
      .eq('user_id', user.id)
      .eq('pokemon_card.set_id', setId)

    if (error) {
      console.error('Error fetching set ownership stats:', error)
      return { ownedCount: 0 }
    }

    // Count unique pokemon_card_ids (user may own multiple variants of same card)
    const uniqueCardIds = new Set(data?.map(item => item.pokemon_card_id) || [])

    return { ownedCount: uniqueCardIds.size }

  } catch (error) {
    console.error('Error in getSetOwnershipStats:', error)
    return { ownedCount: 0 }
  }
}

/**
 * Gets the IDs of cards the user owns from a specific set
 *
 * Returns an array of unique pokemon_card_ids that the authenticated user owns
 * from a given set. This is used for client-side filtering (owned/missing cards).
 *
 * @param setId - The ID of the Pokemon set to check ownership for
 * @returns Promise containing array of owned card IDs
 *
 * @example
 * ```typescript
 * const ownedIds = await getSetOwnedCardIds('sv8pt5')
 * const ownedSet = new Set(ownedIds)
 * const isMissing = !ownedSet.has(cardId)
 * ```
 */
export async function getSetOwnedCardIds(setId: string): Promise<string[]> {
  try {
    const supabase = await getAuthenticatedSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Return empty array for unauthenticated users (graceful handling)
    if (authError || !user) {
      return []
    }

    // Query collection_cards joined with pokemon_cards to filter by set_id
    const { data, error } = await supabase
      .from('collection_cards')
      .select(`
        pokemon_card_id,
        pokemon_card:pokemon_cards!inner(set_id)
      `)
      .eq('user_id', user.id)
      .eq('pokemon_card.set_id', setId)

    if (error) {
      console.error('Error fetching set owned card IDs:', error)
      return []
    }

    // Return unique pokemon_card_ids (user may own multiple variants of same card)
    const uniqueCardIds = [...new Set(data?.map(item => item.pokemon_card_id).filter(Boolean) || [])]

    return uniqueCardIds as string[]

  } catch (error) {
    console.error('Error in getSetOwnedCardIds:', error)
    return []
  }
}

/**
 * Gets dashboard statistics for the authenticated user
 *
 * Returns aggregated stats including total cards, estimated value,
 * and cards analyzed. Uses efficient PostgreSQL functions for server-side computation.
 *
 * @returns Promise containing dashboard stats
 * @throws {Error} When user is not authenticated or query fails
 *
 * @example
 * ```typescript
 * export default async function DashboardPage() {
 *   const stats = await getDashboardStats()
 *   return <DashboardStats stats={stats} />
 * }
 * ```
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const supabase = await getAuthenticatedSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // Call PostgreSQL function for server-side SUM
    const { data: totalCards, error } = await supabase.rpc('get_user_total_cards', {
      p_user_id: user.id
    })

    if (error) {
      console.error('Error fetching total cards:', error)
      throw new Error('Failed to load dashboard stats')
    }

    return {
      totalCards: totalCards ?? 0,
      estimatedValue: null,  // TODO: Implement in future
      cardsAnalyzed: null    // TODO: Implement in future
    }

  } catch (error) {
    console.error('Error in getDashboardStats:', error)
    throw error instanceof Error ? error : new Error('Failed to load dashboard stats')
  }
}

/**
 * Gets the authenticated user's collection products (sealed products) from server-side context
 *
 * Fetches all collection products for the current user with full Pokemon product data,
 * set information, and latest prices. This function validates authentication
 * server-side and ensures secure data access.
 *
 * @returns Promise containing user's collection products or throws error
 *
 * @throws {Error} When user is not authenticated or query fails
 *
 * @example
 * ```typescript
 * export default async function CollectionPage() {
 *   try {
 *     const products = await getUserCollectionProducts()
 *     return <CollectionClient products={products} />
 *   } catch (error) {
 *     throw error // Handled by error.tsx
 *   }
 * }
 * ```
 */
export async function getUserCollectionProducts(): Promise<CollectionProductWithPriceChanges[]> {
  try {
    // Create authenticated Supabase client that respects RLS policies
    const supabase = await getAuthenticatedSupabaseClient()

    // Validate user authentication
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // Step 1: Fetch user's collection products with Pokemon product data (no view join)
    // Supabase can't auto-join views, so we fetch prices separately
    const { data: productsData, error: productsError } = await supabase
      .from('collection_products')
      .select(
        `
        *,
        pokemon_product:pokemon_products(
          id,
          name,
          tcgplayer_image_url,
          tcgplayer_product_id,
          pokemon_set:pokemon_sets(
            id,
            name,
            logo
          )
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (productsError) {
      console.error('Error fetching collection products:', productsError)
      throw new Error('Failed to load collection products')
    }

    if (!productsData || productsData.length === 0) {
      return []
    }

    // Step 2: Get product IDs for price lookup
    const productIds = productsData
      .map((p) => p.pokemon_product?.id)
      .filter((id): id is number => id !== null && id !== undefined)

    // Step 3: Fetch prices from view separately (Supabase can't auto-join views)
    const priceMap = new Map<number, number | null>()

    if (productIds.length > 0) {
      const { data: pricesData, error: pricesError } = await supabase
        .from('pokemon_product_latest_prices')
        .select('pokemon_product_id, market_price')
        .in('pokemon_product_id', productIds)

      if (pricesError) {
        console.error('Error fetching product prices:', pricesError)
        // Continue without prices - graceful degradation
      } else if (pricesData) {
        for (const price of pricesData) {
          if (price.pokemon_product_id !== null) {
            priceMap.set(price.pokemon_product_id, price.market_price)
          }
        }
      }
    }

    // Step 4: Merge prices into products
    const productsWithPrices = productsData.map((product) => ({
      ...product,
      latest_price: product.pokemon_product?.id
        ? [{ market_price: priceMap.get(product.pokemon_product.id) ?? null }]
        : null
    }))

    // Step 5: Fetch 7-day-ago prices for market trend calculation
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

    const price7dAgoMap = new Map<number, number>()

    if (productIds.length > 0) {
      const { data: historyData, error: historyError } = await supabase
        .from('pokemon_product_price_history')
        .select('pokemon_product_id, price_date, market_price')
        .in('pokemon_product_id', productIds)
        .lte('price_date', sevenDaysAgoStr)
        .order('price_date', { ascending: false })

      if (historyError) {
        console.error('Error fetching price history:', historyError)
        // Continue without history - graceful degradation
      } else if (historyData) {
        // Build map of most recent price <= 7 days ago per product
        for (const entry of historyData) {
          if (
            entry.pokemon_product_id &&
            entry.market_price &&
            !price7dAgoMap.has(entry.pokemon_product_id)
          ) {
            price7dAgoMap.set(entry.pokemon_product_id, entry.market_price)
          }
        }
      }
    }

    // Step 6: Merge 7-day prices into products
    const productsWithTrend = productsWithPrices.map((product) => ({
      ...product,
      price_7d_ago: product.pokemon_product?.id
        ? price7dAgoMap.get(product.pokemon_product.id) ?? null
        : null
    }))

    return productsWithTrend as CollectionProductWithPriceChanges[]
  } catch (error) {
    console.error('Error in getUserCollectionProducts:', error)
    throw error instanceof Error ? error : new Error('Failed to load collection products')
  }
}