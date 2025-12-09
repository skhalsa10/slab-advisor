'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSetOwnership } from '@/hooks/useSetOwnership'

interface SetOwnershipSummaryProps {
  totalCards: number
  setId: string
  onRefetchReady?: (refetch: () => Promise<void>) => void
}

export default function SetOwnershipSummary({ totalCards, setId, onRefetchReady }: SetOwnershipSummaryProps) {
  const { user, loading: authLoading } = useAuth()
  const { ownedCount, percentage, isLoading, refetch } = useSetOwnership(setId, totalCards)

  // Pass refetch function to parent when ready
  useEffect(() => {
    if (onRefetchReady && user) {
      onRefetchReady(refetch)
    }
  }, [onRefetchReady, refetch, user])

  // Don't render if not logged in (hide for unauthenticated users)
  if (!authLoading && !user) {
    return null
  }

  // Loading skeleton
  if (authLoading || isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-5 bg-grey-200 rounded w-32 mb-3" />
        <div className="space-y-3">
          <div className="h-4 bg-grey-200 rounded w-48" />
          <div className="h-6 bg-grey-200 rounded-full" />
        </div>
      </div>
    )
  }

  const hasCards = ownedCount > 0

  return (
    <div>
      <h3 className="text-lg font-semibold text-grey-900 mb-3">Your Collection</h3>

      <div className="space-y-3">
        <p className="text-sm text-grey-700">
          You own <span className="font-semibold">{ownedCount}</span> out of <span className="font-semibold">{totalCards}</span> cards
        </p>

        <div className="relative">
          <div className="h-6 bg-grey-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-grey-700">
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>

        {!hasCards && (
          <p className="text-xs text-grey-500">
            Start your collection!
          </p>
        )}
      </div>
    </div>
  )
}
