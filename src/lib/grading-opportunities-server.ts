/**
 * Server-side module for fetching grading opportunities
 *
 * Fetches user's collection cards that have favorable grading economics
 * based on pokemon_card_prices data.
 *
 * @module grading-opportunities-server
 */

import { getAuthenticatedSupabaseClient } from './supabase-server'
import { getCardImageUrl } from './pokemon-db'
import type {
  GradingOpportunity,
  GradingOpportunitiesResponse,
} from '@/types/grading-opportunity'

/**
 * Raw data shape from Supabase query
 */
interface RawOpportunityData {
  id: string
  front_image_url: string | null
  back_image_url: string | null
  pokemon_card: {
    id: string
    name: string
    image: string | null
    tcgplayer_image_url: string | null
    local_id: string | null
    set: {
      name: string
    } | null
  }
}

/**
 * Raw price data shape from separate query
 */
interface RawPriceData {
  pokemon_card_id: string
  current_market_price: number | null
  profit_at_psa10: number | null
  profit_at_psa9: number | null
  roi_psa10: number | null
  grading_safety_tier: string | null
  grading_fee_entry: number | null
  grading_fee_psa10: number | null
  grading_fee_psa9: number | null
  psa10: { avgPrice?: number; smartMarketPrice?: number } | null
  psa9: { avgPrice?: number; smartMarketPrice?: number } | null
}

/**
 * Gets grading opportunities for the authenticated user
 *
 * Fetches collection cards joined with pokemon_cards and pokemon_card_prices,
 * filtered by grading_safety_tier IN ('SAFE_BET', 'GAMBLE') and
 * ordered by profit_at_psa10 DESC.
 *
 * @param limit - Maximum number of opportunities to return (default: 5)
 * @returns Promise containing opportunities array and total count
 *
 * @example
 * ```typescript
 * export default async function DashboardPage() {
 *   const { opportunities } = await getGradingOpportunities(5)
 *   return <GradingOpportunitiesWidget opportunities={opportunities} />
 * }
 * ```
 */
export async function getGradingOpportunities(
  limit: number = 5
): Promise<GradingOpportunitiesResponse> {
  try {
    const supabase = await getAuthenticatedSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { opportunities: [], totalCount: 0 }
    }

    // Get IDs of collection cards that already have gradings (to exclude them)
    const { data: gradedCards } = await supabase
      .from('collection_card_gradings')
      .select('collection_card_id')
      .eq('user_id', user.id)

    const gradedCardIds = new Set(
      gradedCards?.map((g) => g.collection_card_id) || []
    )

    // Step 1: Get all user's collection cards with pokemon card data
    const { data: collectionData, error: collectionError } = await supabase
      .from('collection_cards')
      .select(
        `
        id,
        front_image_url,
        back_image_url,
        pokemon_card_id,
        pokemon_card:pokemon_cards!inner(
          id,
          name,
          image,
          tcgplayer_image_url,
          local_id,
          set:pokemon_sets(name)
        )
      `
      )
      .eq('user_id', user.id)
      .not('pokemon_card_id', 'is', null)

    if (collectionError || !collectionData || collectionData.length === 0) {
      if (collectionError) {
        console.error('Error fetching collection cards:', collectionError)
      }
      return { opportunities: [], totalCount: 0 }
    }

    // Get unique pokemon card IDs from collection
    const pokemonCardIds = [
      ...new Set(
        collectionData
          .map((card) => card.pokemon_card_id)
          .filter((id): id is string => id !== null)
      ),
    ]

    if (pokemonCardIds.length === 0) {
      return { opportunities: [], totalCount: 0 }
    }

    // Step 2: Get price data for these cards with grading opportunity filters
    const { data: priceData, error: priceError } = await supabase
      .from('pokemon_card_prices')
      .select(
        `
        pokemon_card_id,
        current_market_price,
        profit_at_psa10,
        profit_at_psa9,
        roi_psa10,
        grading_safety_tier,
        grading_fee_entry,
        grading_fee_psa10,
        grading_fee_psa9,
        psa10,
        psa9
      `
      )
      .in('pokemon_card_id', pokemonCardIds)
      .in('grading_safety_tier', ['SAFE_BET', 'GAMBLE'])
      .not('profit_at_psa10', 'is', null)
      .order('profit_at_psa10', { ascending: false })

    if (priceError || !priceData) {
      if (priceError) {
        console.error('Error fetching price data:', priceError)
      }
      return { opportunities: [], totalCount: 0 }
    }

    // Create a map of pokemon_card_id -> price data for easy lookup
    const priceMap = new Map<string, RawPriceData>()
    for (const price of priceData) {
      priceMap.set(price.pokemon_card_id, price as RawPriceData)
    }

    // Step 3: Join collection data with price data and transform
    const opportunities: GradingOpportunity[] = []

    // Sort collection cards by:
    // 1. grading_safety_tier (SAFE_BET first - profitable at both PSA 9 & 10)
    // 2. profit_at_psa10 descending within each tier
    const sortedCollectionData = collectionData
      .filter(
        (card) =>
          card.pokemon_card_id &&
          priceMap.has(card.pokemon_card_id) &&
          !gradedCardIds.has(card.id) // Exclude already-graded cards
      )
      .sort((a, b) => {
        const priceA = priceMap.get(a.pokemon_card_id!)
        const priceB = priceMap.get(b.pokemon_card_id!)

        // Prioritize SAFE_BET over GAMBLE
        const tierA = priceA?.grading_safety_tier
        const tierB = priceB?.grading_safety_tier
        if (tierA !== tierB) {
          if (tierA === 'SAFE_BET') return -1
          if (tierB === 'SAFE_BET') return 1
        }

        // Within same tier, sort by profit_at_psa10 descending
        const profitA = priceA?.profit_at_psa10 ?? 0
        const profitB = priceB?.profit_at_psa10 ?? 0
        return profitB - profitA
      })

    for (const card of sortedCollectionData) {
      if (!card.pokemon_card_id) continue

      const prices = priceMap.get(card.pokemon_card_id)
      if (!prices) continue

      const rawCard = card as unknown as RawOpportunityData
      const pokemon = rawCard.pokemon_card

      // Always use the official Pokemon card image from the database
      // Priority: TCGdex image > TCGPlayer image > placeholder
      // Note: We don't use user's uploaded images here as they are Supabase storage paths
      const imageUrl = getCardImageUrl(
        pokemon.image || undefined,
        'low',
        pokemon.tcgplayer_image_url || undefined
      )

      opportunities.push({
        collectionCardId: card.id,
        pokemonCardId: pokemon.id,
        cardName: pokemon.name,
        setName: pokemon.set?.name || 'Unknown Set',
        cardNumber: pokemon.local_id || null,
        imageUrl,
        frontImageUrl: card.front_image_url,
        backImageUrl: card.back_image_url,
        currentMarketPrice: prices.current_market_price || 0,
        profitAtPsa10: prices.profit_at_psa10!,
        profitAtPsa9: prices.profit_at_psa9,
        roiPsa10: prices.roi_psa10,
        gradingSafetyTier: prices.grading_safety_tier as 'SAFE_BET' | 'GAMBLE',
        gradingFeeEntry: prices.grading_fee_entry,
        gradingFeePsa10: prices.grading_fee_psa10,
        gradingFeePsa9: prices.grading_fee_psa9,
        psa10Price:
          prices.psa10?.avgPrice || prices.psa10?.smartMarketPrice || null,
        psa9Price:
          prices.psa9?.avgPrice || prices.psa9?.smartMarketPrice || null,
      })

      // Stop once we have enough
      if (opportunities.length >= limit) {
        break
      }
    }

    return {
      opportunities,
      totalCount: sortedCollectionData.length,
    }
  } catch (error) {
    console.error('Error in getGradingOpportunities:', error)
    return { opportunities: [], totalCount: 0 }
  }
}
