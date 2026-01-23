import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

interface UseSetOwnedCardsReturn {
  ownedCardIds: Set<string>
  isLoading: boolean
  refetch: () => Promise<void>
}

/**
 * Custom hook for fetching the IDs of cards owned from a specific set
 *
 * Fetches the list of unique card IDs the authenticated user owns from a specific set.
 * Returns a Set for O(1) lookup performance when filtering cards.
 * Only fetches when user is authenticated.
 *
 * @param setId - The ID of the Pokemon set
 * @returns Owned card IDs as a Set, loading state, and refetch function
 *
 * @example
 * ```typescript
 * const { ownedCardIds, isLoading, refetch } = useSetOwnedCards('sv8pt5')
 *
 * // Check if a card is owned
 * const isOwned = ownedCardIds.has(cardId)
 *
 * // Refetch after adding a card to collection
 * const handleAddCard = async () => {
 *   await addCardToCollection(cardId)
 *   await refetch()
 * }
 * ```
 */
export function useSetOwnedCards(setId: string): UseSetOwnedCardsReturn {
  const { user, loading: authLoading } = useAuth()
  const [ownedCardIds, setOwnedCardIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  const fetchOwnedCards = useCallback(async () => {
    if (!user) {
      setOwnedCardIds(new Set())
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/collection/sets/${setId}/ownership`)

      if (!response.ok) {
        console.error('Failed to fetch set owned cards')
        setOwnedCardIds(new Set())
        return
      }

      const data = await response.json()
      // Convert array to Set for O(1) lookup
      setOwnedCardIds(new Set(data.ownedCardIds || []))
    } catch (error) {
      console.error('Error fetching set owned cards:', error)
      setOwnedCardIds(new Set())
    } finally {
      setIsLoading(false)
    }
  }, [setId, user])

  // Refetch function that can be called externally
  const refetch = useCallback(async () => {
    await fetchOwnedCards()
  }, [fetchOwnedCards])

  useEffect(() => {
    // Don't fetch if still checking auth
    if (authLoading) return

    if (!user) {
      setIsLoading(false)
      setOwnedCardIds(new Set())
      return
    }

    fetchOwnedCards()
  }, [setId, user, authLoading, fetchOwnedCards])

  return { ownedCardIds, isLoading, refetch }
}
