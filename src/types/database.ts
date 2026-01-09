/**
 * Application Database Types
 * 
 * This file provides easy-to-use type aliases for the auto-generated database types.
 * Instead of writing `Database['public']['Tables']['collection_cards']['Row']`,
 * you can simply use `CollectionCard`.
 * 
 * These types automatically stay in sync with the database schema since they
 * reference the generated types from `/src/models/database.ts`.
 * 
 * To regenerate the source types, run: `npm run types:generate`
 */

import { Database } from '@/models/database'

// Card category enum for future use
export type CardCategory = 'pokemon' | 'onepiece' | 'sports' | 'other_tcg'

/**
 * Collection Cards - User's personal card collection
 * 
 * References the auto-generated database type to stay in sync with schema changes.
 * Each row represents one variant of a card in a user's collection.
 */
export type CollectionCard = Database['public']['Tables']['collection_cards']['Row']

/**
 * User Credits - Credit balance tracking
 * 
 * References the auto-generated database type.
 */
export type UserCredits = Database['public']['Tables']['user_credits']['Row']

/**
 * Database Operation Types
 * 
 * These provide easy access to insert/update types for database operations.
 */
export type CollectionCardInsert = Database['public']['Tables']['collection_cards']['Insert']
export type CollectionCardUpdate = Database['public']['Tables']['collection_cards']['Update']
export type UserCreditsInsert = Database['public']['Tables']['user_credits']['Insert']
export type UserCreditsUpdate = Database['public']['Tables']['user_credits']['Update']

/**
 * Collection Card Gradings - Card grading results from Ximilar API
 *
 * References the auto-generated database type.
 * Stores grading data including front/back analysis and combined grades.
 */
export type CollectionCardGrading = Database['public']['Tables']['collection_card_gradings']['Row']
export type CollectionCardGradingInsert = Database['public']['Tables']['collection_card_gradings']['Insert']
export type CollectionCardGradingUpdate = Database['public']['Tables']['collection_card_gradings']['Update']

/**
 * Dashboard Statistics
 *
 * Aggregated stats for the user dashboard, computed server-side.
 * All values are calculated via PostgreSQL functions for efficiency.
 */
export interface DashboardStats {
  /** Total number of cards in user's collection (sum of quantities) */
  totalCards: number
  /** Estimated total value of collection in USD (null = not yet implemented) */
  estimatedValue: number | null
  /** Number of cards that have been analyzed/graded (null = not yet implemented) */
  cardsAnalyzed: number | null
}

