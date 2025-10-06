'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getCardImageUrl } from '@/lib/pokemon-db'
import { extractMarketPrices } from '@/utils/priceUtils'
import { getEbaySearchUrl } from '@/utils/external-links'
import { useAuth } from '@/hooks/useAuth'
import AddToCollectionForm from '@/components/collection/AddToCollectionForm'
import { buildAvailableVariants } from '@/utils/variantUtils'
import type { CardFull } from '@/models/pokemon'

interface CardQuickViewContentProps {
  cardId: string
  setId?: string
  cardType?: 'pokemon' | 'onepiece' | 'sports' | 'other'
  onClose?: () => void
}

/**
 * CardQuickViewContent Component
 * 
 * Displays card details for browsing context (Pokemon sets, etc).
 * Handles fetching card data and rendering card information with collection actions.
 * This component focuses on content only - layout is handled by QuickView wrapper.
 */
export default function CardQuickViewContent({
  cardId,
  setId,
  cardType = 'pokemon'
}: CardQuickViewContentProps) {
  const { user } = useAuth()
  const [cardData, setCardData] = useState<CardFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCollectionForm, setShowCollectionForm] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Reset form state when navigating to a different card
  useEffect(() => {
    setShowCollectionForm(false)
  }, [cardId])

  const loadCardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (cardType === 'pokemon') {
        const cardResponse = await fetch(`/api/pokemon/cards/${cardId}`)
        
        if (!cardResponse.ok) {
          throw new Error('Failed to fetch card')
        }
        
        const card = await cardResponse.json()
        setCardData(card)
      }
    } catch (err) {
      setError('Failed to load card details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [cardId, cardType])

  useEffect(() => {
    if (cardId) {
      loadCardData()
    }
  }, [cardId, loadCardData])

  const getAvailableVariants = () => {
    if (!cardData) return []
    return buildAvailableVariants(cardData)
  }

  const handleCollectionSuccess = (message: string) => {
    setSuccessMessage(message)
    setErrorMessage(null)
    setShowCollectionForm(false)
    
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
      window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }
    
    setShowCollectionForm(true)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  if (!cardData) return null

  return (
    <div className="p-4">
      {/* Responsive layout: 
          - Always single column on mobile (bottom sheet)
          - Two columns on tablet/modal (md:flex-row) 
          - Single column on desktop/sidesheet (lg:flex-col)
      */}
      <div className="flex flex-col md:flex-row md:gap-4 lg:flex-col lg:gap-0">
        {/* Card Image */}
        <div className="flex justify-center md:flex-shrink-0 mb-4">
          <div className="relative w-48 md:w-40 lg:w-full lg:max-w-64">
            <Image
              src={getCardImageUrl(cardData.image, 'low', cardData.tcgplayer_image_url)}
              alt={cardData.name}
              width={240}
              height={336}
              className="w-full h-auto rounded-lg shadow-md"
              priority
            />
          </div>
        </div>

        {/* Card Details */}
        <div className="flex-1 space-y-4">
          {/* Pokemon Details */}
          <PokemonDetails card={cardData} />
          
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
              cardName={cardData.name}
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
  )
}

// Pokemon-specific details renderer
function PokemonDetails({ card }: { card: CardFull }) {
  const variants: string[] = []
  if (card.variant_normal) variants.push('Normal')
  if (card.variant_holo) variants.push('Holo')
  if (card.variant_reverse) variants.push('Reverse')
  if (card.variant_first_edition) variants.push('1st Edition')
  
  const prices = extractMarketPrices(card.price_data)
  const availablePrices = prices ? Object.entries(prices)
    .filter(([, price]) => price > 0)
    .map(([variant, price]) => ({
      label: variant,
      price: price as number
    })) : []

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-grey-900 mb-1">{card.name}</h3>
        <p className="text-sm text-grey-600">
          {card.set?.name || 'Unknown Set'} • #{card.local_id || 'No Number'}
        </p>
      </div>

      {/* Card Info - Responsive grid */}
      <div className="grid grid-cols-2 gap-3 text-sm lg:space-y-2 lg:block">
        {card.category && (
          <div className="lg:flex lg:justify-between">
            <p className="font-medium text-grey-500">Category</p>
            <p className="text-grey-900">{card.category}</p>
          </div>
        )}
        
        {card.rarity && (
          <div className="lg:flex lg:justify-between">
            <p className="font-medium text-grey-500">Rarity</p>
            <p className="text-grey-900">{card.rarity}</p>
          </div>
        )}

        {card.illustrator && (
          <div className="col-span-2 lg:flex lg:justify-between">
            <p className="font-medium text-grey-500">Illustrator</p>
            <p className="text-grey-900 lg:truncate lg:ml-2">{card.illustrator}</p>
          </div>
        )}

        {variants.length > 0 && (
          <div className="col-span-2 lg:flex lg:justify-between">
            <p className="font-medium text-grey-500">Variants</p>
            <p className="text-grey-900 lg:text-right lg:ml-2">
              {variants.join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Market Prices Section */}
      <div className="border-t pt-3 mt-3">
        <h4 className="text-sm font-semibold text-grey-900 mb-2">💰 Market Prices</h4>
        {availablePrices.length === 0 ? (
          <p className="text-sm text-grey-500 italic">Price data unavailable</p>
        ) : (
          <div className="space-y-1.5">
            {availablePrices.map(({ label, price }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-grey-600">{label}</span>
                <span className="font-semibold text-gray-900">
                  ${price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}