/**
 * Types for the Grading Opportunities feature
 *
 * These types represent cards from the user's collection that have
 * favorable grading economics (SAFE_BET or GAMBLE tiers).
 */

/**
 * Grading opportunity data combining collection card + pricing info
 */
export interface GradingOpportunity {
  // Collection card info
  collectionCardId: string
  pokemonCardId: string
  cardName: string
  setName: string
  cardNumber: string | null // Card local ID (e.g., "179")
  imageUrl: string
  frontImageUrl: string | null
  backImageUrl: string | null

  // Pricing data
  currentMarketPrice: number
  profitAtPsa10: number
  profitAtPsa9: number | null
  roiPsa10: number | null
  gradingSafetyTier: 'SAFE_BET' | 'GAMBLE'

  // Fee breakdown for modal
  gradingFeeEntry: number | null
  gradingFeePsa10: number | null
  gradingFeePsa9: number | null
  psa10Price: number | null
  psa9Price: number | null
}

/**
 * Response from the grading opportunities server function
 */
export interface GradingOpportunitiesResponse {
  opportunities: GradingOpportunity[]
  totalCount: number
}
