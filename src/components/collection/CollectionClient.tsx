'use client'

import { useState } from 'react'
import { type CollectionCard } from '@/types/database'
import CollectionHeader from '@/components/collection/CollectionHeader'
import CardGridView from '@/components/collection/CardGridView'
import CardListView from '@/components/collection/CardListView'
import EmptyCollectionState from '@/components/collection/EmptyCollectionState'
import { type ViewMode } from '@/components/collection/ViewToggle'

interface CollectionClientProps {
  cards: CollectionCard[]
}

/**
 * CollectionClient Component
 * 
 * Client-side component for managing collection view interactions and state.
 * Handles view mode switching and card interactions without any database queries.
 * All data is passed down from the server-side parent component.
 * 
 * @param props - Contains server-fetched collection cards
 */
export default function CollectionClient({ cards }: CollectionClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const handleViewCard = () => {
    // Card viewing functionality temporarily disabled
  }

  // Show empty state if no cards
  if (cards.length === 0) {
    return <EmptyCollectionState />
  }

  return (
    <div className={viewMode === 'list' ? 'h-[calc(100vh-1.5rem)] flex flex-col overflow-hidden' : ''}>
      <CollectionHeader 
        cardCount={cards.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      {viewMode === 'grid' ? (
        <CardGridView cards={cards} onViewCard={handleViewCard} />
      ) : (
        <div className="flex-1 min-h-0">
          <CardListView cards={cards} onViewCard={handleViewCard} />
        </div>
      )}
    </div>
  )
}