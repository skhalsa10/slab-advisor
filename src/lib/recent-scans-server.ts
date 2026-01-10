/**
 * Server-side module for fetching recent card grading scans
 *
 * Fetches user's most recent AI grading results from collection_card_gradings table.
 *
 * @module recent-scans-server
 */

import { getAuthenticatedSupabaseClient } from './supabase-server'
import { getCardImageUrl } from './pokemon-db'

/**
 * Recent scan data structure for the widget
 */
export interface RecentScan {
  id: string
  collectionCardId: string
  gradeFinal: number | null
  condition: string | null
  createdAt: string
  cardName: string
  setName: string
  /** Official card image URL (user's private images not accessible in widget) */
  imageUrl: string
}

/**
 * Response type for getRecentScans
 */
export interface RecentScansResponse {
  scans: RecentScan[]
}

/**
 * Gets the user's most recent card grading scans
 *
 * Fetches from collection_card_gradings joined with collection_cards and pokemon_cards,
 * sorted by created_at DESC.
 *
 * @param limit - Maximum number of scans to return (default: 10)
 * @returns Promise containing scans array
 *
 * @example
 * ```typescript
 * export default async function DashboardPage() {
 *   const { scans } = await getRecentScans(10)
 *   return <RecentScansWidget scans={scans} />
 * }
 * ```
 */
export async function getRecentScans(
  limit: number = 10
): Promise<RecentScansResponse> {
  try {
    const supabase = await getAuthenticatedSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { scans: [] }
    }

    // Query gradings with collection card and pokemon card data
    const { data: gradingsData, error: gradingsError } = await supabase
      .from('collection_card_gradings')
      .select(
        `
        id,
        collection_card_id,
        grade_final,
        condition,
        created_at,
        collection_card:collection_cards!inner(
          id,
          pokemon_card:pokemon_cards(
            id,
            name,
            image,
            tcgplayer_image_url,
            set:pokemon_sets(name)
          )
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (gradingsError || !gradingsData) {
      if (gradingsError) {
        console.error('Error fetching recent scans:', gradingsError)
      }
      return { scans: [] }
    }

    // Transform the data
    const scans: RecentScan[] = gradingsData
      .map((grading) => {
        // Handle the nested structure - Supabase returns single objects for !inner joins
        const collectionCard = grading.collection_card as unknown as {
          id: string
          pokemon_card: {
            id: string
            name: string
            image: string | null
            tcgplayer_image_url: string | null
            set: { name: string } | null
          } | null
        }

        if (!collectionCard?.pokemon_card) {
          return null
        }

        const pokemon = collectionCard.pokemon_card

        // Use official card image (user's uploaded images are in private bucket)
        const imageUrl = getCardImageUrl(
          pokemon.image || undefined,
          'low',
          pokemon.tcgplayer_image_url || undefined
        )

        return {
          id: grading.id,
          collectionCardId: grading.collection_card_id,
          gradeFinal: grading.grade_final,
          condition: grading.condition,
          createdAt: grading.created_at,
          cardName: pokemon.name,
          setName: pokemon.set?.name || 'Unknown Set',
          imageUrl,
        }
      })
      .filter((scan): scan is RecentScan => scan !== null)

    return { scans }
  } catch (error) {
    console.error('Error in getRecentScans:', error)
    return { scans: [] }
  }
}
