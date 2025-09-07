'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getCardImageUrl } from '@/lib/pokemon-db'
import { extractMarketPrices } from '@/utils/priceUtils'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { calculateAdjacentCards, type AdjacentCards } from '@/utils/card-navigation'
import { getEbaySearchUrl } from '@/utils/external-links'
import { useAuth } from '@/hooks/useAuth'
import AddToCollectionForm from '@/components/collection/AddToCollectionForm'
import type { CardFull } from '@/models/pokemon'

interface CardQuickViewModalProps {
  cardId: string
  setId?: string
  cardType?: 'pokemon' | 'onepiece' | 'sports' | 'other'
  isOpen: boolean
  onClose: () => void
  onNavigateToCard?: (cardId: string) => void
  cardList?: Array<{ id: string; name: string }>
}

export default function CardQuickViewModal({
  cardId,
  setId,
  cardType = 'pokemon',
  isOpen,
  onClose,
  onNavigateToCard,
  cardList
}: CardQuickViewModalProps) {
  const { user } = useAuth()
  const [cardData, setCardData] = useState<CardFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCollectionForm, setShowCollectionForm] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [adjacentCards, setAdjacentCards] = useState<AdjacentCards>({ 
    prevCard: null, 
    nextCard: null 
  })

  // Update adjacent cards when card list or card ID changes
  const updateAdjacentCards = useCallback(() => {
    const adjacent = calculateAdjacentCards(cardList, cardId);
    setAdjacentCards(adjacent);
  }, [cardList, cardId])

  const loadCardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (cardType === 'pokemon') {
        // Fetch only card data from API route
        const cardResponse = await fetch(`/api/pokemon/cards/${cardId}`)
        
        if (!cardResponse.ok) {
          throw new Error('Failed to fetch card')
        }
        
        const card = await cardResponse.json()
        setCardData(card)
        
        // Calculate adjacent cards from provided card list
        updateAdjacentCards()
      }
      
    } catch (err) {
      setError('Failed to load card details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [cardId, cardType, updateAdjacentCards])

  useEffect(() => {
    if (isOpen && cardId) {
      loadCardData()
    }
  }, [cardId, isOpen, loadCardData])

  // Recalculate adjacent cards when card list or card ID changes
  useEffect(() => {
    updateAdjacentCards();
  }, [updateAdjacentCards])

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Lock all scrolling - both html and body
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      return () => {
        // Restore scrolling
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      };
    }
  }, [isOpen])

  const getCardName = () => {
    if (!cardData) return 'Loading...'
    
    switch (cardType) {
      case 'pokemon':
        return cardData.name
      default:
        return 'Card Details'
    }
  }

  const getCardImage = () => {
    if (!cardData) return null
    
    switch (cardType) {
      case 'pokemon':
        return getCardImageUrl(cardData.image, 'low', cardData.tcgplayer_image_url)
      default:
        return null
    }
  }

  const getAvailableVariants = () => {
    if (!cardData) return []
    
    const variants: string[] = []
    if (cardData.variant_normal) variants.push('normal')
    if (cardData.variant_holo) variants.push('holo')
    if (cardData.variant_reverse) variants.push('reverse_holo')
    if (cardData.variant_first_edition) variants.push('first_edition')
    
    return variants.length > 0 ? variants : ['normal']
  }

  const handleCollectionSuccess = (message: string) => {
    setSuccessMessage(message)
    setErrorMessage(null)
    setShowCollectionForm(false)
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null)
    }, 3000)
  }

  const handleCollectionError = (error: string) => {
    setErrorMessage(error)
    setSuccessMessage(null)
  }

  const handleAddToCollectionClick = () => {
    if (!user) {
      // Redirect to sign up/login
      window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }
    
    setShowCollectionForm(true)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop - covers entire document height */}
      <div 
        className="absolute top-0 left-0 bg-black/50 backdrop-blur-sm z-40"
        style={{ 
          height: `${document.documentElement.scrollHeight}px`, 
          width: '100%' 
        }}
        onClick={onClose}
      />
      
      {/* Modal - Bottom sheet on mobile, center modal on tablet */}
      <div className={`fixed z-50 transform transition-all duration-300 ease-out flex flex-col
        max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:rounded-t-2xl max-sm:max-h-[85vh]
        sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-xl sm:rounded-lg sm:max-h-[90vh]
        bg-white shadow-2xl overflow-hidden ${
        isOpen 
          ? 'max-sm:translate-y-0 sm:scale-100 sm:opacity-100' 
          : 'max-sm:translate-y-full sm:scale-95 sm:opacity-0'
      }`}>
        
        {/* Handle bar for mobile bottom sheet */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-8 h-1 bg-grey-300 rounded-full"></div>
        </div>
        
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-grey-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-grey-900 truncate">
            {getCardName()}
          </h2>
          <button
            onClick={onClose}
            className="text-grey-400 hover:text-grey-600 transition-colors p-1"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          )}

          {error && (
            <div className="text-center py-12 px-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {cardData && !loading && (
            <div className="p-4">
              {/* Two column layout on tablet, single column on mobile */}
              <div className="flex flex-col sm:flex-row sm:gap-4">
                {/* Card Image */}
                <div className="flex justify-center sm:flex-shrink-0 mb-4 sm:mb-0">
                  <div className="relative w-48 sm:w-40">
                    {getCardImage() && (
                      <Image
                        src={getCardImage()!}
                        alt={getCardName()}
                        width={192}
                        height={268}
                        className="w-full h-auto rounded-lg shadow-md"
                        priority
                      />
                    )}
                  </div>
                </div>

                {/* Card Details */}
                <div className="flex-1 space-y-4">
                  {cardType === 'pokemon' && renderPokemonDetails(cardData as CardFull)}
                  
                  {/* Success/Error Messages */}
                  {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-md text-sm">
                      {successMessage}
                    </div>
                  )}
                  {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-sm">
                      {errorMessage}
                    </div>
                  )}

                  {/* Collection Form or Action Buttons */}
                  {showCollectionForm ? (
                    <AddToCollectionForm
                      cardId={cardId}
                      cardName={getCardName()}
                      availableVariants={getAvailableVariants()}
                      onSuccess={handleCollectionSuccess}
                      onError={handleCollectionError}
                      onClose={() => setShowCollectionForm(false)}
                      mode="modal"
                    />
                  ) : (
                    <div className="space-y-2">
                      <Link
                        href={`/browse/pokemon/${setId}/${cardId}`}
                        className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-blue-600 text-blue-600 text-sm font-medium rounded-md hover:bg-blue-50 transition-colors"
                      >
                        View Details
                      </Link>
                      <button 
                        onClick={handleAddToCollectionClick}
                        className="w-full bg-orange-600 text-white py-2.5 px-4 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
                      >
                        {user ? 'Add to Collection' : 'Sign Up to Collect'}
                      </button>

                      {/* Shop Links */}
                      {cardData.tcgplayer_product_id && (
                        <a
                          href={`https://www.tcgplayer.com/product/${cardData.tcgplayer_product_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-orange-600 text-orange-600 text-sm font-medium rounded-md hover:bg-orange-50 transition-colors"
                        >
                          Shop on TCGPlayer
                          <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                      
                      <a
                        href={getEbaySearchUrl(`${cardData.name} ${cardData.local_id} ${cardData.set?.name || ''}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-orange-600 text-orange-600 text-sm font-medium rounded-md hover:bg-orange-50 transition-colors"
                      >
                        Shop on eBay
                        <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      
                      <p className="text-xs text-grey-500 text-center">Shopping links may contain affiliate links</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Navigation Footer */}
        {(adjacentCards.prevCard || adjacentCards.nextCard) && (
          <div className="flex-shrink-0 bg-white border-t border-grey-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => adjacentCards.prevCard && onNavigateToCard?.(adjacentCards.prevCard.id)}
                disabled={!adjacentCards.prevCard}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  adjacentCards.prevCard
                    ? 'text-orange-600 hover:bg-orange-50'
                    : 'text-grey-300 cursor-not-allowed'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Previous</span>
              </button>

              <button
                onClick={() => adjacentCards.nextCard && onNavigateToCard?.(adjacentCards.nextCard.id)}
                disabled={!adjacentCards.nextCard}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  adjacentCards.nextCard
                    ? 'text-orange-600 hover:bg-orange-50'
                    : 'text-grey-300 cursor-not-allowed'
                }`}
              >
                <span>Next</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// Pokemon-specific renderer - optimized for modal
function renderPokemonDetails(card: CardFull) {
  // Build variants array from boolean fields
  const variants: string[] = []
  if (card.variant_normal) variants.push('Normal')
  if (card.variant_holo) variants.push('Holo')
  if (card.variant_reverse) variants.push('Reverse')
  if (card.variant_first_edition) variants.push('1st Edition')
  
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-grey-900 mb-1">{card.name}</h3>
        <p className="text-sm text-grey-600">
          {card.set?.name || 'Unknown Set'} • #{card.local_id || 'No Number'}
        </p>
      </div>

      {/* Card Info Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {card.category && (
          <div>
            <p className="font-medium text-grey-500">Category</p>
            <p className="text-grey-900">{card.category}</p>
          </div>
        )}
        
        {card.rarity && (
          <div>
            <p className="font-medium text-grey-500">Rarity</p>
            <p className="text-grey-900">{card.rarity}</p>
          </div>
        )}

        {card.illustrator && (
          <div className="col-span-2">
            <p className="font-medium text-grey-500">Illustrator</p>
            <p className="text-grey-900">{card.illustrator}</p>
          </div>
        )}

        {variants.length > 0 && (
          <div className="col-span-2">
            <p className="font-medium text-grey-500">Variants</p>
            <p className="text-grey-900">
              {variants.join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Market Prices Section */}
      <div className="border-t pt-3 mt-3">
        <h4 className="text-sm font-semibold text-grey-900 mb-2">💰 Market Prices</h4>
        {renderPriceSection(card)}
      </div>
    </div>
  )
}

// Helper function to render price section
function renderPriceSection(card: CardFull) {
  const prices = extractMarketPrices(card.price_data);
  
  if (!prices) {
    return (
      <p className="text-sm text-grey-500 italic">Price data unavailable</p>
    );
  }

  // Only show variants that have prices
  const availablePrices = Object.entries(prices)
    .filter(([, price]) => price > 0)
    .map(([variant, price]) => ({
      label: variant,
      price: price as number
    }));

  if (availablePrices.length === 0) {
    return (
      <p className="text-sm text-grey-500 italic">Price data unavailable</p>
    );
  }

  return (
    <div className="space-y-1.5">
      {availablePrices.map(({ label, price }) => (
        <div key={label} className="flex justify-between text-sm">
          <span className="text-grey-600">{label}</span>
          <span className="font-semibold text-green-600">
            ${price.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}