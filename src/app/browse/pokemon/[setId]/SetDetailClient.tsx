'use client'

import { useState, useMemo } from 'react'
import { getCardImageUrl } from '@/lib/pokemon-db'
import { extractMarketPrices, getBestPrice } from '@/utils/priceUtils'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import type { PokemonSetWithCardsAndProducts } from '@/models/pokemon'
import CardQuickviewSideSheet from '@/components/shared/quickview/CardQuickviewSideSheet'
import CardQuickViewModal from '@/components/shared/quickview/CardQuickViewModal'
import PokemonSetHeader from '@/components/browse/pokemon/PokemonSetHeader'
import TabNavigation from '@/components/ui/TabNavigation'
import BrowseFilterAndSort from '@/components/browse/BrowseFilterAndSort'
import ItemGrid from '@/components/ui/ItemGrid'
import ItemList from '@/components/ui/ItemList'
import ViewToggle, { type ViewMode } from '@/components/ui/ViewToggle'
import SetCardsEmptyState from '@/components/ui/SetCardsEmptyState'
import TCGCard from '@/components/cards/TCGCard'
import TCGProduct from '@/components/cards/TCGProduct'
import CardListItem from '@/components/pokemon/CardListItem'

interface SetDetailClientProps {
  initialData: PokemonSetWithCardsAndProducts
  setId: string
}

export default function SetDetailClient({ initialData, setId }: SetDetailClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'cards' | 'products'>('cards')
  const [sortOrder, setSortOrder] = useState('num_asc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  
  // Use custom hook to detect desktop viewport
  const isDesktop = useIsDesktop()

  // Filter and sort cards based on search query and sort order
  const filteredCards = useMemo(() => {
    let cards = initialData.cards || []
    
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
  }, [initialData.cards, searchQuery, sortOrder])

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
    if (tabId === 'cards' || tabId === 'products') {
      setActiveTab(tabId)
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
        priceData: card.price_data as Record<string, unknown> | null,
        metadata: [
          ...(card.local_id ? [{ value: `#${card.local_id}` }] : []),
          ...(card.rarity ? [{ value: card.rarity }] : [])
        ]
      }}
      href={`/browse/pokemon/${setId}/${card.id}`}
      onClick={handleCardClick}
      getImageUrl={(image, quality, fallback) => getCardImageUrl(image, quality as 'low' | 'high', fallback)}
      imageQuality="low"
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
        tcgplayer_image_url: product.tcgplayer_image_url || undefined
      }}
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
      <PokemonSetHeader setData={initialData} />

      {/* Tabs */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Search and Sort (only show for cards tab) */}
      {activeTab === 'cards' && (
        <BrowseFilterAndSort
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by card name or number..."
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          sortOptions={sortOptions}
          rightContent={
            <ViewToggle
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          }
        />
      )}

      {/* Content based on active tab */}
      {activeTab === 'cards' ? (
        viewMode === 'grid' ? (
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
                card={{
                  ...card,
                  price_data: card.price_data as Record<string, unknown> | null
                }}
                setId={setId}
                onClick={handleCardClick}
              />
            )}
            emptyStateComponent={cardsEmptyState}
          />
        )
      ) : (
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
      )}

      {/* Card Quickview - Responsive: Sidesheet on desktop, Modal on mobile */}
      {selectedCardId && (
        <>
          {isDesktop ? (
            <CardQuickviewSideSheet
              cardId={selectedCardId}
              setId={setId}
              isOpen={isQuickViewOpen}
              onClose={handleQuickViewClose}
              onNavigateToCard={handleNavigateToCard}
              cardList={filteredCards.map(card => ({ id: card.id, name: card.name }))}
            />
          ) : (
            <CardQuickViewModal
              cardId={selectedCardId}
              setId={setId}
              isOpen={isQuickViewOpen}
              onClose={handleQuickViewClose}
              onNavigateToCard={handleNavigateToCard}
              cardList={filteredCards.map(card => ({ id: card.id, name: card.name }))}
            />
          )}
        </>
      )}
    </div>
  )
}