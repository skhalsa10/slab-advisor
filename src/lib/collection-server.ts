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
    
    // Fetch user's collection cards with full Pokemon data
    const { data: cardsData, error: cardsError } = await supabase
      .from('collection_cards')
      .select(`
        *,
        pokemon_card:pokemon_cards(
          *,
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