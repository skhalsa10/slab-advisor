'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { getCardImageUrl } from '@/lib/pokemon-db'
import { extractMarketPrices, getBestPrice } from '@/utils/priceUtils'
import { buildAvailableVariants } from '@/utils/variantUtils'
import { useURLFilters, usePreserveFilters } from '@/hooks/useURLFilters'
import { useAuth } from '@/hooks/useAuth'
import { useSetOwnedCards } from '@/hooks/useSetOwnedCards'
import {
  SET_PARAM_CARD_SEARCH,
  SET_PARAM_CARD_SORT,
  SET_PARAM_CARD_VIEW,
  SET_PARAM_CARD_TAB,
  SET_PARAM_OWNERSHIP,
  SET_FILTER_KEYS,
  SET_DEFAULTS,
  TAB_CARDS,
  TAB_PRODUCTS,
  VIEW_MODE_GRID,
  OWNERSHIP_ALL,
  OWNERSHIP_OWNED,
  OWNERSHIP_MISSING,
  type SetDetailTabValue,
  type ViewModeValue,
  type OwnershipFilterValue,
} from '@/constants/url-filters'
import type { PokemonSetWithCardsAndProducts } from '@/models/pokemon'
import QuickView from '@/components/ui/QuickView'
import Toast from '@/components/ui/Toast'
import CardQuickViewContent from '@/components/browse/CardQuickViewContent'
import ProductQuickViewContent from '@/components/browse/ProductQuickViewContent'
import PokemonSetHeader from '@/components/browse/pokemon/PokemonSetHeader'
import TabNavigation from '@/components/ui/TabNavigation'
import BrowseFilterAndSort from '@/components/browse/BrowseFilterAndSort'
import ItemGrid from '@/components/ui/ItemGrid'
import ItemList from '@/components/ui/ItemList'
import ViewToggle, { type ViewMode } from '@/components/ui/ViewToggle'
import SetCardsEmptyState from '@/components/ui/SetCardsEmptyState'
import TCGCard from '@/components/cards/TCGCard'
import TCGProduct from '@/components/cards/TCGProduct'
import TCGProductListItem from '@/components/cards/TCGProductListItem'
import CardListItem from '@/components/pokemon/CardListItem'
import QuickAddModal from '@/components/collection/QuickAddModal'
import QuickAddForm from '@/components/collection/QuickAddForm'
import ProductQuickAddForm from '@/components/collection/ProductQuickAddForm'
import SegmentedControl from '@/components/ui/SegmentedControl'

interface SetDetailClientProps {
  initialData: PokemonSetWithCardsAndProducts
  setId: string
}

export default function SetDetailClient({ initialData, setId }: SetDetailClientProps) {
  const { user } = useAuth()

  // Fetch owned card IDs for ownership filtering
  const { ownedCardIds, isLoading: ownershipLoading, refetch: refetchOwnedCards } = useSetOwnedCards(setId)

  // URL-synced filters for persistence across card detail navigation
  const { values: setFilters, setters: setSetters } = useURLFilters(
    `/browse/pokemon/${setId}`,
    {
      cardSearch: { key: SET_PARAM_CARD_SEARCH, defaultValue: SET_DEFAULTS.cardSearch },
      cardSort: { key: SET_PARAM_CARD_SORT, defaultValue: SET_DEFAULTS.cardSort },
      cardView: { key: SET_PARAM_CARD_VIEW, defaultValue: SET_DEFAULTS.cardView },
      cardTab: { key: SET_PARAM_CARD_TAB, defaultValue: SET_DEFAULTS.cardTab },
      cardOwnership: { key: SET_PARAM_OWNERSHIP, defaultValue: SET_DEFAULTS.cardOwnership }
    }
  )

  // Build href that preserves all params (for card links)
  const { buildHref } = usePreserveFilters()
  // Build href that strips set-level params (for back to browse link)
  const { buildHref: buildBrowseHref } = usePreserveFilters([...SET_FILTER_KEYS])

  // Destructure URL-synced filters for easier access
  const searchQuery = setFilters.cardSearch
  const sortOrder = setFilters.cardSort
  const viewMode = setFilters.cardView as ViewModeValue
  const activeTab = setFilters.cardTab as SetDetailTabValue
  const ownershipFilter = setFilters.cardOwnership as OwnershipFilterValue

  // Local state (doesn't need URL persistence)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  const [productViewMode, setProductViewMode] = useState<ViewMode>('grid')

  // Product QuickView state
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [isProductQuickViewOpen, setIsProductQuickViewOpen] = useState(false)

  // Quick Add state (Cards)
  const [quickAddCardId, setQuickAddCardId] = useState<string | null>(null)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddAnchorRect, setQuickAddAnchorRect] = useState<DOMRect | null>(null)

  // Quick Add state (Products)
  const [quickAddProductId, setQuickAddProductId] = useState<string | null>(null)
  const [isProductQuickAddOpen, setIsProductQuickAddOpen] = useState(false)
  const [productQuickAddAnchorRect, setProductQuickAddAnchorRect] = useState<DOMRect | null>(null)

  const [toastState, setToastState] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Ref to hold the ownership refetch function
  const ownershipRefetchRef = useRef<(() => Promise<void>) | null>(null)

  // Callback to receive the refetch function from SetOwnershipSummary
  const handleOwnershipRefetchReady = useCallback((refetch: () => Promise<void>) => {
    ownershipRefetchRef.current = refetch
  }, [])

  // Handler to refresh ownership stats after collection update
  const handleCollectionUpdate = useCallback(() => {
    // Refresh ownership summary widget
    if (ownershipRefetchRef.current) {
      ownershipRefetchRef.current()
    }
    // Refresh owned card IDs for filter
    refetchOwnedCards()
  }, [refetchOwnedCards])

  // Filter and sort cards based on search query, ownership, and sort order
  const filteredCards = useMemo(() => {
    let cards = initialData.cards || []

    // Filter by ownership (only if authenticated and ownership data loaded)
    if (user && !ownershipLoading && ownershipFilter !== OWNERSHIP_ALL) {
      cards = cards.filter(card => {
        const isOwned = ownedCardIds.has(card.id)
        return ownershipFilter === OWNERSHIP_OWNED ? isOwned : !isOwned
      })
    }

    // Filter by search query
    if (searchQuery) {
      cards = cards.filter(card =>
        card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (card.local_id && card.local_id.toString().toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Sort cards based on selected option
    return cards.sort((a, b) => {
      if (sortOrder.startsWith('num_')) {
        // Sort by card number
        const aId = Number(a.local_id) || 0
        const bId = Number(b.local_id) || 0
        return sortOrder === 'num_asc' ? aId - bId : bId - aId
      } else if (sortOrder.startsWith('price_')) {
        // Sort by price
        const aPrices = extractMarketPrices(a.price_data)
        const bPrices = extractMarketPrices(b.price_data)

        // Get the best (lowest) price for each card, or use Infinity if no price
        const aPrice = getBestPrice(aPrices) ?? Infinity
        const bPrice = getBestPrice(bPrices) ?? Infinity

        // For ascending, cards without prices go to the end
        // For descending, cards without prices go to the end
        if (aPrice === Infinity && bPrice === Infinity) return 0
        if (aPrice === Infinity) return 1
        if (bPrice === Infinity) return -1

        return sortOrder === 'price_asc' ? aPrice - bPrice : bPrice - aPrice
      }
      return 0
    })
  }, [initialData.cards, searchQuery, sortOrder, ownershipFilter, ownedCardIds, ownershipLoading, user])

  const handleCardClick = (e: React.MouseEvent, cardId: string) => {
    e.preventDefault()
    setSelectedCardId(cardId)
    setIsQuickViewOpen(true)
  }

  const handleQuickViewClose = () => {
    setIsQuickViewOpen(false)
    setSelectedCardId(null)
  }

  const handleNavigateToCard = (cardId: string) => {
    setSelectedCardId(cardId)
    // Keep the quickview open
  }

  // Product QuickView handlers
  const handleProductClick = useCallback((e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    setSelectedProductId(productId)
    setIsProductQuickViewOpen(true)
  }, [])

  const handleProductQuickViewClose = useCallback(() => {
    setIsProductQuickViewOpen(false)
    setSelectedProductId(null)
  }, [])

  const handleNavigateToProduct = useCallback((productId: string) => {
    setSelectedProductId(productId)
    // Keep the quickview open
  }, [])

  // Quick Add handlers
  const handleQuickAdd = useCallback((e: React.MouseEvent, cardId: string) => {
    e.preventDefault()
    e.stopPropagation()

    // Store the button's position for popover anchoring
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    setQuickAddAnchorRect(rect)

    setQuickAddCardId(cardId)
    setIsQuickAddOpen(true)
  }, [])

  const handleQuickAddSuccess = useCallback((message: string) => {
    setToastState({ type: 'success', message })
    setIsQuickAddOpen(false)
    setQuickAddCardId(null)
    setQuickAddAnchorRect(null)

    // Refresh ownership widget
    handleCollectionUpdate()
  }, [handleCollectionUpdate])

  const handleQuickAddError = useCallback((message: string) => {
    setToastState({ type: 'error', message })
    // Keep modal open for retry
  }, [])

  const handleQuickAddClose = useCallback(() => {
    setIsQuickAddOpen(false)
    setQuickAddCardId(null)
    setQuickAddAnchorRect(null)
  }, [])

  // Product Quick Add handlers
  const handleProductQuickAdd = useCallback((e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    e.stopPropagation()

    // Store the button's position for popover anchoring
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    setProductQuickAddAnchorRect(rect)

    setQuickAddProductId(productId)
    setIsProductQuickAddOpen(true)
  }, [])

  const handleProductQuickAddSuccess = useCallback((message: string) => {
    setToastState({ type: 'success', message })
    setIsProductQuickAddOpen(false)
    setQuickAddProductId(null)
    setProductQuickAddAnchorRect(null)

    // Refresh ownership widget
    handleCollectionUpdate()
  }, [handleCollectionUpdate])

  const handleProductQuickAddError = useCallback((message: string) => {
    setToastState({ type: 'error', message })
    // Keep modal open for retry
  }, [])

  const handleProductQuickAddClose = useCallback(() => {
    setIsProductQuickAddOpen(false)
    setQuickAddProductId(null)
    setProductQuickAddAnchorRect(null)
  }, [])

  const handleToastClose = useCallback(() => {
    setToastState(null)
  }, [])

  // Generic toast handlers for reuse across QuickAdd and QuickView
  const showSuccessToast = useCallback((message: string) => {
    setToastState({ type: 'success', message })
  }, [])

  const showErrorToast = useCallback((message: string) => {
    setToastState({ type: 'error', message })
  }, [])

  // Prepare tabs data
  const tabs = [
    {
      id: 'cards',
      label: 'Cards',
      count: initialData.cards.length
    },
    {
      id: 'products',
      label: 'Products',
      count: initialData.products.length
    }
  ]

  const handleTabChange = (tabId: string) => {
    if (tabId === TAB_CARDS || tabId === TAB_PRODUCTS) {
      setSetters.cardTab(tabId)
    }
  }

  // Sort options for the dropdown
  const sortOptions = [
    { value: 'num_asc', label: 'Number: Low to High' },
    { value: 'num_desc', label: 'Number: High to Low' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' }
  ]

  // Render function for individual cards
  const renderCard = (card: typeof initialData.cards[0]) => (
    <TCGCard
      key={card.id}
      card={{
        id: card.id,
        name: card.name,
        image: card.image || undefined,
        fallbackImageUrl: card.tcgplayer_image_url || undefined,
        priceData: card.price_data,
        metadata: [
          ...(card.local_id ? [{ value: `#${card.local_id}` }] : []),
          ...(card.rarity ? [{ value: card.rarity }] : [])
        ]
      }}
      href={buildHref(`/browse/pokemon/${setId}/${card.id}`)}
      onClick={handleCardClick}
      getImageUrl={(image, quality, fallback) => getCardImageUrl(image, quality as 'low' | 'high', fallback)}
      imageQuality="low"
      showQuickAdd={!!user}
      onQuickAdd={handleQuickAdd}
    />
  )

  // Empty state component for cards
  const cardsEmptyState = (
    <SetCardsEmptyState
      searchQuery={searchQuery}
      hasCards={initialData.cards.length > 0}
      cardType="Pokemon card"
    />
  )

  // Render function for products
  const renderProduct = (product: typeof initialData.products[0]) => (
    <TCGProduct
      key={product.id}
      product={{
        id: product.id.toString(),
        name: product.name,
        tcgplayer_product_id: product.tcgplayer_product_id,
        tcgplayer_image_url: product.tcgplayer_image_url || undefined,
        current_market_price: product.pokemon_product_latest_prices?.market_price ?? null
      }}
      onClick={handleProductClick}
      showQuickAdd={!!user}
      onQuickAdd={handleProductQuickAdd}
    />
  )

  // Empty state for products
  const productsEmptyState = (
    <div className="text-center py-8">
      <p className="text-grey-600">No products available for this set</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <PokemonSetHeader
        setData={initialData}
        backHref={buildBrowseHref('/browse/pokemon')}
        onOwnershipRefetchReady={handleOwnershipRefetchReady}
      />

      {/* Tabs */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Search and Sort */}
      {activeTab === TAB_CARDS ? (
        <BrowseFilterAndSort
          searchQuery={searchQuery}
          onSearchChange={setSetters.cardSearch}
          searchPlaceholder="Search by card name or number..."
          sortOrder={sortOrder}
          onSortChange={setSetters.cardSort}
          sortOptions={sortOptions}
          middleContent={user && (
            <SegmentedControl
              options={[
                { value: OWNERSHIP_ALL, label: 'All' },
                { value: OWNERSHIP_OWNED, label: 'Owned' },
                { value: OWNERSHIP_MISSING, label: 'Missing' }
              ]}
              value={ownershipFilter}
              onChange={(value) => setSetters.cardOwnership(value)}
              size="sm"
              ariaLabel="Filter by ownership"
            />
          )}
          rightContent={
            <ViewToggle
              viewMode={viewMode}
              onViewModeChange={(v) => setSetters.cardView(v)}
            />
          }
        />
      ) : activeTab === TAB_PRODUCTS ? (
        <div className="flex justify-end">
          <ViewToggle
            viewMode={productViewMode}
            onViewModeChange={setProductViewMode}
          />
        </div>
      ) : null}

      {/* Content based on active tab */}
      {activeTab === TAB_CARDS ? (
        viewMode === VIEW_MODE_GRID ? (
          <ItemGrid
            items={filteredCards}
            renderItem={(card) => renderCard(card)}
            emptyStateComponent={cardsEmptyState}
            columns={{
              base: 2,
              sm: 3,
              md: 4,
              lg: 5,
              xl: 6
            }}
          />
        ) : (
          <ItemList
            items={filteredCards}
            renderHeader={() => (
              <tr>
                {user && (
                  <th scope="col" className="px-4 py-3 w-16">
                    <span className="sr-only">Quick Add</span>
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                  Card
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                  Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                  Rarity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            )}
            renderRow={(card) => (
              <CardListItem
                key={card.id}
                card={card}
                setId={setId}
                onClick={handleCardClick}
                showQuickAdd={!!user}
                onQuickAdd={handleQuickAdd}
              />
            )}
            emptyStateComponent={cardsEmptyState}
          />
        )
      ) : (
        productViewMode === 'grid' ? (
          <ItemGrid
            items={initialData.products}
            renderItem={(product) => renderProduct(product)}
            emptyStateComponent={productsEmptyState}
            columns={{
              base: 2,
              sm: 3,
              md: 4,
              lg: 5,
              xl: 6
            }}
          />
        ) : (
          <ItemList
            items={initialData.products}
            renderHeader={() => (
              <tr>
                {user && (
                  <th scope="col" className="px-4 py-3 w-16">
                    <span className="sr-only">Quick Add</span>
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                  Product
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                  Market Price
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            )}
            renderRow={(product) => (
              <TCGProductListItem
                key={product.id}
                product={{
                  id: product.id.toString(),
                  name: product.name,
                  tcgplayer_product_id: product.tcgplayer_product_id,
                  tcgplayer_image_url: product.tcgplayer_image_url || undefined,
                  current_market_price: product.pokemon_product_latest_prices?.market_price ?? null
                }}
                onClick={handleProductClick}
                showQuickAdd={!!user}
                onQuickAdd={handleProductQuickAdd}
              />
            )}
            emptyStateComponent={productsEmptyState}
          />
        )
      )}

      {/* Card Quickview - Responsive: automatically adapts to screen size */}
      {selectedCardId && (
        <QuickView
          isOpen={isQuickViewOpen}
          onClose={handleQuickViewClose}
          onNavigateToCard={handleNavigateToCard}
          cardList={filteredCards.map(card => ({ id: card.id, name: card.name }))}
          currentCardId={selectedCardId}
          showTitle={false}
        >
          <CardQuickViewContent
            cardId={selectedCardId}
            setId={setId}
            onClose={handleQuickViewClose}
            onCollectionUpdate={handleCollectionUpdate}
            onSuccess={showSuccessToast}
            onError={showErrorToast}
          />
        </QuickView>
      )}

      {/* Product Quickview - Responsive: automatically adapts to screen size */}
      {selectedProductId && (
        <QuickView
          isOpen={isProductQuickViewOpen}
          onClose={handleProductQuickViewClose}
          onNavigateToCard={handleNavigateToProduct}
          cardList={initialData.products.map(p => ({ id: p.id.toString(), name: p.name }))}
          currentCardId={selectedProductId}
          showTitle={false}
        >
          <ProductQuickViewContent
            productId={selectedProductId}
            setId={setId}
            onClose={handleProductQuickViewClose}
            onCollectionUpdate={handleCollectionUpdate}
            onSuccess={showSuccessToast}
            onError={showErrorToast}
          />
        </QuickView>
      )}

      {/* Quick Add Modal - Responsive: popover (desktop), modal (tablet), bottom sheet (mobile) */}
      {quickAddCardId && (
        <QuickAddModal
          isOpen={isQuickAddOpen}
          onClose={handleQuickAddClose}
          anchorRect={quickAddAnchorRect}
          title="Quick Add to Collection"
        >
          <QuickAddForm
            cardId={quickAddCardId}
            cardName={filteredCards.find(c => c.id === quickAddCardId)?.name || ''}
            cardImage={getCardImageUrl(
              filteredCards.find(c => c.id === quickAddCardId)?.image,
              'low',
              filteredCards.find(c => c.id === quickAddCardId)?.tcgplayer_image_url || undefined
            )}
            availableVariants={buildAvailableVariants(
              filteredCards.find(c => c.id === quickAddCardId) || {}
            )}
            onSuccess={handleQuickAddSuccess}
            onError={handleQuickAddError}
            onClose={handleQuickAddClose}
          />
        </QuickAddModal>
      )}

      {/* Product Quick Add Modal - Responsive: popover (desktop), modal (tablet), bottom sheet (mobile) */}
      {quickAddProductId && (
        <QuickAddModal
          isOpen={isProductQuickAddOpen}
          onClose={handleProductQuickAddClose}
          anchorRect={productQuickAddAnchorRect}
          title="Quick Add to Collection"
        >
          <ProductQuickAddForm
            productId={quickAddProductId}
            productName={initialData.products.find(p => p.id.toString() === quickAddProductId)?.name || ''}
            productImage={initialData.products.find(p => p.id.toString() === quickAddProductId)?.tcgplayer_image_url || undefined}
            onSuccess={handleProductQuickAddSuccess}
            onError={handleProductQuickAddError}
            onClose={handleProductQuickAddClose}
          />
        </QuickAddModal>
      )}

      {/* Toast Notification */}
      {toastState && (
        <Toast
          type={toastState.type}
          message={toastState.message}
          onClose={handleToastClose}
        />
      )}
    </div>
  )
}