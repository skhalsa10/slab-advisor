'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { usePreserveFilters } from '@/hooks/useURLFilters'
import { getCardImageUrl } from '@/lib/pokemon-db'
import { getEbaySearchUrl } from '@/utils/external-links'
import AddToCollectionModal from '@/components/collection/AddToCollectionModal'
import { buildAvailableVariants } from '@/utils/variantUtils'
import { PriceWidget, PriceWidgetEmpty, PriceWidgetProvider, VariantSwatch, PriceHeadline } from '@/components/prices'
import type { CardFull, SetWithCards } from '@/models/pokemon'
import type { PokemonCardPrices } from '@/types/prices'

interface CardDetailClientProps {
  card: CardFull
  set: SetWithCards
  setId: string
  priceData?: PokemonCardPrices | null
}

export default function CardDetailClient({ card, set, setId, priceData }: CardDetailClientProps) {
  const { user } = useAuth()
  const { buildHref } = usePreserveFilters()
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Find current card index for navigation
  const currentCardIndex = set.cards.findIndex(c => c.id === card.id) ?? -1
  const previousCard = currentCardIndex > 0 ? set.cards[currentCardIndex - 1] : null
  const nextCard = currentCardIndex < set.cards.length - 1 ? set.cards[currentCardIndex + 1] : null

  // Build variants array from boolean fields (including pattern variants)
  const availableVariants = buildAvailableVariants(card)

  const handleCollectionSuccess = (message: string) => {
    setSuccessMessage(message)
    setErrorMessage(null)
    setShowCollectionModal(false)
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage(null)
    }, 5000)
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
    
    setShowCollectionModal(true)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  // Content to render (used with or without provider)
  const content = (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={buildHref(`/browse/pokemon/${setId}`)}
          className="text-sm text-orange-600 hover:text-orange-700"
        >
          ← Back to Set
        </Link>
        <div className="flex items-center space-x-4">
          {previousCard && (
            <Link
              href={buildHref(`/browse/pokemon/${setId}/${previousCard.id}`)}
              className="p-2 rounded-lg hover:bg-grey-100 transition-colors"
              title="Previous card"
            >
              <svg className="w-5 h-5 text-grey-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          )}
          <span className="text-sm text-grey-600">
            Card {currentCardIndex + 1} of {set.cards.length}
          </span>
          {nextCard && (
            <Link
              href={buildHref(`/browse/pokemon/${setId}/${nextCard.id}`)}
              className="p-2 rounded-lg hover:bg-grey-100 transition-colors"
              title="Next card"
            >
              <svg className="w-5 h-5 text-grey-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Card Details - Finance Layout
          Mobile: flex-col with order classes to reorder sections
          Desktop: 35/65 grid split */}
      <div className="flex flex-col lg:grid lg:grid-cols-[2fr_3fr] gap-6 lg:gap-8">

        {/* SECTION 1: Card Image + Metadata - order-1 on mobile (top), left column on desktop */}
        <div className="order-1 lg:order-none flex flex-col items-center lg:items-start gap-4">
          <Image
            src={getCardImageUrl(card.image, 'low', card.tcgplayer_image_url)}
            alt={card.name}
            width={320}
            height={448}
            className="rounded-lg max-w-xs w-full h-auto"
            sizes="(max-width: 1024px) 100vw, 320px"
            priority
            onError={(e) => {
              e.currentTarget.src = '/card-placeholder.svg'
            }}
          />

          {/* Card Specs - visible on desktop only (mobile shows at bottom) */}
          <div className="hidden lg:block max-w-xs w-full border border-gray-100 rounded-lg bg-white divide-y divide-gray-100">
            <div className="flex justify-between items-center px-3 py-2.5">
              <span className="text-xs text-gray-400">Number</span>
              <span className="text-sm font-medium text-gray-900">#{card.local_id}</span>
            </div>
            {card.rarity && (
              <div className="flex justify-between items-center px-3 py-2.5">
                <span className="text-xs text-gray-400">Rarity</span>
                <span className="text-sm font-medium text-gray-900">{card.rarity}</span>
              </div>
            )}
            {card.category && (
              <div className="flex justify-between items-center px-3 py-2.5">
                <span className="text-xs text-gray-400">Category</span>
                <span className="text-sm font-medium text-gray-900">{card.category}</span>
              </div>
            )}
            {card.illustrator && (
              <div className="flex justify-between items-center px-3 py-2.5">
                <span className="text-xs text-gray-400">Illustrator</span>
                <span className="text-sm font-medium text-gray-900">{card.illustrator}</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: Data Column - order-2 on mobile (after image), normal on desktop */}
        <div className="order-2 lg:order-none space-y-5">
          {/* 1. Title (compact) */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{card.name}</h1>
            <p className="text-sm text-gray-500">{set.name}</p>
          </div>

          {/* Mobile: Scrollable metadata pills - directly under title */}
          <div className="lg:hidden relative -mx-6">
            <div className="flex gap-2 overflow-x-auto px-6 pb-2">
              <span className="flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-full bg-grey-100 text-sm text-grey-700 whitespace-nowrap">
                <span className="text-grey-500 mr-1">Number:</span>
                <span className="font-medium">#{card.local_id}</span>
              </span>
              {card.rarity && (
                <span className="flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-full bg-grey-100 text-sm text-grey-700 whitespace-nowrap">
                  <span className="text-grey-500 mr-1">Rarity:</span>
                  <span className="font-medium">{card.rarity}</span>
                </span>
              )}
              {card.category && (
                <span className="flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-full bg-grey-100 text-sm text-grey-700 whitespace-nowrap">
                  <span className="text-grey-500 mr-1">Category:</span>
                  <span className="font-medium">{card.category}</span>
                </span>
              )}
              {card.illustrator && (
                <span className="flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-full bg-grey-100 text-sm text-grey-700 whitespace-nowrap">
                  <span className="text-grey-500 mr-1">Illustrator:</span>
                  <span className="font-medium">{card.illustrator}</span>
                </span>
              )}
            </div>
            {/* Right gradient fade indicator */}
            <div
              className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none"
              aria-hidden="true"
            />
          </div>

          {/* 2. Price Section - tightly coupled: Headline → Swatch → Chart */}
          <div className="space-y-2">
            {priceData && <PriceHeadline />}
            {priceData && <VariantSwatch />}
            {priceData ? (
              <PriceWidget hideVariantSwatch hidePriceHeadline />
            ) : (
              <PriceWidgetEmpty />
            )}
          </div>

          {/* 3. Success/Error Messages */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
              {errorMessage}
            </div>
          )}

          {/* 4. Action Rows - hidden on mobile (moved to sticky footer) */}
          <div className="hidden lg:block space-y-2">
            {/* Primary CTA */}
            <button
              onClick={handleAddToCollectionClick}
              className="w-full bg-orange-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
            >
              {user ? 'Add to Collection' : 'Sign Up to Collect'}
            </button>

            {/* Shop Links Row - TCG first, then eBay */}
            <div className="flex items-center gap-2">
              {card.tcgplayer_product_id && (
                <a
                  href={`https://www.tcgplayer.com/product/${card.tcgplayer_product_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  TCGPlayer
                </a>
              )}
              <a
                href={getEbaySearchUrl(`${card.name} ${card.local_id} ${set.name}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                eBay
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Mobile Sticky Action Bar - fixed at bottom on mobile only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3 pb-10 z-50">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <button
            onClick={handleAddToCollectionClick}
            className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
          >
            {user ? 'Add to Collection' : 'Sign Up to Collect'}
          </button>
          {card.tcgplayer_product_id && (
            <a
              href={`https://www.tcgplayer.com/product/${card.tcgplayer_product_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
              title="Shop on TCGPlayer"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </a>
          )}
          <a
            href={getEbaySearchUrl(`${card.name} ${card.local_id} ${set.name}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
            title="Shop on eBay"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </a>
        </div>
      </div>

      {/* Spacer for mobile sticky footer */}
      <div className="lg:hidden h-28" />

      {/* Collection Modal */}
      <AddToCollectionModal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        cardId={card.id}
        cardName={card.name}
        availableVariants={availableVariants}
        onSuccess={handleCollectionSuccess}
        onError={handleCollectionError}
      />
    </div>
  )

  // Wrap in PriceWidgetProvider when we have price data
  // This allows VariantSwatch and PriceWidget to share state
  if (priceData) {
    return (
      <PriceWidgetProvider priceData={priceData}>
        {content}
      </PriceWidgetProvider>
    )
  }

  return content
}