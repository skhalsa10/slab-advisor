import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

interface UseSetOwnershipReturn {
  ownedCount: number
  percentage: number
  isLoading: boolean
  refetch: () => Promise<void>
}

/**
 * Custom hook for fetching set ownership statistics
 *
 * Fetches the count of unique cards the authenticated user owns from a specific set.
 * Only fetches when user is authenticated.
 *
 * @param setId - The ID of the Pokemon set
 * @param totalCards - Total number of cards in the set (for percentage calculation)
 * @returns Ownership stats including count, percentage, loading state, and refetch function
 *
 * @example
 * ```typescript
 * const { ownedCount, percentage, isLoading, refetch } = useSetOwnership('sv8pt5', 188)
 *
 * if (isLoading) return <Skeleton />
 *
 * // Call refetch() after adding a card to collection
 * const handleAddCard = async () => {
 *   await addCardToCollection(cardId)
 *   await refetch()
 * }
 * ```
 */
export function useSetOwnership(setId: string, totalCards: number): UseSetOwnershipReturn {
  const { user, loading: authLoading } = useAuth()
  const [ownedCount, setOwnedCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    if (!user) {
      setOwnedCount(0)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/collection/sets/${setId}/stats`)

      if (!response.ok) {
        console.error('Failed to fetch set ownership stats')
        setOwnedCount(0)
        return
      }

      const data = await response.json()
      setOwnedCount(data.ownedCount || 0)
    } catch (error) {
      console.error('Error fetching set ownership stats:', error)
      setOwnedCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [setId, user])

  // Refetch function that can be called externally
  const refetch = useCallback(async () => {
    await fetchStats()
  }, [fetchStats])

  useEffect(() => {
    // Don't fetch if still checking auth
    if (authLoading) return

    if (!user) {
      setIsLoading(false)
      setOwnedCount(0)
      return
    }

    fetchStats()
  }, [setId, user, authLoading, fetchStats])

  const percentage = totalCards > 0 ? (ownedCount / totalCards) * 100 : 0

  return { ownedCount, percentage, isLoading, refetch }
}
