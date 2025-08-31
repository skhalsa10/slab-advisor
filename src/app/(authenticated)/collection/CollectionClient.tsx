'use client'

import { useState } from 'react'
import { type CollectionCard } from '@/types/database'
import CollectionHeader from '@/components/collection/CollectionHeader'
import ItemGrid from '@/components/ui/ItemGrid'
import ItemList from '@/components/ui/ItemList'
import CollectionCardGridItem from '@/components/collection/CollectionCardGridItem'
import CollectionCardListItem from '@/components/collection/CollectionCardListItem'
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
        <ItemGrid
          items={cards}
          renderItem={(card, index) => (
            <CollectionCardGridItem
              key={card.id}
              card={card}
              onViewCard={handleViewCard}
              priority={index < 8}
            />
          )}
          emptyStateComponent={<EmptyCollectionState />}
          columns={{
            base: 2,
            sm: 3,
            md: 5,
            lg: 5,
            xl: 6,
            '2xl': 6
          }}
        />
      ) : (
        <div className="flex-1 min-h-0">
          <ItemList
            items={cards}
            renderHeader={() => (
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                  Card
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                  Grade
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                  Added
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            )}
            renderRow={(card) => (
              <CollectionCardListItem
                key={card.id}
                card={card}
                onViewCard={handleViewCard}
              />
            )}
            emptyStateComponent={<EmptyCollectionState />}
          />
        </div>
      )}
    </div>
  )
}