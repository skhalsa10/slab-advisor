/**
 * Types for the Top Gems Widget feature
 *
 * Represents the user's most valuable cards displayed as a trophy case
 * on the dashboard with gold/silver/bronze ranking.
 */

/**
 * A single "gem" representing a high-value card from the user's collection
 */
export interface TopGem {
  /** Collection card ID for navigation */
  collectionCardId: string
  /** Pokemon card ID for reference */
  pokemonCardId: string
  /** Card name (e.g., "Charizard VMAX") */
  cardName: string
  /** Set name (e.g., "Brilliant Stars") */
  setName: string
  /** Card number in set (e.g., "25") */
  cardNumber: string | null
  /** URL to card image */
  imageUrl: string
  /** Current market value (raw/ungraded price) */
  currentValue: number
  /** Ranking position (1=Gold, 2=Silver, 3=Bronze) */
  rank: 1 | 2 | 3
}

/**
 * Response from the getTopGems server function
 */
export interface TopGemsResponse {
  gems: TopGem[]
}
