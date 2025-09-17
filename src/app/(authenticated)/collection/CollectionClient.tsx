'use client'

import { useState, useMemo, useEffect } from 'react'
import { type CollectionCard } from '@/types/database'
import { type CollectionCardWithPokemon } from '@/utils/collectionCardUtils'
import { calculateCollectionValue } from '@/utils/collectionPriceUtils'
import CollectionHeader from '@/components/collection/CollectionHeader'
import ItemGrid from '@/components/ui/ItemGrid'
import ItemList from '@/components/ui/ItemList'
import CollectionCardGridItem from '@/components/collection/CollectionCardGridItem'
import CollectionCardListItem from '@/components/collection/CollectionCardListItem'
import EmptyCollectionState from '@/components/collection/EmptyCollectionState'
import QuickView from '@/components/ui/QuickView'
import CollectionQuickViewContent from '@/components/collection/CollectionQuickViewContent'
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
  const [selectedCard, setSelectedCard] = useState<CollectionCardWithPokemon | null>(null)
  const [cardList, setCardList] = useState(cards as CollectionCardWithPokemon[])

  // Sync cardList with props when server data changes (after router.refresh)
  useEffect(() => {
    setCardList(cards as CollectionCardWithPokemon[])
  }, [cards])

  // Calculate total collection value
  const totalValue = useMemo(() => {
    return calculateCollectionValue(cardList)
  }, [cardList])

  const handleViewCard = (card: CollectionCard) => {
    setSelectedCard(card as CollectionCardWithPokemon)
  }

  const handleUpdateCard = (updatedCard: CollectionCardWithPokemon) => {
    setCardList(prev => prev.map(card => 
      card.id === updatedCard.id ? updatedCard : card
    ))
    setSelectedCard(updatedCard)
  }

  const handleDeleteCard = () => {
    if (!selectedCard) return
    setCardList(prev => prev.filter(card => card.id !== selectedCard.id))
    setSelectedCard(null)
  }

  const handleNavigateToCard = (cardId: string) => {
    const card = cardList.find(c => c.id === cardId)
    if (card) {
      setSelectedCard(card)
    }
  }

  // Show empty state if no cards
  if (cardList.length === 0) {
    return <EmptyCollectionState />
  }

  return (
    <div className={viewMode === 'list' ? 'h-[calc(100vh-1.5rem)] flex flex-col overflow-hidden' : ''}>
      <CollectionHeader 
        cardCount={cardList.length}
        totalValue={totalValue}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      {viewMode === 'grid' ? (
        <ItemGrid
          items={cardList}
          renderItem={(card, index) => (
            <CollectionCardGridItem
              key={card.id}
              card={card}
              onViewCard={() => handleViewCard(card)}
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
            items={cardList}
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
                onViewCard={() => handleViewCard(card)}
              />
            )}
            emptyStateComponent={<EmptyCollectionState />}
          />
        </div>
      )}

      {/* Quickview - Responsive: automatically adapts to screen size */}
      {selectedCard && (
        <QuickView
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          title={selectedCard.pokemon_card?.name || selectedCard.manual_card_name || 'Card Details'}
          onNavigateToCard={handleNavigateToCard}
          cardList={cardList.map(c => ({ 
            id: c.id, 
            name: c.pokemon_card?.name || c.manual_card_name || 'Unknown' 
          }))}
          currentCardId={selectedCard.id}
        >
          <CollectionQuickViewContent
            card={selectedCard}
            onUpdate={handleUpdateCard}
            onDelete={handleDeleteCard}
            onClose={() => setSelectedCard(null)}
          />
        </QuickView>
      )}
    </div>
  )
}