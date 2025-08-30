/**
 * Server-side Collection module for Slab Advisor
 * 
 * This module provides secure server-side data fetching for user collection data.
 * All database queries are performed server-side with proper authentication checks.
 * 
 * @module collection-server
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type CollectionCard } from '@/types/database'

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
    const cookieStore = await cookies()
    
    // Create Supabase client for server-side operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
            try {
              cookiesToSet.forEach(() => {
                // For API routes, we can't set cookies in the response
                // This is expected and should be handled by middleware
              })
            } catch {
              // Cookie set error is expected in API routes
            }
          },
        },
      }
    )
    
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