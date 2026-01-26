'use client'

import ViewToggle, { type ViewMode } from './ViewToggle'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { formatPrice } from '@/utils/collectionPriceUtils'
import { useQuickAddContext } from '@/contexts/QuickAddContext'

export type CollectionType = 'cards' | 'sealed'

interface CollectionHeaderProps {
  cardCount: number
  productCount: number
  totalValue: number
  collectionType: CollectionType
  onCollectionTypeChange: (type: CollectionType) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export default function CollectionHeader({
  cardCount,
  productCount,
  totalValue,
  collectionType,
  onCollectionTypeChange,
  viewMode,
  onViewModeChange
}: CollectionHeaderProps) {
  const { openQuickAdd } = useQuickAddContext()

  const collectionTypeOptions = [
    { label: 'Cards', value: 'cards' as const },
    { label: 'Sealed', value: 'sealed' as const }
  ]

  return (
    <div className="sticky top-0 z-10 bg-grey-50 pt-4 pb-6 mb-6 -mx-4 px-4 md:-mx-8 md:px-8">
      {/* Header with title and count */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-grey-900">Your Collection</h1>
        <p className="mt-1 text-sm text-grey-600">
          {cardCount} {cardCount === 1 ? 'card' : 'cards'}
          {productCount > 0 && (
            <span>
              {' '}
              • {productCount} sealed {productCount === 1 ? 'product' : 'products'}
            </span>
          )}
          {totalValue > 0 && (
            <span className="text-green-600 font-semibold">
              {' '}
              • {formatPrice(totalValue)} total value
            </span>
          )}
        </p>
      </div>

      {/* Controls row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        {/* Left side: Collection type switcher and view toggle */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SegmentedControl
            options={collectionTypeOptions}
            value={collectionType}
            onChange={onCollectionTypeChange}
            fullWidthMobile
            ariaLabel="Collection type"
          />

          {/* Only show view toggle for cards */}
          {collectionType === 'cards' && (
            <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          )}
        </div>

        {/* Right side: Quick Add Button */}
        <div className="flex items-center">
          <button
            onClick={openQuickAdd}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Quick Add
          </button>
        </div>
      </div>
    </div>
  )
}