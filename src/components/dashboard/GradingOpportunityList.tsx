'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { GradingOpportunity } from '@/types/grading-opportunity'
import GradingOpportunityRow from './GradingOpportunityRow'
import GradingAnalysisModal from './GradingAnalysisModal'

interface GradingOpportunityListProps {
  opportunities: GradingOpportunity[]
  totalCount?: number
}

/** Maximum rows to display in compact mode */
const MAX_VISIBLE_ROWS = 3

/**
 * Client component that manages modal state and renders grading opportunity rows
 * High Density Bento Style - shows top 3 items with "See All" footer
 */
export default function GradingOpportunityList({
  opportunities,
  totalCount,
}: GradingOpportunityListProps) {
  const router = useRouter()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isViewAllMode, setIsViewAllMode] = useState(false)
  const [allOpportunities, setAllOpportunities] = useState<GradingOpportunity[]>([])
  const [isLoadingAll, setIsLoadingAll] = useState(false)

  // Refresh the page data after successful grading
  const handleGradingSuccess = useCallback(() => {
    router.refresh()
    // Clear cached all opportunities so it refetches next time
    setAllOpportunities([])
  }, [router])

  // Open modal at specific index (from row click - uses limited list)
  const handleRowClick = useCallback((index: number) => {
    setIsViewAllMode(false)
    setSelectedIndex(index)
  }, [])

  // Fetch all opportunities and open modal at first card
  const handleViewAll = useCallback(async () => {
    setIsLoadingAll(true)
    try {
      // Fetch all opportunities if not already cached
      if (allOpportunities.length === 0) {
        const response = await fetch('/api/grading-opportunities?limit=100')
        if (response.ok) {
          const data = await response.json()
          setAllOpportunities(data.opportunities)
        }
      }
      setIsViewAllMode(true)
      setSelectedIndex(0)
    } catch (error) {
      console.error('Failed to fetch all opportunities:', error)
      // Fallback to limited list
      setIsViewAllMode(false)
      setSelectedIndex(0)
    } finally {
      setIsLoadingAll(false)
    }
  }, [allOpportunities.length])

  // Close modal and reset state
  const handleCloseModal = useCallback(() => {
    setSelectedIndex(null)
    setIsViewAllMode(false)
  }, [])

  const displayCount = totalCount ?? opportunities.length

  // Use all opportunities when in view all mode, otherwise use the limited list
  const modalOpportunities =
    isViewAllMode && allOpportunities.length > 0
      ? allOpportunities
      : opportunities

  // Limit visible rows to MAX_VISIBLE_ROWS for compact display
  const visibleOpportunities = opportunities.slice(0, MAX_VISIBLE_ROWS)
  const hasMoreOpportunities = displayCount > MAX_VISIBLE_ROWS

  return (
    <>
      {/* List rows - uses negative margin to reach card edges */}
      <div className="-mx-4 -mt-4">
        {visibleOpportunities.map((opportunity, index) => (
          <GradingOpportunityRow
            key={opportunity.collectionCardId}
            opportunity={opportunity}
            onClick={() => handleRowClick(index)}
          />
        ))}
      </div>

      {/* Footer: Solid "plank" button anchored to bottom */}
      {hasMoreOpportunities && (
        <button
          onClick={handleViewAll}
          disabled={isLoadingAll}
          className="w-full -mx-4 -mb-4 border-t border-grey-100 bg-grey-50 p-3 text-center text-xs font-medium text-grey-600 hover:bg-grey-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ width: 'calc(100% + 2rem)' }}
        >
          {isLoadingAll ? 'Loading...' : `View all ${displayCount} opportunities`}
        </button>
      )}

      {/* Add bottom margin fix when no footer */}
      {!hasMoreOpportunities && <div className="-mb-4" />}

      <GradingAnalysisModal
        opportunities={modalOpportunities}
        initialIndex={selectedIndex ?? 0}
        isOpen={selectedIndex !== null}
        onClose={handleCloseModal}
        onSuccess={handleGradingSuccess}
      />
    </>
  )
}
