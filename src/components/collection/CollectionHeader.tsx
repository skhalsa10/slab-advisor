'use client'

import ViewToggle, { type ViewMode } from './ViewToggle'
import { formatPrice } from '@/utils/collectionPriceUtils'

interface CollectionHeaderProps {
  cardCount: number
  totalValue: number
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export default function CollectionHeader({ 
  cardCount, 
  totalValue,
  viewMode, 
  onViewModeChange 
}: CollectionHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-grey-50 pt-4 pb-6 mb-6 -mx-4 px-4 md:-mx-8 md:px-8">
      {/* Header with title and count */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-grey-900">Your Card Collection</h1>
        <p className="mt-1 text-sm text-grey-600">
          {cardCount} {cardCount === 1 ? 'card' : 'cards'} in your collection
          {totalValue > 0 && (
            <span className="text-green-600 font-semibold"> • {formatPrice(totalValue)} total value</span>
          )}
        </p>
      </div>
      
      {/* View toggle and potential filters */}
      <div className="flex justify-between items-center">
        <ViewToggle 
          viewMode={viewMode} 
          onViewModeChange={onViewModeChange} 
        />
        
        {/* Placeholder for future filters/search */}
        <div className="flex items-center space-x-3">
          {/* Could add search, sort, filter controls here */}
        </div>
      </div>
    </div>
  )
}