'use client'

import { useAuth } from '@/hooks/useAuth'

interface SetOwnershipSummaryProps {
  totalCards: number
  setId: string
}

export default function SetOwnershipSummary({ totalCards, setId }: SetOwnershipSummaryProps) {
  const { user } = useAuth()
  
  // Don't render if user is not logged in
  if (!user) {
    return null
  }
  
  // TODO: Replace with actual ownership data from database
  // For now, using mocked data
  const ownedCards = 50
  const percentage = totalCards > 0 ? (ownedCards / totalCards) * 100 : 0
  
  return (
    <div>
      <h3 className="text-lg font-semibold text-grey-900 mb-3">Ownership Aware Component</h3>
      
      <div className="space-y-3">
        <p className="text-sm text-grey-700">
          You own <span className="font-semibold">{ownedCards}</span> out of <span className="font-semibold">{totalCards}</span> cards
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
        
        <p className="text-xs text-grey-500">
          Holo Cards: <span className="font-medium">1</span>
        </p>
      </div>
    </div>
  )
}