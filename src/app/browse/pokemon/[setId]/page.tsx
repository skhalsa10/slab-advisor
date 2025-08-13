'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getSetWithCardsAndProducts, getCardImageUrl, getLogoUrl } from '@/lib/pokemon-db'
import LoadingScreen from '@/components/ui/LoadingScreen'
import AppNavigation from '@/components/layout/AppNavigation'
import type { PokemonSetWithCardsAndProducts } from '@/models/pokemon'
import CardDetailsModal from '@/components/browse/cards/CardDetailsModal'

export default function SetDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const setId = params.setId as string
  
  const [set, setSet] = useState<PokemonSetWithCardsAndProducts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'cards' | 'products'>('cards')

  useEffect(() => {
    async function fetchSet() {
      try {
        setLoading(true)
        const data = await getSetWithCardsAndProducts(setId)
        setSet(data)
        setError(null)
      } catch (err) {
        setError('Failed to load set details. Please try again later.')
        console.error('Error fetching set:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSet()
  }, [setId])

  // Filter cards based on search query
  const filteredCards = useMemo(() => {
    if (!set || !searchQuery) return set?.cards || []
    
    return set.cards.filter(card => 
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.local_id && card.local_id.toString().toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [set, searchQuery])

  const handleCardClick = (e: React.MouseEvent, cardId: string) => {
    e.preventDefault()
    setSelectedCardId(cardId)
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <AppNavigation>
        <LoadingScreen fullScreen={false} />
      </AppNavigation>
    )
  }

  if (error || !set) {
    return (
      <AppNavigation>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-grey-900 mb-2">Error Loading Set</h3>
          <p className="text-sm text-grey-600 mb-4">{error || 'Set not found'}</p>
          <button
            onClick={() => router.push('/browse/pokemon')}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Back to Sets
          </button>
        </div>
      </AppNavigation>
    )
  }

  return (
    <AppNavigation>
      <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-grey-200 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            {set.logo && (
              <Image
                src={getLogoUrl(set.logo)}
                alt={set.name}
                width={80}
                height={80}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-grey-900">{set.name}</h1>
              <p className="mt-1 text-sm text-grey-600">
                {set.series?.name} • {set.card_count_total || 0} cards
              </p>
              {set.release_date && (
                <p className="mt-1 text-sm text-grey-500">
                  Released: {new Date(set.release_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <Link
            href="/browse/pokemon"
            className="text-sm text-orange-600 hover:text-orange-700 self-start"
          >
            ← Back to Sets
          </Link>
        </div>
        
        {/* Action Buttons */}
        {set.tcgplayer_url && (
          <div className="mt-4">
            <a
              href={set.tcgplayer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors"
            >
              Shop on TCGPlayer
              <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}

        {/* Set Statistics */}
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-grey-50 rounded-lg p-3">
              <p className="text-xs text-grey-600">Total Cards</p>
              <p className="text-lg font-semibold text-grey-900">{set.card_count_total || 0}</p>
            </div>
            <div className="bg-grey-50 rounded-lg p-3">
              <p className="text-xs text-grey-600">Official Count</p>
              <p className="text-lg font-semibold text-grey-900">{set.card_count_official || 0}</p>
            </div>
            {set.card_count_holo !== null && set.card_count_holo > 0 && (
              <div className="bg-grey-50 rounded-lg p-3">
                <p className="text-xs text-grey-600">Holo Cards</p>
                <p className="text-lg font-semibold text-grey-900">{set.card_count_holo}</p>
              </div>
            )}
            {set.card_count_reverse !== null && set.card_count_reverse > 0 && (
              <div className="bg-grey-50 rounded-lg p-3">
                <p className="text-xs text-grey-600">Reverse Holo</p>
                <p className="text-lg font-semibold text-grey-900">{set.card_count_reverse}</p>
              </div>
            )}
            {set.card_count_first_ed !== null && set.card_count_first_ed > 0 && (
              <div className="bg-grey-50 rounded-lg p-3">
                <p className="text-xs text-grey-600">1st Edition</p>
                <p className="text-lg font-semibold text-grey-900">{set.card_count_first_ed}</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-grey-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('cards')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'cards'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-grey-500 hover:text-grey-700 hover:border-grey-300'
            }`}
          >
            Cards
            {set.cards.length > 0 && (
              <span className="ml-2 py-0.5 px-2 rounded-full bg-grey-100 text-xs text-grey-600">
                {set.cards.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'products'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-grey-500 hover:text-grey-700 hover:border-grey-300'
            }`}
          >
            Products
            {set.products.length > 0 && (
              <span className="ml-2 py-0.5 px-2 rounded-full bg-grey-100 text-xs text-grey-600">
                {set.products.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Search Bar (only show for cards tab) */}
      {activeTab === 'cards' && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search by card name or number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-grey-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-grey-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'cards' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredCards.length === 0 ? (
            <div className="col-span-full text-center py-12">
              {searchQuery ? (
                <p className="text-grey-600">No cards found matching &quot;{searchQuery}&quot;</p>
              ) : set.cards.length === 0 ? (
                <div className="space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-grey-100 mb-2">
                    <svg className="w-8 h-8 text-grey-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-grey-900 mb-1">Card data not yet available</h3>
                  </div>
                </div>
              ) : (
                <p className="text-grey-600">No cards found</p>
              )}
            </div>
          ) : (
            filteredCards.map((card) => (
              <Link
                key={card.id}
                href={`/browse/pokemon/${setId}/${card.id}`}
                onClick={(e) => handleCardClick(e, card.id)}
                className="group relative bg-white rounded-lg overflow-hidden border border-grey-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <div className="aspect-[2.5/3.5] relative">
                  <Image
                    src={getCardImageUrl(card.image, 'low', card.tcgplayer_image_url)}
                    alt={card.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    onError={(e) => {
                      e.currentTarget.src = '/card-placeholder.svg'
                    }}
                  />
                </div>
                <div className="p-2">
                  <h3 className="text-xs font-medium text-grey-900 truncate">
                    {card.name}
                  </h3>
                  <p className="text-xs text-grey-600">
                    #{card.local_id}
                    {card.rarity && ` • ${card.rarity}`}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {set.products.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-grey-600">No products available for this set</p>
            </div>
          ) : (
            set.products.map((product) => (
              <a
                key={product.id}
                href={`https://www.tcgplayer.com/product/${product.tcgplayer_product_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-white rounded-lg overflow-hidden border border-grey-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200"
              >
                <div className="aspect-[2.5/3.5] relative bg-grey-100">
                  {product.tcgplayer_image_url ? (
                    <Image
                      src={product.tcgplayer_image_url}
                      alt={product.name}
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const parent = e.currentTarget.parentElement
                        if (parent) {
                          parent.innerHTML = '<div class="flex items-center justify-center h-full text-grey-400"><svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>'
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-grey-400">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-grey-900 line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-grey-600">Shop on TCGPlayer</span>
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      )}

      {/* Card Details Modal */}
      {selectedCardId && (
        <CardDetailsModal
          cardId={selectedCardId}
          setId={setId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedCardId(null)
          }}
        />
      )}
        </div>
      </AppNavigation>
    )
}