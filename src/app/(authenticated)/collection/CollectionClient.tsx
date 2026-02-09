'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { type CollectionCard } from '@/types/database'
import { type CollectionCardWithPokemon } from '@/utils/collectionCardUtils'
import { trackCollectionViewed } from '@/lib/posthog/events'
import {
  type CollectionProductWithPriceChanges,
  calculateProductsValue,
  getProductDisplayName
} from '@/utils/collectionProductUtils'
import { calculateCollectionValue } from '@/utils/collectionPriceUtils'
import CollectionHeader, {
  type CollectionType
} from '@/components/collection/CollectionHeader'
import ItemGrid from '@/components/ui/ItemGrid'
import ItemList from '@/components/ui/ItemList'
import CollectionCardGridItem from '@/components/collection/CollectionCardGridItem'
import CollectionCardListItem from '@/components/collection/CollectionCardListItem'
import SealedCollectionGrid from '@/components/collection/SealedCollectionGrid'
import SealedCollectionList from '@/components/collection/SealedCollectionList'
import EmptyCollectionState from '@/components/collection/EmptyCollectionState'
import QuickView from '@/components/ui/QuickView'
import CollectionQuickViewContent from '@/components/collection/CollectionQuickViewContent'
import CollectionProductQuickViewContent from '@/components/collection/CollectionProductQuickViewContent'
import { type ViewMode } from '@/components/collection/ViewToggle'

interface CollectionClientProps {
  cards: CollectionCard[]
  products: CollectionProductWithPriceChanges[]
}

/**
 * CollectionClient Component
 *
 * Client-side component for managing collection view interactions and state.
 * Handles view mode switching and card/product interactions without any database queries.
 * All data is passed down from the server-side parent component.
 *
 * @param props - Contains server-fetched collection cards and products
 */
export default function CollectionClient({
  cards,
  products
}: CollectionClientProps) {
  // View state
  const [collectionType, setCollectionType] = useState<CollectionType>('cards')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Cards state
  const [selectedCard, setSelectedCard] =
    useState<CollectionCardWithPokemon | null>(null)
  const [cardList, setCardList] = useState(cards as CollectionCardWithPokemon[])

  // Products state
  const [selectedProduct, setSelectedProduct] =
    useState<CollectionProductWithPriceChanges | null>(null)
  const [productList, setProductList] = useState(products)

  // Track collection view on initial load
  const hasTrackedView = useRef(false)
  useEffect(() => {
    if (!hasTrackedView.current) {
      trackCollectionViewed({
        viewMode,
        cardCount: cards.length + products.length
      })
      hasTrackedView.current = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync cardList with props when server data changes (after router.refresh)
  useEffect(() => {
    setCardList(cards as CollectionCardWithPokemon[])
  }, [cards])

  // Sync productList with props when server data changes
  useEffect(() => {
    setProductList(products)
  }, [products])

  // Calculate total collection value (cards + products)
  const cardsTotalValue = useMemo(() => {
    return calculateCollectionValue(cardList)
  }, [cardList])

  const productsTotalValue = useMemo(() => {
    return calculateProductsValue(productList)
  }, [productList])

  const totalValue = cardsTotalValue + productsTotalValue

  // Card handlers
  const handleViewCard = (card: CollectionCard) => {
    setSelectedCard(card as CollectionCardWithPokemon)
  }

  const handleUpdateCard = (updatedCard: CollectionCardWithPokemon) => {
    setCardList((prev) =>
      prev.map((card) => (card.id === updatedCard.id ? updatedCard : card))
    )
    setSelectedCard(updatedCard)
  }

  const handleDeleteCard = () => {
    if (!selectedCard) return
    setCardList((prev) => prev.filter((card) => card.id !== selectedCard.id))
    setSelectedCard(null)
  }

  const handleNavigateToCard = (cardId: string) => {
    const card = cardList.find((c) => c.id === cardId)
    if (card) {
      setSelectedCard(card)
    }
  }

  // Product handlers
  const handleViewProduct = (product: CollectionProductWithPriceChanges) => {
    setSelectedProduct(product)
  }

  const handleUpdateProduct = (updatedProduct: CollectionProductWithPriceChanges) => {
    setProductList((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    )
    setSelectedProduct(updatedProduct)
  }

  const handleDeleteProduct = () => {
    if (!selectedProduct) return
    setProductList((prev) => prev.filter((p) => p.id !== selectedProduct.id))
    setSelectedProduct(null)
  }

  const handleNavigateToProduct = (productId: string) => {
    const product = productList.find((p) => p.id === productId)
    if (product) {
      setSelectedProduct(product)
    }
  }

  // Show empty state only if both cards and products are empty
  const hasNoContent = cardList.length === 0 && productList.length === 0
  if (hasNoContent) {
    return <EmptyCollectionState />
  }

  return (
    <div>
      <CollectionHeader
        cardCount={cardList.length}
        productCount={productList.length}
        totalValue={totalValue}
        collectionType={collectionType}
        onCollectionTypeChange={setCollectionType}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Cards View */}
      {collectionType === 'cards' && (
        <>
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
            <ItemList
              items={cardList}
              renderHeader={() => (
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider"
                  >
                    Card
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider"
                  >
                    Variant
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider"
                  >
                    Condition
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-grey-500 uppercase tracking-wider"
                  >
                    Qty
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider"
                  >
                    Grade
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wider"
                  >
                    Price
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-grey-500 uppercase tracking-wider"
                  >
                    Total
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider"
                  >
                    Added
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider"
                  >
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
          )}
        </>
      )}

      {/* Sealed Products View */}
      {collectionType === 'sealed' && (
        <>
          {viewMode === 'grid' ? (
            <SealedCollectionGrid
              products={productList}
              onViewProduct={handleViewProduct}
            />
          ) : (
            <SealedCollectionList
              products={productList}
              onViewProduct={handleViewProduct}
            />
          )}
        </>
      )}

      {/* Card Quickview */}
      {selectedCard && (
        <QuickView
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          title={selectedCard.pokemon_card?.name || 'Card Details'}
          onNavigateToCard={handleNavigateToCard}
          cardList={cardList.map((c) => ({
            id: c.id,
            name: c.pokemon_card?.name || 'Unknown'
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

      {/* Product Quickview */}
      {selectedProduct && (
        <QuickView
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={getProductDisplayName(selectedProduct)}
          onNavigateToCard={handleNavigateToProduct}
          cardList={productList.map((p) => ({
            id: p.id,
            name: getProductDisplayName(p)
          }))}
          currentCardId={selectedProduct.id}
        >
          <CollectionProductQuickViewContent
            product={selectedProduct}
            onUpdate={handleUpdateProduct}
            onDelete={handleDeleteProduct}
            onClose={() => setSelectedProduct(null)}
          />
        </QuickView>
      )}
    </div>
  )
}