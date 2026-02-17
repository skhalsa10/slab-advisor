'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { type CollectionCard, type Binder, type BinderCard } from '@/types/database'
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
import CreateBinderDialog from '@/components/collection/CreateBinderDialog'
import RenameBinderDialog from '@/components/collection/RenameBinderDialog'
import DeleteBinderDialog from '@/components/collection/DeleteBinderDialog'
import { createBinder, renameBinder, deleteBinder } from '@/actions/binders'
import { type ViewMode } from '@/components/collection/ViewToggle'

interface CollectionClientProps {
  cards: CollectionCard[]
  products: CollectionProductWithPriceChanges[]
  binders: Binder[]
  binderCards: BinderCard[]
}

/**
 * CollectionClient Component
 *
 * Client-side component for managing collection view interactions and state.
 * Handles view mode switching, binder filtering, and card/product interactions
 * without any database queries. All data is passed down from the server-side
 * parent component.
 *
 * @param props - Contains server-fetched collection cards, products, binders, and binder card mappings
 */
export default function CollectionClient({
  cards,
  products,
  binders,
  binderCards
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

  // Binder state
  const [activeBinder, setActiveBinder] = useState<Binder>(
    () => binders.find((b) => b.is_default) || binders[0]
  )
  const [binderList, setBinderList] = useState(binders)
  const [binderCardList, setBinderCardList] = useState(binderCards)
  const [showCreateBinder, setShowCreateBinder] = useState(false)
  const [showRenameBinder, setShowRenameBinder] = useState(false)
  const [showDeleteBinder, setShowDeleteBinder] = useState(false)

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

  // Sync binder data with props when server data changes
  useEffect(() => {
    setBinderList(binders)
  }, [binders])

  useEffect(() => {
    setBinderCardList(binderCards)
  }, [binderCards])

  // Build a Set of card IDs for the active binder (for O(1) lookups)
  // null = default binder = show all cards
  const activeBinderCardIds = useMemo(() => {
    if (activeBinder.is_default) return null

    const ids = new Set<string>()
    for (const bc of binderCardList) {
      if (bc.binder_id === activeBinder.id) {
        ids.add(bc.collection_card_id)
      }
    }
    return ids
  }, [activeBinder, binderCardList])

  // Filtered card list based on active binder
  const filteredCardList = useMemo(() => {
    if (activeBinderCardIds === null) return cardList
    return cardList.filter((card) => activeBinderCardIds.has(card.id))
  }, [cardList, activeBinderCardIds])

  // Calculate total collection value (cards + products)
  const cardsTotalValue = useMemo(() => {
    return calculateCollectionValue(cardList)
  }, [cardList])

  const filteredCardsTotalValue = useMemo(() => {
    if (activeBinderCardIds === null) return cardsTotalValue
    return calculateCollectionValue(filteredCardList)
  }, [filteredCardList, activeBinderCardIds, cardsTotalValue])

  const productsTotalValue = useMemo(() => {
    return calculateProductsValue(productList)
  }, [productList])

  // Display total: filtered cards + all products
  const displayTotalValue = filteredCardsTotalValue + productsTotalValue

  // Binder handlers
  const handleBinderChange = (binder: Binder) => {
    setActiveBinder(binder)
  }

  const handleCreateBinder = async (name: string) => {
    const { data: newBinder, error } = await createBinder(name)
    if (error) throw new Error(error)
    if (!newBinder) throw new Error('Failed to create binder')

    // Add to local binder list
    setBinderList((prev) => [...prev, newBinder])

    // Switch to the new binder
    setActiveBinder(newBinder)

    // Close dialog
    setShowCreateBinder(false)
  }

  const handleRenameBinder = async (name: string) => {
    const { data: updated, error } = await renameBinder(activeBinder.id, name)
    if (error) throw new Error(error)
    if (!updated) throw new Error('Failed to rename binder')

    // Update in local binder list
    setBinderList((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    )
    setActiveBinder(updated)
    setShowRenameBinder(false)
  }

  const handleDeleteBinder = async () => {
    const { error } = await deleteBinder(activeBinder.id)
    if (error) throw new Error(error)

    // Remove from local binder list
    setBinderList((prev) => prev.filter((b) => b.id !== activeBinder.id))

    // Also remove binder_cards for this binder
    setBinderCardList((prev) =>
      prev.filter((bc) => bc.binder_id !== activeBinder.id)
    )

    // Switch to default binder
    const defaultBinder = binderList.find((b) => b.is_default)
    if (defaultBinder) {
      setActiveBinder(defaultBinder)
    }
    setShowDeleteBinder(false)
  }

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
    const card = filteredCardList.find((c) => c.id === cardId)
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

  // Show empty state only if both cards and products are empty (full collection, not filtered)
  const hasNoContent = cardList.length === 0 && productList.length === 0
  if (hasNoContent) {
    return <EmptyCollectionState />
  }

  return (
    <div>
      <CollectionHeader
        cardCount={filteredCardList.length}
        productCount={productList.length}
        totalValue={displayTotalValue}
        collectionType={collectionType}
        onCollectionTypeChange={setCollectionType}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        binders={binderList}
        activeBinder={activeBinder}
        onBinderChange={handleBinderChange}
        onCreateBinder={() => setShowCreateBinder(true)}
        onRenameBinder={() => setShowRenameBinder(true)}
        onDeleteBinder={() => setShowDeleteBinder(true)}
      />

      {/* Cards View */}
      {collectionType === 'cards' && (
        <>
          {/* Empty binder state (only for custom binders with no cards) */}
          {filteredCardList.length === 0 && !activeBinder.is_default ? (
            <div className="text-center py-12">
              <p className="text-grey-500 text-lg">This binder is empty</p>
              <p className="text-grey-400 text-sm mt-1">
                Add cards to this binder from your collection
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <ItemGrid
              items={filteredCardList}
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
              items={filteredCardList}
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
          cardList={filteredCardList.map((c) => ({
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

      {/* Binder Dialogs */}
      <CreateBinderDialog
        isOpen={showCreateBinder}
        onConfirm={handleCreateBinder}
        onCancel={() => setShowCreateBinder(false)}
      />
      <RenameBinderDialog
        isOpen={showRenameBinder}
        currentName={activeBinder.name}
        onConfirm={handleRenameBinder}
        onCancel={() => setShowRenameBinder(false)}
      />
      <DeleteBinderDialog
        isOpen={showDeleteBinder}
        binderName={activeBinder.name}
        onConfirm={handleDeleteBinder}
        onCancel={() => setShowDeleteBinder(false)}
      />
    </div>
  )
}
