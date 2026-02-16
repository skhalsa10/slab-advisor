/**
 * Types for the Market Movers dashboard widget.
 *
 * Shows user's collection cards with the biggest price movements
 * across selectable time periods (24h, 7d, 30d).
 */

/** Time period options for market movers */
export type MarketMoverPeriod = '24h' | '7d' | '30d'

/**
 * A single market mover card from the user's collection.
 * Contains all three time period changes so the client can
 * switch periods without refetching.
 */
export interface MarketMoverCard {
  /** Collection card ID (for linking to detail page) */
  collectionCardId: string
  /** Pokemon card ID */
  pokemonCardId: string
  /** Card display name */
  cardName: string
  /** Set name */
  setName: string
  /** Card number in set */
  cardNumber: string | null
  /** Pre-computed image URL */
  imageUrl: string
  /** Current market price in USD */
  currentPrice: number
  /** 24h percent change (computed from raw_price_history, may be null) */
  change24h: number | null
  /** 7d percent change (from pre-computed column) */
  change7d: number | null
  /** 30d percent change (from pre-computed column) */
  change30d: number | null
}

/** Response from the getMarketMovers server function */
export interface MarketMoversResponse {
  cards: MarketMoverCard[]
}
