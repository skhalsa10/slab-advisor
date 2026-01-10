'use client'

import { useState } from 'react'
import type { GradingOpportunity } from '@/types/grading-opportunity'
import GradingOpportunityRow from './GradingOpportunityRow'
import GradingAnalysisModal from './GradingAnalysisModal'

interface GradingOpportunityListProps {
  opportunities: GradingOpportunity[]
}

/**
 * Client component that manages modal state and renders grading opportunity rows
 */
export default function GradingOpportunityList({
  opportunities,
}: GradingOpportunityListProps) {
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<GradingOpportunity | null>(null)

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm divide-y divide-grey-100">
        {opportunities.map((opportunity) => (
          <GradingOpportunityRow
            key={opportunity.collectionCardId}
            opportunity={opportunity}
            onClick={() => setSelectedOpportunity(opportunity)}
          />
        ))}
      </div>

      <GradingAnalysisModal
        opportunity={selectedOpportunity}
        isOpen={!!selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
      />
    </>
  )
}
