'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import type { CardIdentificationResult, DatabaseCardMatch, Match } from '@/types/ximilar'

interface ScanResultsViewProps {
  result: CardIdentificationResult
  onConfirm: (cardId: string, variant: string, quantity: number) => Promise<boolean>
  onRetry: () => void
  onCancel: () => void
  isAdding?: boolean
}

interface CarouselCardProps {
  ximilarMatch: Match
  databaseCard: DatabaseCardMatch
  confidence: number
  isSelected: boolean
}

function CarouselCard({
  ximilarMatch,
  databaseCard,
  confidence,
  isSelected
}: CarouselCardProps) {
  // Use images from our database
  const imageUrl = databaseCard.tcgplayer_image_url || databaseCard.image

  const cardName = databaseCard.name || ximilarMatch.full_name || 'Unknown Card'
  const setName = databaseCard.set_name || ximilarMatch.set || 'Unknown Set'
  const cardNumber = databaseCard.local_id || ximilarMatch.card_number || ''

  return (
    <div
      className={`
        flex-shrink-0 w-[200px] snap-center
        transition-all duration-300
        ${isSelected ? 'scale-100' : 'scale-90 opacity-60'}
      `}
    >
      {/* Card image - large */}
      <div className={`
        relative aspect-[2.5/3.5] bg-grey-100 rounded-xl overflow-hidden shadow-lg
        transition-all duration-300
        ${isSelected ? 'ring-4 ring-orange-500 ring-offset-2' : ''}
      `}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={cardName}
            fill
            className="object-contain"
            sizes="200px"
            priority={isSelected}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-grey-400">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Confidence badge */}
        <div className={`
          absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium
          ${confidence >= 0.9 ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}
        `}>
          {Math.round(confidence * 100)}%
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-2 left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Card info below image */}
      <div className="mt-3 text-center px-2">
        <p className="font-semibold text-grey-900 text-sm line-clamp-2">{cardName}</p>
        <p className="text-xs text-grey-600 mt-1">{setName}</p>
        {cardNumber && (
          <p className="text-xs text-grey-500">#{cardNumber}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Scan Results View Component
 *
 * Displays identification results as a horizontal swipeable carousel
 * with large card images. Allows user to confirm selection and add to collection.
 */
export default function ScanResultsView({
  result,
  onConfirm,
  onRetry,
  onCancel,
  isAdding = false
}: ScanResultsViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [variant, setVariant] = useState('normal')
  const [quantity, setQuantity] = useState(1)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Combine best match and alternatives into a single list
  // Filter to only include cards that are in our database
  const allMatches: Array<{
    ximilarMatch: Match
    databaseCard: DatabaseCardMatch
    confidence: number
  }> = []

  if (result.bestMatch?.databaseCard) {
    allMatches.push(result.bestMatch as { ximilarMatch: Match; databaseCard: DatabaseCardMatch; confidence: number })
  }

  if (result.alternatives) {
    result.alternatives.forEach(alt => {
      if (alt.databaseCard) {
        allMatches.push(alt as { ximilarMatch: Match; databaseCard: DatabaseCardMatch; confidence: number })
      }
    })
  }

  const selectedMatch = allMatches[selectedIndex]
  const canAdd = selectedMatch?.databaseCard != null

  // Scroll to selected card when index changes
  useEffect(() => {
    if (carouselRef.current) {
      const cardWidth = 200 + 16 // card width + gap
      const scrollPosition = selectedIndex * cardWidth - (carouselRef.current.offsetWidth / 2 - cardWidth / 2)
      carouselRef.current.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      })
    }
  }, [selectedIndex])

  // Handle scroll snap to update selected index
  const handleScroll = () => {
    if (carouselRef.current) {
      const cardWidth = 200 + 16
      const scrollPosition = carouselRef.current.scrollLeft + carouselRef.current.offsetWidth / 2
      const newIndex = Math.round(scrollPosition / cardWidth - 0.5)
      const clampedIndex = Math.max(0, Math.min(allMatches.length - 1, newIndex))
      if (clampedIndex !== selectedIndex) {
        setSelectedIndex(clampedIndex)
      }
    }
  }

  const handleConfirm = async () => {
    if (!selectedMatch?.databaseCard) return

    const success = await onConfirm(
      selectedMatch.databaseCard.id,
      variant,
      quantity
    )

    if (success) {
      setSelectedIndex(0)
      setVariant('normal')
      setQuantity(1)
    }
  }

  // Error state
  if (!result.success || allMatches.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-grey-900 mb-2">Could Not Identify Card</h3>
        <p className="text-sm text-grey-600 mb-6">
          {result.error || 'We couldn\'t identify the card in this image. Try taking another photo with better lighting.'}
        </p>

        {result.capturedImage && (
          <div className="mb-6 max-w-xs mx-auto">
            {/* eslint-disable-next-line @next/next/no-img-element -- TODO: Refactor to blob URLs */}
            <img
              src={result.capturedImage}
              alt="Captured card"
              className="w-full rounded-lg border border-grey-200"
            />
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-grey-700 hover:bg-grey-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 text-center">
        <h3 className="text-lg font-medium text-grey-900">Card Identified</h3>
        <p className="text-sm text-grey-600">
          {allMatches.length === 1
            ? 'We found a match for your card'
            : `Swipe to view ${allMatches.length} possible matches`
          }
        </p>
      </div>

      {/* Horizontal Carousel */}
      <div className="flex-1 flex flex-col justify-center">
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-[calc(50%-108px)] pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {allMatches.map((match, index) => (
            <div
              key={index}
              onClick={() => setSelectedIndex(index)}
              className="cursor-pointer"
            >
              <CarouselCard
                ximilarMatch={match.ximilarMatch}
                databaseCard={match.databaseCard}
                confidence={match.confidence}
                isSelected={selectedIndex === index}
              />
            </div>
          ))}
        </div>

        {/* Pagination dots */}
        {allMatches.length > 1 && (
          <div className="flex justify-center gap-2 py-2">
            {allMatches.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`
                  w-2 h-2 rounded-full transition-all
                  ${selectedIndex === index
                    ? 'w-6 bg-orange-500'
                    : 'bg-grey-300 hover:bg-grey-400'
                  }
                `}
                aria-label={`Go to match ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add to collection form - compact */}
      {canAdd && (
        <div className="px-4 py-3 border-t border-grey-200 bg-grey-50">
          <div className="flex items-center gap-4">
            {/* Variant */}
            <div className="flex-1">
              <select
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-grey-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="normal">Normal</option>
                <option value="holo">Holo</option>
                <option value="reverse_holo">Reverse Holo</option>
                <option value="first_edition">1st Edition</option>
                <option value="illustration_rare">Illustration Rare</option>
                <option value="alt_art">Alt Art</option>
                <option value="full_art">Full Art</option>
                <option value="secret_rare">Secret Rare</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg border border-grey-300 flex items-center justify-center hover:bg-grey-100 text-lg"
              >
                -
              </button>
              <span className="w-6 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg border border-grey-300 flex items-center justify-center hover:bg-grey-100 text-lg"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="p-4 border-t border-grey-200 flex gap-3">
        <button
          onClick={onRetry}
          disabled={isAdding}
          className="flex-1 px-4 py-3 text-grey-700 bg-grey-100 rounded-lg hover:bg-grey-200 transition-colors disabled:opacity-50"
        >
          Scan Again
        </button>
        <button
          onClick={handleConfirm}
          disabled={!canAdd || isAdding}
          className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isAdding ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Adding...
            </>
          ) : !canAdd ? (
            'Not in Database'
          ) : (
            'Add to Collection'
          )}
        </button>
      </div>
    </div>
  )
}
