/**
 * PostHog Event Tracking Helpers
 *
 * Type-safe event tracking functions for Slab Advisor.
 * Import and call these functions to track user actions.
 *
 * @module posthog/events
 *
 * @example
 * ```tsx
 * import { trackCardAdded, trackSearch } from '@/lib/posthog/events'
 *
 * // Track when user adds a card
 * trackCardAdded({ source: 'ai', category: 'pokemon' })
 *
 * // Track a search
 * trackSearch({ query: 'charizard', resultsCount: 25 })
 * ```
 */

import posthog from 'posthog-js'

// ============================================
// Event Names (keep consistent with PostHog)
// ============================================

export const EVENTS = {
  // Auth events
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',

  // Card events
  CARD_ADDED: 'card_added',
  CARD_REMOVED: 'card_removed',
  CARD_ANALYZED: 'card_analyzed',
  CARD_GRADED: 'card_graded',
  CARD_DETAILS_VIEWED: 'card_details_viewed',

  // Collection events
  COLLECTION_VIEWED: 'collection_viewed',

  // Account events
  ACCOUNT_VIEWED: 'account_viewed',

  // Search events
  SEARCH_PERFORMED: 'search_performed',

  // Credit events
  CREDITS_PURCHASED: 'credits_purchased',
  CREDITS_USED: 'credits_used',

  // Error events
  ERROR_OCCURRED: 'error_occurred',
} as const

// ============================================
// Event Property Types
// ============================================

interface SignUpProperties {
  method: 'email' | 'google' | 'apple'
}

interface SignInProperties {
  method: 'email' | 'google' | 'apple'
}

interface CardAddedProperties {
  source: 'manual' | 'ai'
  category?: string
  cardId?: string
}

interface CardRemovedProperties {
  cardId: string
}

interface CardAnalyzedProperties {
  success: boolean
  confidence?: number
  creditsUsed: number
  durationMs?: number
  category?: string
}

interface CardGradedProperties {
  grade?: number
  creditsUsed: number
  durationMs?: number
  cardId?: string
}

interface CardDetailsViewedProperties {
  cardId: string
  category?: string
}

interface CollectionViewedProperties {
  viewMode: 'list' | 'grid'
  cardCount: number
}

interface SearchPerformedProperties {
  query: string
  resultsCount: number
  filters?: Record<string, unknown>
}

interface CreditsPurchasedProperties {
  amount: number
  package: string
  price: number
}

interface CreditsUsedProperties {
  amount: number
  action: 'analyze' | 'grade'
}

interface ErrorOccurredProperties {
  errorType: string
  message: string
  page?: string
  componentStack?: string
}

// ============================================
// Tracking Functions
// ============================================

/**
 * Track user signup
 */
export function trackSignUp(properties: SignUpProperties): void {
  posthog.capture(EVENTS.USER_SIGNED_UP, properties)
}

/**
 * Track user sign in
 */
export function trackSignIn(properties: SignInProperties): void {
  posthog.capture(EVENTS.USER_SIGNED_IN, properties)
}

/**
 * Track user sign out
 */
export function trackSignOut(): void {
  posthog.capture(EVENTS.USER_SIGNED_OUT)
}

/**
 * Track card added to collection
 */
export function trackCardAdded(properties: CardAddedProperties): void {
  posthog.capture(EVENTS.CARD_ADDED, properties)
}

/**
 * Track card removed from collection
 */
export function trackCardRemoved(properties: CardRemovedProperties): void {
  posthog.capture(EVENTS.CARD_REMOVED, properties)
}

/**
 * Track card analysis (AI identification)
 */
export function trackCardAnalyzed(properties: CardAnalyzedProperties): void {
  posthog.capture(EVENTS.CARD_ANALYZED, properties)
}

/**
 * Track card grading
 */
export function trackCardGraded(properties: CardGradedProperties): void {
  posthog.capture(EVENTS.CARD_GRADED, properties)
}

/**
 * Track card details page view
 */
export function trackCardDetailsViewed(properties: CardDetailsViewedProperties): void {
  posthog.capture(EVENTS.CARD_DETAILS_VIEWED, properties)
}

/**
 * Track collection page view
 */
export function trackCollectionViewed(properties: CollectionViewedProperties): void {
  posthog.capture(EVENTS.COLLECTION_VIEWED, properties)
}

/**
 * Track account page view
 */
export function trackAccountViewed(): void {
  posthog.capture(EVENTS.ACCOUNT_VIEWED)
}

/**
 * Track search performed
 */
export function trackSearch(properties: SearchPerformedProperties): void {
  posthog.capture(EVENTS.SEARCH_PERFORMED, properties)
}

/**
 * Track credits purchased
 */
export function trackCreditsPurchased(properties: CreditsPurchasedProperties): void {
  posthog.capture(EVENTS.CREDITS_PURCHASED, properties)
}

/**
 * Track credits used
 */
export function trackCreditsUsed(properties: CreditsUsedProperties): void {
  posthog.capture(EVENTS.CREDITS_USED, properties)
}

/**
 * Track error occurred
 */
export function trackError(properties: ErrorOccurredProperties): void {
  posthog.capture(EVENTS.ERROR_OCCURRED, properties)
}

/**
 * Generic capture function for custom events
 */
export function capture(eventName: string, properties?: Record<string, unknown>): void {
  posthog.capture(eventName, properties)
}
