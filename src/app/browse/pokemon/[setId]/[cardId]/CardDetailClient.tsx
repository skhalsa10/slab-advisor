'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { getCardImageUrl } from '@/lib/pokemon-db'
import { getEbaySearchUrl } from '@/utils/external-links'
import AddToCollectionModal from '@/components/collection/AddToCollectionModal'
import type { CardFull, SetWithCards } from '@/models/pokemon'

interface CardDetailClientProps {
  card: CardFull
  set: SetWithCards
  setId: string
}

export default function CardDetailClient({ card, set, setId }: CardDetailClientProps) {
  const { user } = useAuth()
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Find current card index for navigation
  const currentCardIndex = set.cards.findIndex(c => c.id === card.id) ?? -1
  const previousCard = currentCardIndex > 0 ? set.cards[currentCardIndex - 1] : null
  const nextCard = currentCardIndex < set.cards.length - 1 ? set.cards[currentCardIndex + 1] : null

  // Build variants array from boolean fields (using database constraint values)
  const variants: string[] = []
  if (card.variant_normal) variants.push("normal")
  if (card.variant_holo) variants.push("holo")
  if (card.variant_reverse) variants.push("reverse_holo")
  if (card.variant_first_edition) variants.push("first_edition")
  
  // Ensure at least one variant is available
  const availableVariants = variants.length > 0 ? variants : ["normal"]

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
      window.location.href = '/auth/signin?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }
    
    setShowCollectionModal(true)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm">
        <Link href="/explore" className="text-grey-600 hover:text-grey-900">
          Explore
        </Link>
        <span className="text-grey-400">/</span>
        <Link href="/browse/pokemon" className="text-grey-600 hover:text-grey-900">
          Pokemon
        </Link>
        <span className="text-grey-400">/</span>
        <Link href={`/browse/pokemon/${setId}`} className="text-grey-600 hover:text-grey-900">
          {set.name}
        </Link>
        <span className="text-grey-400">/</span>
        <span className="text-grey-900 font-medium">{card.name}</span>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/browse/pokemon/${setId}`}
          className="text-sm text-orange-600 hover:text-orange-700"
        >
          ← Back to Set
        </Link>
        <div className="flex items-center space-x-4">
          {previousCard && (
            <Link
              href={`/browse/pokemon/${setId}/${previousCard.id}`}
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
              href={`/browse/pokemon/${setId}/${nextCard.id}`}
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

      {/* Card Details */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Card Image */}
        <div className="space-y-4">
          <div className="aspect-[2.5/3.5] relative rounded-lg overflow-hidden bg-grey-100 max-w-md mx-auto lg:mx-0">
            <Image
              src={getCardImageUrl(card.image, 'high', card.tcgplayer_image_url)}
              alt={card.name}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              onError={(e) => {
                e.currentTarget.src = '/card-placeholder.svg'
              }}
            />
          </div>
        </div>

        {/* Card Information */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-grey-900">{card.name}</h1>
            <p className="mt-2 text-lg text-grey-600">
              {card.category} • {set.name}
            </p>
          </div>

          {/* Success/Error Messages */}
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

          {/* Action Buttons */}
          <div className="space-y-3">
            <button 
              onClick={handleAddToCollectionClick}
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
            >
              {user ? 'Add to Collection' : 'Sign Up to Collect'}
            </button>

            {/* Shop Links */}
            <div className="space-y-3">
              {card.tcgplayer_product_id && (
                <a
                  href={`https://www.tcgplayer.com/product/${card.tcgplayer_product_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center px-4 py-3 border border-orange-600 text-orange-600 text-sm font-medium rounded-md hover:bg-orange-50 transition-colors"
                >
                  Shop on TCGPlayer
                  <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              
              <a
                href={getEbaySearchUrl(`${card.name} ${card.local_id} ${set.name}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-orange-600 text-orange-600 text-sm font-medium rounded-md hover:bg-orange-50 transition-colors"
              >
                Shop on eBay
                <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              
              <p className="text-xs text-grey-500 text-center">Shopping links may contain affiliate links</p>
            </div>
          </div>

          {/* Basic Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-grey-50 rounded-lg p-4">
              <p className="text-sm text-grey-600 mb-1">Card Number</p>
              <p className="text-lg font-semibold">#{card.local_id}</p>
            </div>
            {card.rarity && (
              <div className="bg-grey-50 rounded-lg p-4">
                <p className="text-sm text-grey-600 mb-1">Rarity</p>
                <p className="text-lg font-semibold">{card.rarity}</p>
              </div>
            )}
          </div>

          {/* Additional Card Info */}
          <div className="space-y-4">
            {/* Category */}
            {card.category && (
              <div className="bg-grey-50 rounded-lg p-4">
                <p className="text-sm text-grey-600 mb-1">Category</p>
                <p className="font-semibold">{card.category}</p>
              </div>
            )}

            {/* Illustrator */}
            {card.illustrator && (
              <div className="bg-grey-50 rounded-lg p-4">
                <p className="text-sm text-grey-600 mb-1">Illustrator</p>
                <p className="font-semibold">{card.illustrator}</p>
              </div>
            )}

            {/* Variants */}
            {variants.length > 0 && (
              <div className="bg-grey-50 rounded-lg p-4">
                <p className="text-sm text-grey-600 mb-3">Available Variants</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <span
                      key={variant}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        variant === 'Normal' ? 'bg-blue-100 text-blue-800' :
                        variant === 'Holo' ? 'bg-purple-100 text-purple-800' :
                        variant === 'Reverse' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {variant}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
}