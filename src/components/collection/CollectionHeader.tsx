'use client'

import Link from 'next/link'
import ViewToggle, { type ViewMode } from './ViewToggle'

interface CollectionHeaderProps {
  cardCount: number
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export default function CollectionHeader({ 
  cardCount, 
  viewMode, 
  onViewModeChange 
}: CollectionHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-grey-50 pt-4 pb-6 mb-6 -mx-4 px-4 md:-mx-8 md:px-8">
      {/* Top row: Title and Upload button */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold text-grey-900">Your Card Collection</h1>
          <p className="mt-1 text-sm text-grey-600">
            {cardCount} {cardCount === 1 ? 'card' : 'cards'} in your collection
          </p>
        </div>
        <Link
          href="/collection/upload"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload New Card
        </Link>
      </div>
      
      {/* Bottom row: View toggle and potential filters */}
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