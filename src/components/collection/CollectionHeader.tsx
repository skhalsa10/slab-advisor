'use client'

import ViewToggle, { type ViewMode } from './ViewToggle'
import { formatPrice } from '@/utils/collectionPriceUtils'
import { useQuickAddContext } from '@/contexts/QuickAddContext'

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
  const { openQuickAdd } = useQuickAddContext()
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
        
        {/* Quick Add Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={openQuickAdd}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Quick Add
          </button>
        </div>
      </div>
    </div>
  )
}