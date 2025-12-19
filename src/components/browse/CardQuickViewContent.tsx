'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getCardImageUrl } from '@/lib/pokemon-db'
import { extractMarketPrices } from '@/utils/priceUtils'
import { getEbaySearchUrl } from '@/utils/external-links'
import { useAuth } from '@/hooks/useAuth'
import { usePreserveFilters } from '@/hooks/useURLFilters'
import AddToCollectionForm from '@/components/collection/AddToCollectionForm'
import { buildAvailableVariants } from '@/utils/variantUtils'
import { useQuickViewLayout } from '@/components/ui/QuickView'
import type { CardFull } from '@/models/pokemon'

interface CardQuickViewContentProps {
  cardId: string
  setId?: string
  cardType?: 'pokemon' | 'onepiece' | 'sports' | 'other'
  onClose?: () => void
  onCollectionUpdate?: () => void
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
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
  cardType = 'pokemon',
  onCollectionUpdate,
  onSuccess,
  onError
}: CardQuickViewContentProps) {
  const { user } = useAuth()
  const { buildHref } = usePreserveFilters()
  const layout = useQuickViewLayout()

  // Modal (tablet) uses two-column layout, sidesheet/bottomsheet use single column
  const isTwoColumn = layout === 'modal'
  const [cardData, setCardData] = useState<CardFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCollectionForm, setShowCollectionForm] = useState(false)

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
    setShowCollectionForm(false)

    // Notify parent to refresh ownership stats
    if (onCollectionUpdate) {
      onCollectionUpdate()
    }

    // Bubble up success message to parent for global toast
    if (onSuccess) {
      onSuccess(message)
    }
  }

  const handleCollectionError = (error: string) => {
    // Bubble up error message to parent for global toast
    if (onError) {
      onError(error)
    }
  }

  const handleAddToCollectionClick = () => {
    if (!user) {
      window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }

    setShowCollectionForm(true)
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
      {/* Layout: Two-column for modal (tablet), single column for sidesheet/bottomsheet */}
      <div className={isTwoColumn ? 'flex flex-row gap-6 items-start' : 'flex flex-col'}>
        {/* Card Image */}
        <div className={isTwoColumn ? 'flex-shrink-0' : 'flex justify-center mb-3'}>
          <div className={isTwoColumn ? 'w-48' : 'w-full max-w-[200px]'}>
            <Image
              src={getCardImageUrl(cardData.image, 'low', cardData.tcgplayer_image_url)}
              alt={cardData.name}
              width={200}
              height={280}
              className="w-full h-auto rounded-lg shadow-md"
              priority
            />
          </div>
        </div>

        {/* Card Details */}
        <div className="flex-1 space-y-3">
          {/* Pokemon Details */}
          <PokemonDetails
            card={cardData}
            detailsHref={buildHref(`/browse/pokemon/${setId}/${cardId}`)}
            isTwoColumn={isTwoColumn}
          />

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
              <button
                onClick={handleAddToCollectionClick}
                className="w-full bg-orange-600 text-white py-2.5 px-4 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
              >
                {user ? 'Add to Collection' : 'Sign Up to Collect'}
              </button>

              {/* Shop Links - Neutral colors to let Add button stand out */}
              <div className="grid grid-cols-2 gap-2">
                {cardData.tcgplayer_product_id && (
                  <a
                    href={`https://www.tcgplayer.com/product/${cardData.tcgplayer_product_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-3 py-2 border border-grey-300 text-grey-600 text-xs font-medium rounded-md hover:border-grey-400 hover:text-grey-800 hover:bg-grey-50 transition-colors"
                  >
                    {/* Shopping bag icon */}
                    <svg className="mr-1.5 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    TCGPlayer
                    <svg className="ml-1 w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                <a
                  href={getEbaySearchUrl(`${cardData.name} ${cardData.local_id} ${cardData.set?.name || ''}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center px-3 py-2 border border-grey-300 text-grey-600 text-xs font-medium rounded-md hover:border-grey-400 hover:text-grey-800 hover:bg-grey-50 transition-colors ${!cardData.tcgplayer_product_id ? 'col-span-2' : ''}`}
                >
                  {/* Shopping bag icon */}
                  <svg className="mr-1.5 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  eBay
                  <svg className="ml-1 w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              <p className="text-xs text-grey-400 text-center">Shopping links may contain affiliate links</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Price variant sort order: Normal first, then Holo, then Reverse, then others
const VARIANT_SORT_ORDER: Record<string, number> = {
  'Normal': 1,
  'Holofoil': 2,
  'Reverse Holofoil': 3,
  '1st Edition Holofoil': 4,
  '1st Edition Normal': 5,
}

// Pokemon-specific details renderer
function PokemonDetails({ card, detailsHref, isTwoColumn = false }: { card: CardFull; detailsHref: string; isTwoColumn?: boolean }) {
  const variants: string[] = []
  if (card.variant_normal) variants.push('Normal')
  if (card.variant_holo) variants.push('Holo')
  if (card.variant_reverse) variants.push('Reverse')
  if (card.variant_first_edition) variants.push('1st Edition')

  const prices = extractMarketPrices(card.price_data)
  // Sort prices: Normal first, then Holo, then Reverse, then alphabetically for others
  const availablePrices = prices ? Object.entries(prices)
    .filter(([, price]) => price > 0)
    .map(([variant, price]) => ({
      label: variant,
      price: price as number
    }))
    .sort((a, b) => {
      const aOrder = VARIANT_SORT_ORDER[a.label] ?? 99
      const bOrder = VARIANT_SORT_ORDER[b.label] ?? 99
      if (aOrder !== bOrder) return aOrder - bOrder
      return a.label.localeCompare(b.label)
    }) : []

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-base font-semibold text-grey-900 mb-0.5">{card.name}</h3>
        <p className="text-sm text-grey-600">
          {card.set?.name || 'Unknown Set'} • #{card.local_id || 'No Number'}
        </p>
        {/* Neutral gray link - lets orange Add button stand out */}
        <Link
          href={detailsHref}
          className="inline-flex items-center text-sm text-grey-500 hover:text-orange-600 mt-0.5 transition-colors"
        >
          View card details
          <svg className="w-3.5 h-3.5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Card Info - 2x2 grid for modal (tablet), vertical list for sidesheet/bottomsheet */}
      <div className={isTwoColumn ? 'grid grid-cols-2 gap-x-4 gap-y-2 text-sm' : 'space-y-1 text-sm'}>
        {card.category && (
          <div className={isTwoColumn ? '' : 'flex justify-between'}>
            <p className="font-medium text-grey-500 text-xs uppercase tracking-wide">Category</p>
            <p className="text-grey-900">{card.category}</p>
          </div>
        )}

        {card.rarity && (
          <div className={isTwoColumn ? '' : 'flex justify-between'}>
            <p className="font-medium text-grey-500 text-xs uppercase tracking-wide">Rarity</p>
            <p className="text-grey-900">{card.rarity}</p>
          </div>
        )}

        {card.illustrator && (
          <div className={isTwoColumn ? '' : 'flex justify-between'}>
            <p className="font-medium text-grey-500 text-xs uppercase tracking-wide">Illustrator</p>
            <p className={isTwoColumn ? 'text-grey-900' : 'text-grey-900 truncate max-w-[180px]'}>{card.illustrator}</p>
          </div>
        )}

        {variants.length > 0 && (
          <div className={isTwoColumn ? '' : 'flex justify-between'}>
            <p className="font-medium text-grey-500 text-xs uppercase tracking-wide">Variants</p>
            <p className="text-grey-900">
              {variants.join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Market Prices Section - Tighter spacing */}
      <div className="border-t pt-2 mt-2">
        <h4 className="text-sm font-semibold text-grey-900 mb-1.5">Market Prices</h4>
        {availablePrices.length === 0 ? (
          <p className="text-sm text-grey-500 italic">Price data unavailable</p>
        ) : (
          <div className="space-y-1">
            {availablePrices.map(({ label, price }) => (
              <div key={label} className="flex items-baseline text-sm">
                <span className="text-grey-600">{label}</span>
                {/* Dotted leader to guide eye from label to price */}
                <span className="flex-1 border-b border-dotted border-grey-300 mx-2 mb-1" />
                <span className="font-semibold text-grey-900">
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
