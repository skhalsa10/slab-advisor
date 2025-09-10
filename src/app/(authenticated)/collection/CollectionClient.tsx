'use client'

import { useState, useMemo } from 'react'
import { type CollectionCard } from '@/types/database'
import { type CollectionCardWithPokemon } from '@/utils/collectionCardUtils'
import { calculateCollectionValue } from '@/utils/collectionPriceUtils'
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

  // Calculate total collection value
  const totalValue = useMemo(() => {
    // Cast cards to CollectionCardWithPokemon since they include pokemon_card data from server
    return calculateCollectionValue(cards as CollectionCardWithPokemon[])
  }, [cards])

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
        totalValue={totalValue}
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
            md: 4,
            lg: 4,
            xl: 5,
            '2xl': 5
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
                  Variant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                  Condition
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-grey-500 uppercase tracking-wider">
                  Qty
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                  Grade
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wider">
                  Total
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