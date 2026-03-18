'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
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
import SelectionActionBar from '@/components/collection/SelectionActionBar'
import AddToBinderDialog from '@/components/collection/AddToBinderDialog'
import Toast from '@/components/ui/Toast'
import { createBinder, renameBinder, deleteBinder, addCardsToBinder, removeCardsFromBinder } from '@/actions/binders'
import { bulkDeleteCollectionCards, bulkDeleteCollectionProducts } from '@/actions/collection'
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
 * Handles view mode switching, binder filtering, selection mode, and card/product interactions
 * without any database queries. All data is passed down from the server-side
 * parent component. All mutations go through server actions.
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

  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showAddToBinder, setShowAddToBinder] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)

  // Toast state
  const [toastState, setToastState] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)

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

  // --- Selection mode helpers ---

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false)
    setSelectedIds(new Set())
  }, [])

  // The list of currently visible items for select all
  const currentVisibleItems = useMemo(() => {
    if (collectionType === 'cards') return filteredCardList
    return productList
  }, [collectionType, filteredCardList, productList])

  const isAllSelected = useMemo(() => {
    if (currentVisibleItems.length === 0) return false
    return currentVisibleItems.every((item) => selectedIds.has(item.id))
  }, [currentVisibleItems, selectedIds])

  // --- Selection handlers ---

  const handleToggleSelectionMode = () => {
    if (isSelectionMode) {
      exitSelectionMode()
    } else {
      setIsSelectionMode(true)
    }
  }

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    const allIds = new Set(currentVisibleItems.map((item) => item.id))
    setSelectedIds(allIds)
  }, [currentVisibleItems])

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // --- Auto-exit selection mode on context changes ---

  const handleBinderChange = (binder: Binder) => {
    exitSelectionMode()
    setActiveBinder(binder)
  }

  const handleCollectionTypeChange = (type: CollectionType) => {
    exitSelectionMode()
    setCollectionType(type)
  }

  // --- Binder action handlers ---

  const handleAddToBinder = async (binderId: string) => {
    setIsBulkActionLoading(true)
    try {
      const cardIds = Array.from(selectedIds)
      const { data, error } = await addCardsToBinder(binderId, cardIds)
      if (error) {
        setToastState({ type: 'error', message: error })
        return
      }

      // Update local binderCardList with new entries
      if (data && data.length > 0) {
        setBinderCardList((prev) => [...prev, ...data])
      }

      const binderName = binderList.find((b) => b.id === binderId)?.name ?? 'binder'
      setToastState({
        type: 'success',
        message: `Added ${cardIds.length} ${cardIds.length === 1 ? 'card' : 'cards'} to ${binderName}`
      })
      setShowAddToBinder(false)
      exitSelectionMode()
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  const handleRemoveFromBinder = async () => {
    setIsBulkActionLoading(true)
    try {
      const cardIds = Array.from(selectedIds)
      const { error } = await removeCardsFromBinder(activeBinder.id, cardIds)
      if (error) {
        setToastState({ type: 'error', message: error })
        return
      }

      // Remove from local binderCardList
      const removedSet = new Set(cardIds)
      setBinderCardList((prev) =>
        prev.filter(
          (bc) =>
            !(bc.binder_id === activeBinder.id && removedSet.has(bc.collection_card_id))
        )
      )

      setToastState({
        type: 'success',
        message: `Removed ${cardIds.length} ${cardIds.length === 1 ? 'card' : 'cards'} from ${activeBinder.name}`
      })
      exitSelectionMode()
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  // --- Bulk delete handlers ---

  const handleBulkDelete = async () => {
    setIsBulkActionLoading(true)
    try {
      const ids = Array.from(selectedIds)

      if (collectionType === 'cards') {
        const { error, deletedCount } = await bulkDeleteCollectionCards(ids)
        if (error) {
          setToastState({ type: 'error', message: error })
          return
        }

        // Remove from local state
        const deletedSet = new Set(ids)
        setCardList((prev) => prev.filter((c) => !deletedSet.has(c.id)))

        // Also remove from binderCardList
        setBinderCardList((prev) =>
          prev.filter((bc) => !deletedSet.has(bc.collection_card_id))
        )

        setToastState({
          type: 'success',
          message: `Deleted ${deletedCount} ${deletedCount === 1 ? 'card' : 'cards'} from collection`
        })
      } else {
        const { error, deletedCount } = await bulkDeleteCollectionProducts(ids)
        if (error) {
          setToastState({ type: 'error', message: error })
          return
        }

        // Remove from local state
        const deletedSet = new Set(ids)
        setProductList((prev) => prev.filter((p) => !deletedSet.has(p.id)))

        setToastState({
          type: 'success',
          message: `Deleted ${deletedCount} ${deletedCount === 1 ? 'product' : 'products'} from collection`
        })
      }

      setShowBulkDeleteConfirm(false)
      exitSelectionMode()
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  // --- Binder CRUD handlers ---

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

  // --- Card handlers ---

  const handleViewCard = (card: CollectionCard) => {
    // Block QuickView in selection mode
    if (isSelectionMode) return
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

  // --- Product handlers ---

  const handleViewProduct = (product: CollectionProductWithPriceChanges) => {
    // Block QuickView in selection mode
    if (isSelectionMode) return
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

  const isCustomBinder = !activeBinder.is_default
  const thClasses = 'px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'

  return (
    <div>
      <CollectionHeader
        cardCount={filteredCardList.length}
        productCount={productList.length}
        totalValue={displayTotalValue}
        collectionType={collectionType}
        onCollectionTypeChange={handleCollectionTypeChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        binders={binderList}
        activeBinder={activeBinder}
        onBinderChange={handleBinderChange}
        onCreateBinder={() => setShowCreateBinder(true)}
        onRenameBinder={() => setShowRenameBinder(true)}
        onDeleteBinder={() => setShowDeleteBinder(true)}
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={handleToggleSelectionMode}
      />

      {/* Cards View */}
      {collectionType === 'cards' && (
        <div className={isSelectionMode ? 'pb-28 md:pb-24' : ''}>
          {/* Empty binder state (only for custom binders with no cards) */}
          {filteredCardList.length === 0 && !activeBinder.is_default ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">This binder is empty</p>
              <p className="text-muted-foreground text-sm mt-1">
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
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds.has(card.id)}
                  onToggleSelect={() => handleToggleSelect(card.id)}
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
                  {isSelectionMode && (
                    <th scope="col" className="px-4 py-3 w-12" />
                  )}
                  <th scope="col" className={thClasses}>Card</th>
                  <th scope="col" className={thClasses}>Variant</th>
                  <th scope="col" className={thClasses}>Condition</th>
                  <th scope="col" className={`${thClasses} text-center`}>Qty</th>
                  <th scope="col" className={thClasses}>Grade</th>
                  <th scope="col" className={`${thClasses} text-right`}>Price</th>
                  <th scope="col" className={`${thClasses} text-right`}>Total</th>
                  <th scope="col" className={thClasses}>Added</th>
                  {!isSelectionMode && (
                    <th scope="col" className={thClasses}>Actions</th>
                  )}
                </tr>
              )}
              renderRow={(card) => (
                <CollectionCardListItem
                  key={card.id}
                  card={card}
                  onViewCard={() => handleViewCard(card)}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds.has(card.id)}
                  onToggleSelect={() => handleToggleSelect(card.id)}
                />
              )}
              emptyStateComponent={<EmptyCollectionState />}
            />
          )}
        </div>
      )}

      {/* Sealed Products View */}
      {collectionType === 'sealed' && (
        <div className={isSelectionMode ? 'pb-28 md:pb-24' : ''}>
          {viewMode === 'grid' ? (
            <SealedCollectionGrid
              products={productList}
              onViewProduct={handleViewProduct}
              isSelectionMode={isSelectionMode}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
            />
          ) : (
            <SealedCollectionList
              products={productList}
              onViewProduct={handleViewProduct}
              isSelectionMode={isSelectionMode}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
            />
          )}
        </div>
      )}

      {/* Selection Action Bar (floating) */}
      {isSelectionMode && (
        <SelectionActionBar
          selectedCount={selectedIds.size}
          isCustomBinder={isCustomBinder}
          collectionType={collectionType}
          onAddToBinder={() => setShowAddToBinder(true)}
          onRemoveFromBinder={handleRemoveFromBinder}
          onDelete={() => setShowBulkDeleteConfirm(true)}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          isAllSelected={isAllSelected}
        />
      )}

      {/* Card Quickview — blocked in selection mode */}
      {selectedCard && !isSelectionMode && (
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

      {/* Product Quickview — blocked in selection mode */}
      {selectedProduct && !isSelectionMode && (
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

      {/* Add to Binder Dialog */}
      <AddToBinderDialog
        isOpen={showAddToBinder}
        binders={binderList}
        currentBinderId={isCustomBinder ? activeBinder.id : undefined}
        selectedCount={selectedIds.size}
        onConfirm={handleAddToBinder}
        onCancel={() => setShowAddToBinder(false)}
        onCreateBinder={() => {
          setShowAddToBinder(false)
          setShowCreateBinder(true)
        }}
      />

      {/* Bulk Delete Confirmation Dialog */}
      {showBulkDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowBulkDeleteConfirm(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4">
            <div className="bg-card rounded-lg shadow-xl p-6">
              <h3 className="text-lg font-semibold text-foreground">
                Delete {selectedIds.size} {collectionType === 'cards' ? (selectedIds.size === 1 ? 'card' : 'cards') : (selectedIds.size === 1 ? 'product' : 'products')}?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                This will permanently remove {selectedIds.size === 1 ? 'this item' : 'these items'} from your collection.
                This action cannot be undone.
              </p>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  disabled={isBulkActionLoading}
                  className="flex-1 px-4 py-2 border border-border text-foreground text-sm font-medium rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={isBulkActionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBulkActionLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </>
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

      {/* Toast Notification */}
      {toastState && (
        <Toast
          type={toastState.type}
          message={toastState.message}
          onClose={() => setToastState(null)}
        />
      )}
    </div>
  )
}
